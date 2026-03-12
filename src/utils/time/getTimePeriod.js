import { calculateTimePhase } from './calculateTimePhase';

export function getTimePeriod(data) {
  if (!data) return null;
  const t = calculateTimePhase(data);
  if (!t) return 'day';

  const { now, sunrise, sunset } = t;

  const dawnStart = sunrise - 1800;
  const dawnEnd = sunrise + 900;
  const duskStart = sunset - 900;
  const duskEnd = sunset + 1800;

  if (now >= dawnStart && now <= dawnEnd) return 'dawn';
  if (now > dawnEnd && now < duskStart) return 'day';
  if (now >= duskStart && now <= duskEnd) return 'dusk';
  return 'night';
}
