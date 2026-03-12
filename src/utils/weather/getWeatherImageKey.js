import { getWeatherTimeState } from '../time/getWeatherTimeState';

export function getWeatherImageKey(weather) {
  if (!weather?.condition) return 'clouds';

  const { condition, icon, dt, timezone, sys } = weather;

  const timeState = getWeatherTimeState({ dt, timezone, sys });
  const isDay = icon ? icon.endsWith('d') : timeState === 'day';

  if (condition === 'clear') {
    return isDay ? 'day_clear' : 'night_clear';
  }
  if (condition === 'few_clouds') {
    return isDay ? 'day_few_clouds' : 'night_few_clouds';
  }

  return condition;
}
