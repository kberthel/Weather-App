import { getWeatherKey } from '../weather/getWeatherKey';

export function normalizeForecast(list) {
  return list.map((item) => {
    const w = item.weather?.[0] || {};

    return {
      dt: item.dt,

      temp_min: item.main?.temp_min,
      temp_max: item.main?.temp_max,
      pop: item.pop,

      condition: getWeatherKey(w.id),
      icon: w.icon,
      id: w.id,
    };
  });
}
