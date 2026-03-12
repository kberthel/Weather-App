import { calculateTimePhase } from './calculateTimePhase';

export function getWeatherTimeState(data) {
  if (!data) return null;
  const t = calculateTimePhase(data);
  if (!t) return 'day';

  const { now, sunrise, sunset } = t;

  if (now < sunrise) return 'night';
  if (now < sunset) return 'day';
  return 'night';
}
