# RandomCoords Node.js Client

[![npm version](https://img.shields.io/npm/v/randomcoords)](https://www.npmjs.com/package/randomcoords)
![CI](https://github.com/TalhaAwan/randomcoords-node/actions/workflows/ci.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14-blue)](https://nodejs.org/)
![downloads](https://img.shields.io/npm/dm/randomcoords)

The Node.js client for the RandomCoords API to fetch random geographic coordinates worldwide.

## Installation

```bash
npm install randomcoords
```

or

```bash
yarn add randomcoords
```

## Requirements

- Node.js v14 or higher.
- An `apiToken` from [RandomCoords](https://www.randomcoords.com/docs/rest).

## Import

```typescript
import RandomCoords from 'randomcoords';
```

Or CommonJS

```typescript
const RandomCoords = require('randomcoords');
```

## Usage

```typescript
import RandomCoords from 'randomcoords';

const client = new RandomCoords({ apiToken: 'your-api-token' });

const coords = await client.getCountryCoordinates('united-states', { limit: 10 });
console.log(coords);
```

## Available Methods

### `getRegions()`

#### Parameters

None

#### Returns

Metadata and a list of supported regions.

### `getCountries()`

#### Parameters

None

#### Returns

Metadata and a list of supported countries.

### `getRegionCoordinates(region, options)`

#### Parameters

- `region` (`string`) – The region identifier (e.g., `"world"`, `"europe"`).
- `options` (`object`, optional):
  - `limit` (`number`, optional) – Maximum number of coordinates to return (default: `1`, maximum: `100`).

#### Returns

Metadata and random coordinates within the specified region.

### `getCountryCoordinates(country, options)`

#### Parameters

- `country` (`string`) – The country identifier (e.g., `"united-states"`, `"australia"`).
- `options` (`object`, optional):
  - `limit` (`number`, optional) – Maximum number of coordinates to return (default: `1`, maximum: `100`).

#### Returns

Metadata and random coordinates within the specified country.

## Error Handling

The library throws:

- `TypeError` or `Error` – for validation or unexpected usage issues (e.g., invalid inputs).
- `RandomCoordsApiError` – for HTTP/API-related failures. This custom error includes:
  - `statusCode`: HTTP status code (e.g., `401`, `404`, `429`).
  - `url`: The API request URL.
  - `message`: A descriptive error message.

**Example:**

```ts
import { RandomCoordsApiError } from 'randomcoords';

try {
  // a method call
} catch (err) {
  if (err instanceof TypeError) {
    console.error(`Invalid input: ${err.message}`);
  } else if (err instanceof RandomCoordsApiError) {
    console.error(`API error ${err.statusCode} at ${err.url}: ${err.message}`);
  } else {
    console.error('Unexpected error:', err);
  }
}
```

## API Reference

- [REST API docs](https://www.randomcoords.com/docs/rest)

## Issues

If you encounter a bug, please [open an issue](https://github.com/TalhaAwan/randomcoords-node/issues).

## License

MIT © Talha Awan
