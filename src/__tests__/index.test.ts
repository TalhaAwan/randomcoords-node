import RandomCoords, { RandomCoordsError } from '../index';
import { PassThrough } from 'stream';
import https from 'https';
import http from 'http';

const apiToken = process.env.API_TOKEN as string;

function mockHttpsResponse({
  statusCode,
  headers,
  body,
}: {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}) {
  const dummyResponseStream = new PassThrough();
  // @ts-ignore
  dummyResponseStream.statusCode = statusCode;
  // @ts-ignore
  dummyResponseStream.headers = headers || {
    'content-type': 'application/json',
  };

  const requestMock = jest
    .spyOn(https, 'request')
    .mockImplementation((_url, _options, callback) => {
      process.nextTick(() => {
        // @ts-ignore
        callback(dummyResponseStream);
        dummyResponseStream.end(body);
      });

      const fakeRequest: Partial<http.ClientRequest> = {
        on: jest.fn(),
        end: jest.fn(),
      };

      return fakeRequest as http.ClientRequest;
    });

  return requestMock;
}

describe('RandomCoords Client', () => {
  describe('Successful Method Calls', () => {
    test('getRegions', async () => {
      const client = new RandomCoords({ apiToken });
      const response = await client.getRegions();

      expect(response.type).toEqual('regions');
      expect(response.results).toBeGreaterThan(0);
      expect(response.data[0].id).toBeTruthy();
      expect(response.data[0].name).toBeTruthy();
    });

    test('getCountries', async () => {
      const client = new RandomCoords({ apiToken });

      const response = await client.getCountries();
      expect(response.type).toEqual('countries');
      expect(response.results).toBeGreaterThan(0);
      expect(response.data[0].id).toBeTruthy();
      expect(response.data[0].iso2).toBeTruthy();
      expect(response.data[0].name).toBeTruthy();
    });

    test('getRegionCoordinates', async () => {
      const client = new RandomCoords({ apiToken });

      const response = await client.getRegionCoordinates('asia', { limit: 10 });
      expect(response.id).toEqual('asia');
      expect(response.name).toBeTruthy();
      expect(response.type).toEqual('region');
      expect(response.results).toEqual(10);
      expect(response.data[0].id).toBeTruthy();
      expect(response.data[0].country).toBeTruthy();
      expect(response.data[0].city).toBeTruthy();
      expect(response.data[0].iso2).toBeTruthy();
      expect(response.data[0].coordinates.length).toBe(2);
    });

    test('getCountryCoordinates', async () => {
      const client = new RandomCoords({ apiToken });

      const response = await client.getCountryCoordinates('united-states', {
        limit: 10,
      });

      expect(response.id).toBe('united-states');
      expect(response.name).toBeTruthy();
      expect(response.type).toEqual('country');
      expect(response.regions.length).toBeGreaterThan(0);
      expect(response.iso2).toBeTruthy();
      expect(response.results).toEqual(10);
      expect(response.data[0].city).toBeTruthy();
      expect(response.data[0].state).toBeTruthy();
      expect(response.data[0].coordinates.length).toBe(2);
    });
  });
  describe('Error Handling', () => {
    describe('API Token', () => {
      const errMsg =
        "Invalid 'apiToken': must be a non-empty string without spaces, between 10 and 700 characters long.";

      test('missing', async () => {
        try {
          // @ts-ignore
          new RandomCoords({});
        } catch (e: any) {
          expect(e).toBeInstanceOf(Error);
          expect(e.message).toEqual(errMsg);
        }
      });

      test('empty', async () => {
        try {
          new RandomCoords({ apiToken: '' });
        } catch (e: any) {
          expect(e).toBeInstanceOf(Error);
          expect(e.message).toEqual(errMsg);
        }
      });

      test('non-string', async () => {
        try {
          // @ts-ignore
          new RandomCoords({ apiToken: 789 });
        } catch (e: any) {
          expect(e).toBeInstanceOf(Error);
          expect(e.message).toEqual(errMsg);
        }
      });

      test('with spaces', async () => {
        try {
          // @ts-ignore
          new RandomCoords({ apiToken: 'abcdef ghijkl mno' });
        } catch (e: any) {
          expect(e).toBeInstanceOf(Error);
          expect(e.message).toEqual(errMsg);
        }
      });

      test('less than minimum length', async () => {
        try {
          new RandomCoords({ apiToken: 'abcde' });
        } catch (e: any) {
          expect(e).toBeInstanceOf(Error);
          expect(e.message).toEqual(errMsg);
        }
      });

      test('exceeds maximum length', async () => {
        try {
          new RandomCoords({ apiToken: 'a'.repeat(701) });
        } catch (e: any) {
          expect(e).toBeInstanceOf(Error);
          expect(e.message).toEqual(errMsg);
        }
      });
    });

    describe('API Failures', () => {
      afterEach(() => {
        jest.restoreAllMocks();
      });
      test('401 - unauthorized', async () => {
        const client = new RandomCoords({ apiToken: 'invalid-token' });
        try {
          await client.getRegions();
        } catch (e: any) {
          expect(e).toBeInstanceOf(RandomCoordsError);
          expect(e.statusCode).toBe(401);
          expect(e.message.toLowerCase()).toContain('invalid');
        }
      });

      test('404 - not found', async () => {
        const client = new RandomCoords({ apiToken });

        try {
          await client.getRegionCoordinates('nonexistent-region');
        } catch (e: any) {
          expect(e).toBeInstanceOf(RandomCoordsError);
          expect(e.statusCode).toBe(404);
          expect(e.message).toContain('nonexistent-region');
        }
      });

      test('429 - too many requests', async () => {
        const client = new RandomCoords({ apiToken });

        const mock = mockHttpsResponse({
          statusCode: 429,
          headers: { 'content-type': 'text/html' },
          body: '<html><body>Too many requests</body></html>',
        });

        try {
          await client.getRegions();
          throw new Error('Expected to throw but did not');
        } catch (e: any) {
          expect(e).toBeInstanceOf(RandomCoordsError);
          expect(e.statusCode).toBe(429);
          expect(e.message.toLowerCase()).toContain('too many');
          expect(e.message).toEqual('Too many requests. Wait and try again.');
        }

        expect(mock).toHaveBeenCalled();
      });

      test('500 - something went wrong', async () => {
        const client = new RandomCoords({ apiToken });

        const mock = mockHttpsResponse({
          statusCode: 500,
          headers: { 'content-type': 'text/html' },
          body: '<html><body>Something went wrong somewhere</body></html>',
        });

        try {
          await client.getRegions();
          throw new Error('Expected to throw but did not');
        } catch (e: any) {
          expect(e).toBeInstanceOf(RandomCoordsError);
          expect(e.statusCode).toBe(500);
          expect(e.message).toEqual('Something went wrong.');
        }

        expect(mock).toHaveBeenCalled();
      });

      test('200 - with invalid JSON response', async () => {
        const client = new RandomCoords({ apiToken });

        const mock = mockHttpsResponse({
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          body: '{"id": 1, "name": "a",',
        });

        try {
          await client.getRegions();
        } catch (e: any) {
          expect(e).toBeInstanceOf(Error);
          expect(e.message).toEqual('Invalid JSON response.');
        }

        expect(mock).toHaveBeenCalled();
      });
    });

    describe('Identifier Validation', () => {
      const errMsgRegion =
        "Invalid 'region': must be a non-empty string without spaces, between 3 and 30 characters long.";
      const errMsgCountry =
        "Invalid 'country': must be a non-empty string without spaces, between 3 and 30 characters long.";

      test('empty', async () => {
        const client = new RandomCoords({ apiToken });

        try {
          await client.getRegionCoordinates('');
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsgRegion);
        }

        try {
          await client.getCountryCoordinates('');
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsgCountry);
        }
      });

      test('with spaces', async () => {
        const client = new RandomCoords({ apiToken });

        try {
          await client.getRegionCoordinates('united states');
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsgRegion);
        }

        try {
          await client.getCountryCoordinates('united states');
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsgCountry);
        }
      });

      test('non-string', async () => {
        const client = new RandomCoords({ apiToken });

        try {
          // @ts-ignore
          await client.getRegionCoordinates({ id: 7 });
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsgRegion);
        }

        try {
          // @ts-ignore
          await client.getCountryCoordinates({ id: 7 });
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsgCountry);
        }
      });

      test('exceeds max length', async () => {
        const client = new RandomCoords({ apiToken });

        try {
          await client.getRegionCoordinates('some-very-long-string-123456789-xyz');
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsgRegion);
        }

        try {
          await client.getCountryCoordinates('some-very-long-string-123456789-xyz');
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsgCountry);
        }
      });

      test('less than min length', async () => {
        const client = new RandomCoords({ apiToken });

        try {
          await client.getRegionCoordinates('a');
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsgRegion);
        }

        try {
          await client.getCountryCoordinates('a');
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsgCountry);
        }
      });
    });

    describe('Limit Validation', () => {
      const errMsg = "Invalid 'limit': must be an integer between 1 and 100.";

      test('less than min', async () => {
        const client = new RandomCoords({ apiToken });

        try {
          await client.getRegionCoordinates('abc', { limit: 0 });
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsg);
        }

        try {
          await client.getCountryCoordinates('abc', { limit: 0 });
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsg);
        }
      });

      test('exceeds max', async () => {
        const client = new RandomCoords({ apiToken });

        try {
          await client.getRegionCoordinates('abc', { limit: 1000 });
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsg);
        }

        try {
          await client.getCountryCoordinates('abc', { limit: 1000 });
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsg);
        }
      });

      test('non-number', async () => {
        const client = new RandomCoords({ apiToken });

        try {
          // @ts-ignore
          await client.getRegionCoordinates('abc', { limit: '1' });
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsg);
        }

        try {
          // @ts-ignore
          await client.getCountryCoordinates('abc', { limit: '1' });
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsg);
        }
      });

      test('decimal', async () => {
        const client = new RandomCoords({ apiToken });

        try {
          await client.getRegionCoordinates('abc', { limit: 3.14 });
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsg);
        }

        try {
          await client.getCountryCoordinates('abc', { limit: 3.14 });
        } catch (e: any) {
          expect(e).toBeInstanceOf(TypeError);
          expect(e.message).toEqual(errMsg);
        }
      });
    });
  });
});
