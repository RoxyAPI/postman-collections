# RoxyAPI Postman Collections

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Postman workspace](https://img.shields.io/badge/Postman-public%20workspace-orange.svg)](https://www.postman.com/roxylabs-7113570/roxyapi)
[![Docs](https://img.shields.io/badge/docs-roxyapi.com-blue.svg)](https://roxyapi.com/docs/guides/postman)

Ready to run Postman collections for the full RoxyAPI catalog: Western and Vedic astrology, tarot, numerology, I Ching, biorhythm, dreams, crystals, angel numbers, Human Design, forecast, and location. One workspace, one API key, every domain. Remote MCP, typed SDKs, and drop in UI components live alongside at [roxyapi.com](https://roxyapi.com).

Every collection is generated straight from the live OpenAPI specs and kept in sync automatically. When an endpoint is added, changed, or a whole new domain ships, the collections here follow on the next scheduled run. Nothing in this repo is maintained by hand.

## Use it

Open the public workspace and fork any collection into your own:

[**Explore the RoxyAPI workspace on Postman**](https://www.postman.com/roxylabs-7113570/roxyapi)

Each forked collection carries its own `baseUrl` and an `apiKey` variable. Set `apiKey` to your key (from [your account](https://roxyapi.com/account)) and every request is authenticated through the `X-API-Key` header. That is the only setup.

Prefer Bruno or Insomnia? Both import RoxyAPI directly from a spec URL, no download needed:

```
https://roxyapi.com/api/v2/{domain}/openapi.json
```

for a single domain, or the combined spec:

```
https://roxyapi.com/api/v2/openapi.json
```

## What is in here

| Path | Contents |
|---|---|
| `collections/` | Generated Postman v2.1 collection per domain. Browse or import directly. |
| `specs/` | The OpenAPI spec each collection was built from. The diff baseline for the next sync. |
| `collections.json` | Domain to Postman UID map, written automatically by the sync. |
| `scripts/sync.ts` | The autopilot: discover domains, diff, regenerate, publish. |

The set of domains is discovered from the live API, so it always matches what is actually shipped. To see the current list, browse [`collections/`](./collections) or the [products page](https://roxyapi.com/products).

## Authentication

| Variable | Where to set | Value |
|---|---|---|
| `apiKey` | Collection or environment variable | Your RoxyAPI key |
| `baseUrl` | Preset per collection | `https://roxyapi.com/api/v2/{domain}` |

All requests inherit collection level API key auth. The key travels in the `X-API-Key` header. The same key works across every domain.

## Verified accuracy

The astrology and Vedic domains are verified against NASA JPL Horizons. See the public [methodology](https://roxyapi.com/methodology) and the gold standard test suite write up.

## Links

- API docs and reference: [roxyapi.com/docs](https://roxyapi.com/docs)
- Postman guide: [roxyapi.com/docs/guides/postman](https://roxyapi.com/docs/guides/postman)
- TypeScript, Python, and PHP SDKs: [roxyapi.com/docs/sdk](https://roxyapi.com/docs/sdk)
- Remote MCP and starters: [roxyapi.com/starters](https://roxyapi.com/starters)

## License

MIT. See [LICENSE](./LICENSE).
