import weatherImages from '../../config/weatherImages';
import { getWeatherImageKey } from './getWeatherImageKey';

export function getWeatherImageSrc(weather) {
  if (!weather || typeof weather !== 'object') return null;

  try {
    const key = getWeatherImageKey(weather);
    return weatherImages[key] ?? null;
  } catch (err) {
    console.error('Image resolver failed:', err, weather);
    return null;
  }
}
