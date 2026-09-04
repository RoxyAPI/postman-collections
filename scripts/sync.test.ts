import { describe, expect, test } from 'bun:test';
import { canonical, fingerprint } from './sync';

/** Minimal spec shape the fingerprint reads from. Extra `info` fields (version, license, contact.url) are included where a case needs them. */
function spec(overrides: {
	title?: string;
	description?: string;
	contact?: { name?: string; email?: string; url?: string };
	version?: string;
	paths?: Record<string, unknown>;
	components?: Record<string, unknown>;
}) {
	return {
		info: {
			title: overrides.title ?? 'Forecast API',
			description:
				overrides.description ?? 'Merges transits into one timeline.',
			contact: overrides.contact,
			version: overrides.version,
		},
		paths: overrides.paths ?? { '/forecast': { get: {} } },
		components: overrides.components ?? { schemas: {} },
	};
}

describe('fingerprint', () => {
	test('is stable when nothing changes', () => {
		expect(fingerprint(spec({}))).toBe(fingerprint(spec({})));
	});

	test('changes when only info.description changes and paths/components are identical', () => {
		const before = spec({ description: '14 domains, 209+ endpoints.' });
		const after = spec({ description: '18 domains, 258+ endpoints.' });
		expect(fingerprint(before)).not.toBe(fingerprint(after));
	});

	test('changes when only info.title changes', () => {
		const before = spec({ title: 'Forecast API' });
		const after = spec({ title: 'Forecast API v2' });
		expect(fingerprint(before)).not.toBe(fingerprint(after));
	});

	test('changes when only contact.name or contact.email changes', () => {
		const before = spec({ contact: { name: 'RoxyAPI Support' } });
		const after = spec({ contact: { name: 'Someone Else' } });
		expect(fingerprint(before)).not.toBe(fingerprint(after));

		const beforeEmail = spec({ contact: { name: 'RoxyAPI Support' } });
		const afterEmail = spec({
			contact: { name: 'RoxyAPI Support', email: 'support@roxyapi.com' },
		});
		expect(fingerprint(beforeEmail)).not.toBe(fingerprint(afterEmail));
	});

	test('does not change for info fields the collection never surfaces (version, contact.url)', () => {
		const before = spec({
			version: '1.0.0',
			contact: { url: 'https://roxyapi.com/contact' },
		});
		const after = spec({
			version: '2.0.0',
			contact: { url: 'https://roxyapi.com/other' },
		});
		expect(fingerprint(before)).toBe(fingerprint(after));
	});

	test('changes when paths or components change', () => {
		const before = spec({ paths: { '/forecast': { get: {} } } });
		const after = spec({
			paths: { '/forecast': { get: {} }, '/forecast/digest': { get: {} } },
		});
		expect(fingerprint(before)).not.toBe(fingerprint(after));

		const beforeSchema = spec({ components: { schemas: { Forecast: {} } } });
		const afterSchema = spec({
			components: { schemas: { Forecast: {}, Digest: {} } },
		});
		expect(fingerprint(beforeSchema)).not.toBe(fingerprint(afterSchema));
	});

	test('is insensitive to key order, matching the canonical semantic diff', () => {
		const a = {
			info: { title: 'X', description: 'd' },
			paths: { '/a': {}, '/b': {} },
			components: { schemas: {} },
		};
		const b = {
			info: { description: 'd', title: 'X' },
			components: { schemas: {} },
			paths: { '/b': {}, '/a': {} },
		};
		expect(fingerprint(a)).toBe(fingerprint(b));
	});
});

describe('canonical', () => {
	test('sorts object keys recursively so JSON.stringify output is order independent', () => {
		const a = canonical({ b: 1, a: { d: 2, c: 3 } });
		const b = canonical({ a: { c: 3, d: 2 }, b: 1 });
		expect(JSON.stringify(a)).toBe(JSON.stringify(b));
	});
});
