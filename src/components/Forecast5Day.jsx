import React from 'react';
import weatherImages from '../config/weatherImages';
import { getWeatherImageKey } from '../utils/weather/getWeatherImageKey';

const getLocalDateString = (unix, offset) =>
  new Date((unix + offset) * 1000).toISOString().slice(0, 10);

const ForecastDay = React.memo(function ForecastDay({
  day,
  imgSrc,
  weekday,
  isToday,
}) {
  return (
    <article className={`forecast-day ${isToday ? 'today' : ''}`}>
      <div className="forecast-weekday-date-group">
        <h3 className={`forecast-weekday ${isToday ? 'today' : ''}`}>
          {isToday ? (
            <span className="material-symbols-outlined today-icon">today</span>
          ) : (
            weekday
          )}
        </h3>

        <p className="forecast-date">
          {new Date(day.dt * 1000).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
          })}
        </p>
      </div>
      <div className="forecast-image">
        <img
          className="forecast-img"
          src={imgSrc}
          alt={day.description ?? day.condition}
          width="72"
          height="72"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="forecast-temp-pop-group">
        <p className="forecast-weekday-temp-max ">
          <span className="visually-hidden">Maximum temperature:</span>
          {day.temp_max != null ? Math.round(day.temp_max) : '--'} °C
        </p>

        <p className="forecast-weekday-temp-min">
          <span className="visually-hidden">Minimum temperature:</span>
          {day.temp_min != null ? Math.round(day.temp_min) : '--'} °C
        </p>

        <p className="forecast-pop">
          <span className="visually-hidden">Precipitation:</span>
          {day.pop != null ? Math.round(day.pop * 100) : '--'}%
          <span className="material-symbols-outlined water_drop">
            water_drop
          </span>
        </p>
      </div>
    </article>
  );
});

export default function Forecast5Day({ dailyForecast, timezone }) {
  if (!dailyForecast || dailyForecast.length === 0) return null;

  const todayString = getLocalDateString(
    Math.floor(Date.now() / 1000),
    timezone
  );

  return (
    <section
      aria-labelledby="forecast-heading"
      className={`forecast-container ${dailyForecast.length ? 'show' : ''}`}
    >
      <h2 id="forecast-heading" className="forecast-heading">
        5 Day Forecast
      </h2>

      <div className="forecast-content">
        {dailyForecast.map((day) => {
          const localTime = new Date((day.dt + timezone) * 1000);

          const key = getWeatherImageKey({
            condition: day.condition,
            timezone,
            dt: day.dt,
            icon: day.icon,
          });

          const imgSrc = weatherImages[key];

          const weekday = localTime.toLocaleDateString(undefined, {
            weekday: 'short',
          });

          const dayString = getLocalDateString(day.dt, timezone);
          const isToday = dayString === todayString;

          return (
            <ForecastDay
              key={day.dt}
              day={day}
              imgSrc={imgSrc}
              weekday={weekday}
              isToday={isToday}
            />
          );
        })}
      </div>
    </section>
  );
}
