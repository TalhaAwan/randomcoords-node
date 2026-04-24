export interface Region {
  id: string;
  name: string;
}

export interface RegionsResponse {
  type: 'regions';
  results: number;
  data: Region[];
}

export interface Country {
  id: string;
  name: string;
  iso2: string;
}

export interface CountriesResponse {
  type: 'countries';
  results: number;
  data: Country[];
}

export interface Coordinate {
  uid: string;
  id: string;
  country: string;
  state?: string;
  city: string;
  iso2: string;
  coordinates: [number, number];
}

export interface RegionCoordinatesResponse {
  id: string;
  name: string;
  type: 'region';
  results: number;
  data: Coordinate[];
}

export interface CountryCoordinate {
  uid: string;
  city: string;
  state?: string;
  coordinates: [number, number];
}

export interface CountryCoordinatesResponse {
  id: string;
  name: string;
  type: 'country';
  regions: string[];
  iso2: string;
  results: number;
  data: CountryCoordinate[];
}
