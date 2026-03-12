export function validateWeather(w) {
  if (!w) return null;

  return {
    name: w.name ?? 'Unknown',
    country: w.country ?? '',

    temp: num(w.temp),
    temp_min: num(w.temp_min),
    temp_max: num(w.temp_max),
    feels_like: num(w.feels_like),

    condition: w.condition ?? 'clouds',
    icon: w.icon ?? '01d',

    clouds: { all: num(w.clouds?.all) },
    humidity: num(w.humidity), // + for req
    pressure: num(w.pressure),
    visibility: num(w.visibility),

    wind: {
      speed: num(w.wind_speed ?? 0),
      deg: num(w.wind_deg ?? 0),
      gust: num(w.wind_gust ?? 0),
    },

    sys: {
      sunrise: w.sys?.sunrise ?? 0,
      sunset: w.sys?.sunset ?? 0,
    },

    dt: w.dt ?? Date.now() / 1000,
    timezone: w.timezone ?? 0,
  };
}

function num(v) {
  return v != null ? Number(v) : null;
}
