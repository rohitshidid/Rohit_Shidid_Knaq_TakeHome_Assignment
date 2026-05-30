export type DeviceType = 'elevator' | 'escalator' | 'compressor';

export interface Device {
  id: string;
  type: DeviceType;
  company: string;
  name: string;
  location: string;
  timezone: string;
  floorCount: number | null;
  installedDate: string;
  readingTypes: string[];
  alertThresholds: Record<string, number>;
}

/** One metric sample from GET /devices/:id/readings (timestamp is device-local ISO). */
export interface Reading {
  metric: string;
  value: number;
  timestamp: string | null;
  isBreach: boolean;
  breachBound: string | null;
  breachLimit: number | null;
}

export interface ReadingsResponse {
  deviceId: string;
  timezone: string;
  start: string | null;
  end: string | null;
  count: number;
  readings: Reading[];
}
