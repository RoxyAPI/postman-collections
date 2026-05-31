/**
 * Autopilot sync: RoxyAPI OpenAPI specs -> public Postman workspace.
 *
 * @remarks
 * Nothing about the catalog is hardcoded. Each run discovers the live set of product domains from the OpenAPI spec, rebuilds only the collections whose spec changed since the last run, and pushes them to the Postman API. Adding a domain, or adding / removing / renaming routes inside one, requires no edit here: the next scheduled run reflects it automatically.
 *
 * Pipeline per run:
 *  1. Discover domains: read the combined spec, take every distinct first path segment, keep the ones that serve their own per-domain spec (a 200 at `/api/v2/{slug}/openapi.json`). App utility routes (languages, usage) return 401 and drop out, so no exclusion list is needed.
 *  2. Change-gate: compare the canonical `{ paths, components }` of each live per-domain spec against the vendored baseline in `specs/{slug}.json`. Unchanged and already-published domains are skipped (zero Postman writes).
 *  3. Build: rewrite the spec server to the absolute domain base so request URLs resolve correctly, convert with openapi-to-postmanv2, stamp a `roxySlug` provenance variable plus an empty `apiKey` so a forked collection is self-contained.
 *  4. Publish: resolve the existing collection UID (cache, then workspace name match), then PUT it; create + capture the UID when it does not exist yet.
 *  5. Persist: write `specs/{slug}.json` (next run's diff baseline), `collections/{slug}.json` (browsable artifact), and the auto-written `collections.json` UID cache. The workflow commits these back.
 *
 * Flags: `--dry-run` (discover, diff and build but make no Postman writes; no API key required, used by CI), `--force` (rebuild and publish every domain regardless of diff), `--prune` (delete collections for domains that no longer exist; off by default so a transient outage cannot wipe the workspace).
 */

import { join } from 'node:path';
import Converter from 'openapi-to-postmanv2';

const API_ORIGIN = 'https://roxyapi.com';
const COMBINED_SPEC_URL = `${API_ORIGIN}/api/v2/openapi.json`;
const POSTMAN_API = 'https://api.getpostman.com';

/** Public RoxyAPI Postman workspace (postman.com/roxylabs-7113570/roxyapi). Non-secret. */
const WORKSPACE_ID = '65ae6f04-2308-4922-ada7-1a9ad50683cd';

const CONVERT_OPTIONS = {
	folderStrategy: 'Tags',
	requestParametersResolution: 'Example',
	exampleParametersResolution: 'Example',
} as const;

const ROOT = join(import.meta.dir, '..');
const SPECS_DIR = join(ROOT, 'specs');
const COLLECTIONS_DIR = join(ROOT, 'collections');
const CACHE_PATH = join(ROOT, 'collections.json');

interface OpenAPISpec {
	info: { title: string };
	servers?: unknown[];
	paths: Record<string, unknown>;
	components?: Record<string, unknown>;
}

interface PostmanVariable {
	key: string;
	value: string;
	type?: string;
}

interface PostmanCollection {
	info: { name: string; schema: string };
	variable?: PostmanVariable[];
	item: unknown[];
	auth?: unknown;
	event?: unknown[];
}

interface CacheEntry {
	uid: string;
	title: string;
}

type Cache = Record<string, CacheEntry>;

const args = new Set(process.argv.slice(2));
const FORCE = args.has('--force');
const PRUNE = args.has('--prune');
const POSTMAN_API_KEY = process.env.POSTMAN_API_KEY;
const DRY_RUN = args.has('--dry-run') || !POSTMAN_API_KEY;

if (!POSTMAN_API_KEY && !args.has('--dry-run')) {
	console.error(
		'POSTMAN_API_KEY is not set. Export it to publish, or pass --dry-run to validate without writing.',
	);
	process.exit(1);
}

function canonical(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === 'object') {
		const source = value as Record<string, unknown>;
		const out: Record<string, unknown> = {};
		for (const key of Object.keys(source).sort())
			out[key] = canonical(source[key]);
		return out;
	}
	return value;
}

/** Stable fingerprint of the parts of a spec that affect the generated collection. */
function fingerprint(spec: OpenAPISpec): string {
	return JSON.stringify(
		canonical({ paths: spec.paths, components: spec.components ?? null }),
	);
}

/** Bypass edge cache so the diff baseline always compares against the freshest origin spec, not a stale CDN node. */
const SPEC_FETCH: RequestInit = { headers: { 'Cache-Control': 'no-cache' } };

async function fetchJson<T>(url: string): Promise<T> {
	const res = await fetch(url, SPEC_FETCH);
	if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
	return (await res.json()) as T;
}

async function readJsonFile<T>(path: string): Promise<T | null> {
	const file = Bun.file(path);
	return (await file.exists()) ? ((await file.json()) as T) : null;
}

function writeJsonFile(path: string, data: unknown): Promise<number> {
	return Bun.write(path, `${JSON.stringify(data, null, '\t')}\n`);
}

