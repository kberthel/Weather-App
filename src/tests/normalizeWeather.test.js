import { describe, it, expect } from 'vitest';
import { normalizeWeather } from '../utils/data/normalizeWeather';

describe('normalizes weather data', () => {
  it('returns structured weather object', () => {
    const mock = {
      name: 'Berlin',
      sys: { country: 'DE' },
      weather: [{ id: 800, icon: '01d', description: 'clear sky' }],
      dt: 123456,
      timezone: 3600,
      main: {
        temp: 20,
        feels_like: 19,
        temp_min: 18,
        temp_max: 22,
        humidity: 60,
        pressure: 1012,
      },
      visibility: 10000,
      wind: { speed: 3, deg: 180 },
      clouds: { all: 0 },
    };

    const result = normalizeWeather(mock);

    expect(result.name).toBe('Berlin');
    expect(result.condition).toBe('clear');
  });
});
