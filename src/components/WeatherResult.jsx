import Forecast5Day from './Forecast5Day';
import ForecastSkeleton from './ForecastSkeleton';
import arrowNorth from '../assets/arrow_north.svg';

export default function WeatherResult({
  weather,
  weatherImage,
  dailyForecast,
  timezone,
  getWindDirection,
  capitalize,
  loading,
}) {
  if (!weather) {
    return <p className="landing">Enter a city to get started!</p>;
  }

  return (
    <div className="weather-result">
      {/* City + Country + Timezone + Image */}
      <div className="description-location">
        <h2 className="city-country">
          {weather.name}
          {weather.country ? ` · ${weather.country}` : ''}
        </h2>

        <p className="timezone">
          GMT{' '}
          {(weather.timezone / 3600 >= 1 ? '+' : '') + weather.timezone / 3600}
        </p>
        {weatherImage && (
          <img
            className="weather-graphic"
            src={weatherImage}
            alt={weather?.description || 'Current weather'}
            width="200"
            height="200"
            fetchPriority="high"
            decoding="async"
          />
        )}
      </div>
      {/* Description + Temperature */}
      <div className="description-temperature">
        <p className="temp-line temp-description">
          {capitalize(weather.description)}
        </p>
        <p className="temp-line temp-thermometer">
          <span className="material-symbols-outlined temp-icon">
            thermometer
          </span>
          <span className="temp-value-tempnow">
            {(Number(weather.temp) || 0).toFixed(1)} °C
          </span>
        </p>
        <p className="temp-line temp-feelslike">
          <span className="temp-feelslike">Feels Like</span>
          <span className="temp-value-feelslike"></span>{' '}
          {(Number(weather.feels_like) || 0).toFixed(1)} °C
        </p>
      </div>
      {/* 5 Day Forecast */}
      <div aria-busy={loading} aria-live="polite">
        {loading ? (
          <ForecastSkeleton />
        ) : (
          <Forecast5Day
            dailyForecast={dailyForecast}
            timezone={timezone}
            loading={loading}
          />
        )}
      </div>

      {/* */}
      {/* WEATHER DETAILS */}
      <div className="weather-details-grid">
        {/* FUNDAMENTALS TOP*/}
        <section className="fundamentals-top">
          <section className="detail-item-top humidity">
            <p className="label">
              <span className="material-symbols-outlined">
                humidity_percentage
              </span>{' '}
              Humidity
            </p>
            <div className="value">{weather.humidity} %</div>
          </section>
          <section className="detail-item-top visibility">
            <p className="label">
              <span className="material-symbols-outlined">visibility</span>{' '}
              Visibility
            </p>
            <div className="value">
              {weather.visibility != null
                ? (Number(weather.visibility / 1000) || 0).toFixed(1)
                : '--'}{' '}
              km
            </div>
          </section>
          <section className="detail-item-top temp-max">
            <p className="label">
              <span className="material-symbols-outlined">
                thermostat_arrow_up
              </span>{' '}
              Temp
            </p>
            <div className="value">
              {(Number(weather.temp_max) || 0).toFixed(1)} °C
            </div>
          </section>
          <section className="detail-item-top temp-min">
            <p className="label">
              <span className="material-symbols-outlined">
                thermostat_arrow_down
              </span>{' '}
              Temp
            </p>
            <div className="value">
              {(Number(weather.temp_min) || 0).toFixed(1)} °C
            </div>
          </section>
        </section>

        {/* WIND */}
        <section className="wind-group" aria-labelledby="wind-title">
          <div className="wind-group-heading" id="wind-title">
            <p className="label-wind-heading">
              <span className="material-symbols-outlined air">air</span> Wind
            </p>
            {/* <ArrowNorthIcon /> */}
            <div className="arrow-set">
              <span className="arrow-north-frame">
                <img
                  src={arrowNorth}
                  alt={`Wind direction ${weather.wind?.deg} degrees`}
                  className="arrow-north"
                  style={{ '--deg': `${weather.wind?.deg}deg` }}
                  width="70"
                  height="70"
                  loading="lazy"
                />
              </span>
            </div>
          </div>

          <div className="wind-group-content" id="wind-content">
            <div className="detail-item-wind direction">
              <p className="label">Direction</p>
              <div className="value">
                {weather.wind?.deg ?? '--'} °{' '}
                {getWindDirection(weather.wind?.deg)}
              </div>
            </div>
            <div className="detail-item-wind speed">
              <p className="label">Speed</p>
              <div className="value">{weather.wind?.speed} m/s</div>
            </div>
            <div className="detail-item-wind gust">
              <p className="label">Gust</p>
              <div className="value"> {weather.wind?.gust} m/s</div>
            </div>
          </div>
        </section>

        {/* FUNDAMENTALS BOTTOM*/}
        <section className="fundamentals-bottom">
          <section className="detail-item-bottom pressure">
            <p className="label">
              <span className="material-symbols-outlined">compress</span>{' '}
              Pressure
            </p>
            <div className="value">{weather.pressure} hPa</div>
          </section>
          <section className="detail-item-bottom clouds">
            <p className="label">
              <span className="material-symbols-outlined">cloud</span> Clouds
            </p>
            <div className="value">{weather.clouds?.all} %</div>
          </section>
          <section className="detail-item-bottom sunrise">
            <p className="label">
              <span className="material-symbols-outlined">wb_twilight</span>{' '}
              Sunrise
            </p>
            <div className="value">
              {new Date(
                (weather.sys?.sunrise + weather.timezone) * 1000
              ).toLocaleTimeString('en-GB', {
                hour: 'numeric',
                minute: 'numeric',
              })}
            </div>
          </section>
          <section className="detail-item-bottom sunset">
            <p className="label">
              <span className="material-symbols-outlined sunset-icon">
                wb_twilight
              </span>{' '}
              Sunset
            </p>
            <div className="value">
              {new Date(
                (weather.sys?.sunset + weather.timezone) * 1000
              ).toLocaleTimeString('en-GB', {
                hour: 'numeric',
                minute: 'numeric',
              })}
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}
