import { describe, it, expect } from 'vitest';
import { groupForecastByDay } from '../utils/data/groupForecastByDay';

describe('groupForecastByDay', () => {
  it('groups entries into days', () => {
    const list = [
      {
        dt: 1700000000,
        temp_min: 10,
        temp_max: 15,
        pop: 0.2,
        id: 800,
        condition: 'clear',
        icon: '01d',
        description: 'clear sky',
      },
    ];

    const result = groupForecastByDay(list, 0);
    expect(result.length).toBe(1);
  });
});
