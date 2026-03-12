export function calculateTimePhase({ dt, timezone, sys }) {
  if (dt == null || timezone == null || !sys) return null;

  const now = dt + timezone;
  const sunrise = sys.sunrise + timezone;
  const sunset = sys.sunset + timezone;

  return { now, sunrise, sunset };
}