async function postman<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${POSTMAN_API}${path}`, {
		...init,
		headers: {
			'X-Api-Key': POSTMAN_API_KEY as string,
			'Content-Type': 'application/json',
			...init?.headers,
		},
	});
	if (!res.ok)
		throw new Error(
			`${init?.method ?? 'GET'} ${path} -> ${res.status}: ${await res.text()}`,
		);
	return (await res.json()) as T;
}

/** Discover the live product domains: combined-spec path segments that serve their own per-domain spec. */
async function discoverDomains(): Promise<
	{ slug: string; spec: OpenAPISpec }[]
> {
	const combined = await fetchJson<OpenAPISpec>(COMBINED_SPEC_URL);
	const candidates = new Set<string>();
	for (const path of Object.keys(combined.paths)) {
		const segment = path.split('/')[1];
		if (segment) candidates.add(segment);
	}
	const probed = await Promise.all(
		[...candidates].sort().map(async (slug) => {
			const res = await fetch(
				`${API_ORIGIN}/api/v2/${slug}/openapi.json`,
				SPEC_FETCH,
			);
			if (!res.ok) return null;
			return { slug, spec: (await res.json()) as OpenAPISpec };
		}),
	);
	return probed.filter(
		(d): d is { slug: string; spec: OpenAPISpec } => d !== null,
	);
}

/** Convert one domain spec into a self-contained, auth-configured Postman collection. */
function buildCollection(
	slug: string,
	spec: OpenAPISpec,
): Promise<PostmanCollection> {
	// Deep clone: the converter mutates paths/components in place, and the caller writes `spec` as the diff baseline afterwards, so it must stay pristine.
	const scoped = structuredClone(spec);
	scoped.servers = [
		{
			url: `${API_ORIGIN}/api/v2/${slug}`,
			description: 'RoxyAPI v2 production',
		},
	];
	return new Promise((resolve, reject) => {
		Converter.convert(
			{ type: 'json', data: scoped },
			CONVERT_OPTIONS,
			(err, result) => {
				if (err)
					return reject(err instanceof Error ? err : new Error(String(err)));
				if (!result?.result || !result.output?.[0])
					return reject(new Error(result?.reason ?? 'conversion failed'));
				const collection = result.output[0].data as PostmanCollection;
				collection.variable = [
					...(collection.variable ?? []),
					{ key: 'apiKey', value: '', type: 'string' },
					{ key: 'roxySlug', value: slug, type: 'string' },
				];
				resolve(collection);
			},
		);
	});
}

async function main(): Promise<void> {
	console.log(DRY_RUN ? 'sync: DRY RUN (no Postman writes)\n' : 'sync: live\n');

	const domains = await discoverDomains();
	console.log(
		`discovered ${domains.length} domains: ${domains.map((d) => d.slug).join(', ')}\n`,
	);

	const cache: Cache = (await readJsonFile<Cache>(CACHE_PATH)) ?? {};

	// Resolve existing collections by name from the live workspace (source of truth for UIDs).
	const nameToUid = new Map<string, string>();
	if (!DRY_RUN) {
		const { collections } = await postman<{
			collections: { uid: string; name: string }[];
		}>(`/collections?workspace=${WORKSPACE_ID}`);
		for (const c of collections) {
			if (nameToUid.has(c.name))
				console.warn(`warn: duplicate collection name in workspace: ${c.name}`);
			else nameToUid.set(c.name, c.uid);
		}
	}

	const created: string[] = [];
	const updated: string[] = [];
	const unchanged: string[] = [];

	for (const { slug, spec } of domains) {
		const title = spec.info.title;
		const baseline = await readJsonFile<OpenAPISpec>(
			join(SPECS_DIR, `${slug}.json`),
		);
		const specChanged =
			!baseline || fingerprint(baseline) !== fingerprint(spec);
		const uid = cache[slug]?.uid ?? nameToUid.get(title);
		const needsBuild = FORCE || specChanged || (!DRY_RUN && !uid);

		if (!needsBuild) {
			unchanged.push(slug);
			if (uid) cache[slug] = { uid, title };
			continue;
		}

		const collection = await buildCollection(slug, spec);
		await writeJsonFile(join(SPECS_DIR, `${slug}.json`), spec);
		await writeJsonFile(join(COLLECTIONS_DIR, `${slug}.json`), collection);

		if (DRY_RUN) {
			(specChanged ? created : updated).push(`${slug} (dry)`);
			continue;
		}

		if (uid) {
			await postman(`/collections/${uid}`, {
				method: 'PUT',
				body: JSON.stringify({ collection }),
			});
			cache[slug] = { uid, title };
			updated.push(slug);
		} else {
			const res = await postman<{ collection: { uid: string } }>(
				`/collections?workspace=${WORKSPACE_ID}`,
				{
					method: 'POST',
					body: JSON.stringify({ collection }),
				},
			);
			cache[slug] = { uid: res.collection.uid, title };
			created.push(slug);
		}
	}

	// Domains that vanished from the API: warn, and only delete under --prune.
	const liveSlugs = new Set(domains.map((d) => d.slug));
	const removed: string[] = [];
	for (const slug of Object.keys(cache)) {
		if (liveSlugs.has(slug)) continue;
		if (PRUNE && !DRY_RUN) {
			await postman(`/collections/${cache[slug].uid}`, { method: 'DELETE' });
			delete cache[slug];
			removed.push(slug);
		} else {
			console.warn(
				`warn: '${slug}' is in the cache but no longer served. Run with --prune to delete it.`,
			);
		}
	}

	await writeJsonFile(
		CACHE_PATH,
		Object.fromEntries(
			Object.keys(cache)
				.sort()
				.map((k) => [k, cache[k]]),
		),
	);

	console.log('\nsummary');
	console.log(`  created:   ${created.length ? created.join(', ') : '-'}`);
	console.log(`  updated:   ${updated.length ? updated.join(', ') : '-'}`);
	console.log(`  unchanged: ${unchanged.length ? unchanged.join(', ') : '-'}`);
	if (removed.length) console.log(`  pruned:    ${removed.join(', ')}`);
}

await main();
