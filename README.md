# RoxyAPI Postman Collections

[![Postman workspace](https://img.shields.io/badge/Postman-public%20workspace-FF6C37?logo=postman&logoColor=white)](https://www.postman.com/roxylabs-7113570/roxyapi)
[![Sync](https://github.com/RoxyAPI/postman-collections/actions/workflows/sync.yml/badge.svg)](https://github.com/RoxyAPI/postman-collections/actions/workflows/sync.yml)
[![Postman guide](https://img.shields.io/badge/guide-roxyapi.com-blue)](https://roxyapi.com/docs/guides/postman)
[![API Reference](https://img.shields.io/badge/api%20reference-roxyapi.com-blue)](https://roxyapi.com/api-reference)
[![Docs](https://img.shields.io/badge/docs-roxyapi.com-blue)](https://roxyapi.com/docs)
[![Pricing](https://img.shields.io/badge/pricing-roxyapi.com-blue)](https://roxyapi.com/pricing)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

Ready to run Postman collections for the full RoxyAPI catalog: Western and Vedic astrology, tarot, numerology, I Ching, biorhythm, dreams, crystals, angel numbers, Human Design, forecast, and location. One workspace, one API key, every domain. Remote MCP, typed SDKs, and drop in UI components live alongside at [roxyapi.com](https://roxyapi.com).

These collections track the live RoxyAPI catalog, so they stay current as the API grows.

## Use it

Open the public workspace and fork any collection into your own:

[**Explore the RoxyAPI workspace on Postman**](https://www.postman.com/roxylabs-7113570/roxyapi)

Each forked collection carries its own `baseUrl` and an `apiKey` variable. Set `apiKey` to your key (from [your account](https://roxyapi.com/account)) and every request is authenticated through the `X-API-Key` header. That is the only setup.

Prefer to import locally? Grab `roxyapi-collections.zip` from the [latest release](https://github.com/RoxyAPI/postman-collections/releases/latest): every domain collection plus a ready to use RoxyAPI environment, refreshed automatically whenever the collections change. Import the zip into Postman, set `apiKey`, done.

Prefer Bruno or Insomnia? Both import RoxyAPI directly from a spec URL, no download needed:

```
https://roxyapi.com/api/v2/{domain}/openapi.json
```

for a single domain, or the combined spec:

```
https://roxyapi.com/api/v2/openapi.json
```

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
