import https from 'https';
import { URL } from 'url';

import {
  RegionsResponse,
  CountriesResponse,
  RegionCoordinatesResponse,
  CountryCoordinatesResponse,
} from './types';

const BASE_URL = 'https://api.randomcoords.com/v1/';

const fallbackMessages: Record<number, string> = {
  429: 'Too many requests. Wait and try again.',
  500: 'Something went wrong.',
};

const validateStringInput = (
  str: string | undefined,
  label: 'region' | 'country' | 'apiToken',
  minLength = 3,
  maxLength = 30
): void => {
  if (
    typeof str !== 'string' ||
    !str.trim() ||
    str.includes(' ') ||
    str.length < minLength ||
    str.length > maxLength
  ) {
    throw new TypeError(
      `Invalid '${label}': must be a non-empty string without spaces, between ${minLength} and ${maxLength} characters long.`
    );
  }
};

const getValidatedLimit = (limit: number | undefined, min = 1, max = 100): number => {
  const fallback = 1;
  const value = limit ?? fallback;

  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new TypeError(`Invalid 'limit': must be an integer between ${min} and ${max}.`);
  }

  return value;
};

export class RandomCoordsApiError extends Error {
  public readonly statusCode: number;
  public readonly url: string;

  constructor(message: string, statusCode: number, url: string) {
    super(message);
    this.name = 'RandomCoordsApiError';
    this.statusCode = statusCode;
    this.url = url;
  }
}

export default class RandomCoords {
  private apiToken: string;
  private baseUrl: string;

  constructor({ apiToken, baseUrl = BASE_URL }: { apiToken: string; baseUrl?: string }) {
    validateStringInput(apiToken, 'apiToken', 10, 700);
    this.apiToken = apiToken;
    this.baseUrl = baseUrl;
  }

  private _makeRequest<T>(path: string): Promise<T> {
    const url = new URL(path, this.baseUrl);

    const options = {
      method: 'GET',
      headers: {
        'x-api-token': this.apiToken,
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const contentType = res.headers['content-type'] || '';
          const isJson = contentType.includes('application/json');
          const statusCode = res.statusCode as number;

          let parsedMessage = '';
          if (isJson) {
            try {
              const parsed = JSON.parse(data);
              if (statusCode === 200) return resolve(parsed);
              parsedMessage = parsed?.message as string;
            } catch {
              return reject(new Error('Invalid JSON response.'));
            }
          }

          const message =
            parsedMessage || fallbackMessages[statusCode] || 'Unexpected error occurred.';

          return reject(new RandomCoordsApiError(message, statusCode, url.toString()));
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  getRegions(): Promise<RegionsResponse> {
    return this._makeRequest<RegionsResponse>('coordinates/regions');
  }

  getRegionCoordinates(
    region: string,
    options?: { limit?: number }
  ): Promise<RegionCoordinatesResponse> {
    validateStringInput(region, 'region');
    const limit = getValidatedLimit(options?.limit);

    return this._makeRequest<RegionCoordinatesResponse>(
      `coordinates/regions/${region}?limit=${limit}`
    );
  }

  getCountries(): Promise<CountriesResponse> {
    return this._makeRequest<CountriesResponse>('coordinates/countries');
  }

  getCountryCoordinates(
    country: string,
    options?: { limit?: number }
  ): Promise<CountryCoordinatesResponse> {
    validateStringInput(country, 'country');
    const limit = getValidatedLimit(options?.limit);

    return this._makeRequest<CountryCoordinatesResponse>(
      `coordinates/countries/${country}?limit=${limit}`
    );
  }
}
