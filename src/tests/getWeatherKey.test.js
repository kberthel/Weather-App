import { describe, it, expect } from 'vitest';
import { getWeatherKey } from '../utils/weather/getWeatherKey';

describe('getWeatherKey', () => {
  it('returns clear for 800', () => {
    expect(getWeatherKey(800)).toBe('clear');
  });

  it('returns clouds fallback for unknown id', () => {
    expect(getWeatherKey(9999)).toBe('clouds');
  });
});
