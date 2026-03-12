export function groupForecastByDay(list, timezoneOffset) {
  const daysMap = {};

  list.forEach((item) => {
    const localDate = new Date((item.dt + timezoneOffset) * 1000);
    const date = localDate.toISOString().split('T')[0];

    if (!daysMap[date]) {
      daysMap[date] = {
        dt: item.dt,
        temps: [],
        conditions: {},
        pops: [],
      };
    }

    // collect temps pops
    daysMap[date].temps.push(item.temp_min, item.temp_max);
    daysMap[date].pops.push(item.pop);

    // count condition frequency
    const id = item.id;

    if (!daysMap[date].conditions[id]) {
      daysMap[date].conditions[id] = {
        count: 1,
        weather: item,
      };
    } else {
      daysMap[date].conditions[id].count++;
    }
  });

  return Object.values(daysMap)
    .map((day) => {
      const mostFrequent = Object.values(day.conditions).sort(
        (a, b) => b.count - a.count
      )[0].weather;

      return {
        dt: day.dt,
        temp_min: Math.min(...day.temps),
        temp_max: Math.max(...day.temps),
        condition: mostFrequent.condition,
        icon: mostFrequent.icon,
        description: mostFrequent.description,
        pop: Math.max(...day.pops.filter((v) => v != null)),
      };
    })
    .slice(0, 5);
}
