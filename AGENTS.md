# RoxyAPI - Agent Guide

Postman collections for the RoxyAPI catalog: astrology, Vedic astrology, forecast, Human Design, Chinese astrology, feng shui, Mesoamerican astrology, Vastu, numerology, Kabbalah, tarot, biorhythm, Ayurveda, I Ching, crystals, dreams, angel numbers, and location. One API key, every domain. This guide helps an AI agent call the API these collections cover.

## Base URL and auth

- Base URL: `https://roxyapi.com/api/v2/{domain}`
- Send your key in the `X-API-Key` header on every request. The same key works across every domain.
- Get a key: https://roxyapi.com/account

## Domains

| Domain | Base path |
|---|---|
| Western astrology | `/api/v2/astrology` |
| Vedic astrology | `/api/v2/vedic-astrology` |
| Forecast | `/api/v2/forecast` |
| Human Design | `/api/v2/human-design` |
| Chinese astrology | `/api/v2/chinese-astrology` |
| Feng shui | `/api/v2/feng-shui` |
| Mesoamerican astrology | `/api/v2/mesoamerican-astrology` |
| Vastu | `/api/v2/vastu` |
| Numerology | `/api/v2/numerology` |
| Kabbalah | `/api/v2/kabbalah` |
| Tarot | `/api/v2/tarot` |
| Biorhythm | `/api/v2/biorhythm` |
| Ayurveda | `/api/v2/ayurveda` |
| I Ching | `/api/v2/iching` |
| Crystals | `/api/v2/crystals` |
| Dreams | `/api/v2/dreams` |
| Angel numbers | `/api/v2/angel-numbers` |
| Location | `/api/v2/location` |

The exact endpoints, parameters, and response fields are in the [API reference](https://roxyapi.com/api-reference) and the OpenAPI spec at `https://roxyapi.com/api/v2/{domain}/openapi.json`. Always read field names from the spec, never guess.

## Critical rule: geocode before any chart endpoint

Astrology and Vedic chart endpoints need latitude and longitude. Resolve a place name to coordinates with the location domain first, then pass them in. Never guess coordinates.

## Multi-language responses

Add `?lang=` to any request. Supported: `en`, `tr`, `de`, `es`, `hi`, `pt`, `fr`, `ru`, `zh-Hans`, `zh-Hant`. Defaults to English. Domains without a translation yet fall back to English.

## Errors

Success returns the data directly. Failures return `{ "error": "...", "code": "..." }` with an HTTP status. There is no success wrapper.

## Using these collections

- Fork the [public workspace](https://www.postman.com/roxylabs-7113570/roxyapi) into your own.
- Or download `roxyapi-collections.zip` from the [latest release](https://github.com/RoxyAPI/postman-collections/releases/latest) and import it, along with the included RoxyAPI environment. Set the `apiKey` variable to your key.
- Bruno and Insomnia import directly from the spec URLs above.

## Links

- API reference: https://roxyapi.com/api-reference
- Docs: https://roxyapi.com/docs
- SDKs (TypeScript, Python, PHP): https://roxyapi.com/docs/sdk
- Pricing: https://roxyapi.com/pricing
