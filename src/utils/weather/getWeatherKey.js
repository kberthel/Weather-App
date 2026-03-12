export function getWeatherKey(id) {
  const mapping = {
    clear: { value: 800 }, //Clear – clear sky
    few_clouds: { value: 801 }, //Clouds – few clouds: 11-25%

    clouds: { value: 802 }, //Clouds – scattered clouds: 25-50%
    overcast: { list: [803, 804] }, //Clouds – broken: 51-84% – overcast: 85-100%

    drizzle: { min: 300, max: 321 },
    rain: { list: [500, 501, 520, 521, 522, 531] },
    heavy_rain: { list: [502, 503, 504] },
    thunderstorm: { min: 200, max: 232 },

    snow: { min: 600, max: 602 },
    sleet: { value: 511, min: 611, max: 622 },

    fog: { list: [701, 711, 721, 741] },
    wind: { list: [731, 751, 761, 762, 771, 781] },
  };

  for (const key in mapping) {
    const rule = mapping[key];
    if (rule.value && id === rule.value) return key;
    if (rule.min && rule.max && id >= rule.min && id <= rule.max) return key;
    if (rule.list && rule.list.includes(id)) return key;
  }

  return 'clouds';
}
