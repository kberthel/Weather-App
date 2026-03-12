import { getWeatherKey } from '../weather/getWeatherKey';

export function normalizeWeather(apiData) {
  const w = apiData.weather[0] || {};

  return {
    name: apiData.name,
    country: apiData.sys?.country,

    id: w.id,
    icon: w.icon,
    description: w.description,
    condition: getWeatherKey(w.id),

    dt: apiData.dt,
    timezone: apiData.timezone,
    sys: apiData.sys,

    temp: apiData.main?.temp,
    feels_like: apiData.main?.feels_like,
    temp_min: apiData.main?.temp_min,
    temp_max: apiData.main?.temp_max,
    humidity: apiData.main?.humidity,
    pressure: apiData.main?.pressure,

    visibility: apiData.visibility,

    wind_speed: apiData.wind?.speed,
    wind_deg: apiData.wind?.deg,
    wind_gust: apiData.wind?.gust,

    clouds: apiData.clouds?.all,
  };
}
