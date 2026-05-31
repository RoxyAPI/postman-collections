# RoxyAPI Postman Collections - Maintainer Guide

This repo publishes the RoxyAPI catalog to a public Postman workspace. It is fully autopilot. Read this before changing anything.

## The one rule

Do not hand edit `collections/`, `specs/`, or `collections.json`. They are generated. The OpenAPI specs at `roxyapi.com` are the single source of truth. To change a collection, change the API, not this repo.

## Adding a domain

Nothing to do here. When a new domain ships and starts serving `https://roxyapi.com/api/v2/{slug}/openapi.json`, the next sync discovers it, creates a collection, records its UID, and commits the artifacts. Adding, removing, or renaming routes inside a domain is handled the same way.

## How sync works (`scripts/sync.ts`)

1. **Discover.** Fetch the combined spec, take every distinct first path segment, keep the ones that serve their own per-domain spec (a 200 at `/api/v2/{slug}/openapi.json`). App utility routes return 401 and drop out, so there is no exclusion list to maintain.
2. **Diff.** Compare the canonical `{ paths, components }` of each live spec against the vendored baseline in `specs/{slug}.json`. Unchanged, already published domains are skipped. No Postman write happens unless the spec changed.
3. **Build.** Rewrite the spec server to the absolute domain base so request URLs resolve, convert with `openapi-to-postmanv2`, then stamp a `roxySlug` variable (stable provenance marker, survives title renames) and an empty `apiKey` so a forked collection is self contained.
4. **Publish.** Resolve the existing collection UID from the cache, then from the live workspace by name. PUT when it exists, POST to create when it does not, and capture the new UID.
5. **Persist.** Write `specs/{slug}.json`, `collections/{slug}.json`, and `collections.json`. The workflow commits them so the next diff has a current baseline.

## Commands

```bash
bun install
bun run sync --dry-run   # discover, diff, build, write files. No Postman writes. No key needed.
bun run sync             # live. Requires POSTMAN_API_KEY.
bun run sync --force     # rebuild and publish every domain regardless of diff.
bun run sync --prune     # also delete collections for domains no longer served. Off by default.
bun typecheck
bun run check            # biome lint and format
```

## Flags and safety

- `--dry-run` is what CI runs. It proves discovery and conversion work without touching Postman.
- A removed domain is logged, not deleted, unless `--prune` is passed. This prevents a transient API outage from wiping the workspace.
- Spec fetches send `Cache-Control: no-cache` so the diff baseline reflects the freshest origin spec.

## Secrets and config

- `POSTMAN_API_KEY` (repo secret) is the only secret. It is needed for live runs only.
- The workspace ID is non secret and lives in `scripts/sync.ts`.

## Automation

`.github/workflows/sync.yml` runs daily at 06:00 UTC, on manual dispatch, and on a `repository_dispatch` of type `openapi-updated`. It runs the live sync and commits any regenerated artifacts. `.github/workflows/ci.yml` runs lint, typecheck, and a dry run on every PR.
