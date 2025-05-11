# RandomCoords Node.js Client

[![npm version](https://img.shields.io/npm/v/randomcoords)](https://www.npmjs.com/package/randomcoords)
![CI](https://github.com/TalhaAwan/randomcoords-node/actions/workflows/ci.yml/badge.svg)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16-blue)](https://nodejs.org/)
![downloads](https://img.shields.io/npm/dm/randomcoords)

The Node.js client for the RandomCoords REST API to get random geographic coordinates from around the world.

## Installation

```bash
npm install randomcoords
```

or

```bash
yarn add randomcoords
```

## Requirements

- Node.js v16 or higher
- An `apiToken` from [RandomCoords](https://www.randomcoords.com/docs/rest)

## Usage

```typescript
import RandomCoords from 'randomcoords';

const client = new RandomCoords({ apiToken: 'your-api-token' });

const countries = await client.getCountries();
console.log(countries);

const coords = await client.getCountryCoordinates('united-states', { limit: 10 });
console.log(coords);
```

## Available Methods

| Method                  | Parameters                                    | Response                                        |
| ----------------------- | --------------------------------------------- | ----------------------------------------------- |
| getRegions()            | –                                             | Metadata and a list of supported regions.       |
| getCountries()          | –                                             | Metadata and a list of supported countries.     |
| getRegionCoordinates()  | region: string, options?: { limit?: number }  | Metadata and random coordinates in the region.  |
| getCountryCoordinates() | country: string, options?: { limit?: number } | Metadata and random coordinates in the country. |

## API Error Handling

All API errors throw a `RandomCoordsApiError`, which extends the native `Error` class and includes:

- `statusCode`: HTTP status
- `url`: the request URL
- `message`: descriptive error message

```typescript
import { RandomCoordsApiError } from 'randomcoords';

try {
  await client.getRegionCoordinates('unknown-region');
} catch (err) {
  if (err instanceof RandomCoordsApiError) {
    console.error(`Failed with status ${err.statusCode} at ${err.url}: ${err.message}`);
  }
}
```

## API Reference

- [REST API docs](https://www.randomcoords.com/docs/rest)

## License

MIT © Talha Awan
