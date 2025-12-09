import { useState, useEffect, useRef } from 'react';
import './styles.css';
import weatherImages from './weatherImages';

const API_KEY = 'e5e8dd66e7eeb92e7d29dd84a145b899';
const MAX_HISTORY = 5;

export default function WeatherApp() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [infoMessage, setInfoMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showList, setShowList] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [placeholderText, setPlaceholderText] = useState('Enter city...');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [localTime, setLocalTime] = useState(new Date());

  const typingTimer = useRef(null);
  const inputRef = useRef(null);
  const weatherRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('weatherHistory');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('weatherHistory', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
      fetchWeather(lastCity);
      setShowList(false);
    }
  }, []);

  useEffect(() => {
    if (weather?.name) {
      localStorage.setItem('lastCity', weather.name);
    }
  }, [weather]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  //Setting local time – temp.
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let resetTimer;

    if (loading) {
      setPlaceholderText('Fetching data...');
    } else if (error) {
      setPlaceholderText('Try another city?');
      resetTimer = setTimeout(() => setPlaceholderText('Enter city...'), 1000);
    } else if (infoMessage) {
      setPlaceholderText(infoMessage);
      resetTimer = setTimeout(() => setPlaceholderText('Enter city...'), 1000);
    } else {
      setPlaceholderText('Enter city...');
      setShowList(false);
    }
    return () => clearTimeout(resetTimer);
  }, [loading, error, infoMessage]);

  const fetchLocation = async (geoLocation) => {
    if (!geoLocation.trim()) return [];
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${geoLocation}&limit=5&appid=${API_KEY}`
      );
      if (!response.ok) return [];

      const data = await response.json();

      if (!data || data.length === 0) {
        console.log('No matching cities found for', geoLocation);
        return [];
      }

      const unique = new Set();

      return data
        .map((loc) => `${loc.name}, ${loc.country}`)
        .filter((loc) => {
          if (unique.has(loc)) return false;
          unique.add(loc);
          return true;
        });
    } catch (error) {
      console.error('Error fetching location:', error.message);
      return [];
    }
  };

  const fetchWeather = async (inputCity) => {
    if (!inputCity.trim()) return;
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${inputCity.trim()}&appid=${API_KEY}&units=metric`
      );
      if (!response.ok) {
        setError('City not found');
        setPlaceholderText();
        setTimeout(() => {
          setError('');
          setInfoMessage('');
          setCity('');
        }, 1000);
        return;
      }

      await new Promise((res) => setTimeout(res, 150));

      const data = await response.json();
      if (data.cod !== 200) throw new Error(data.message || 'Invalid data');
      setWeather(data);

      const formattedCity = `${data.name}, ${data.sys.country}`;
      addToHistory(formattedCity);
      localStorage.setItem('lastCity', inputCity);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError(err.message);
      setCity('');
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (newCity) => {
    if (!newCity.trim()) return;
    setHistory((prev) => {
      const withoutDup = prev.filter(
        (c) => c.toLowerCase() !== newCity.toLowerCase()
      );
      const updated = [newCity, ...withoutDup].slice(0, MAX_HISTORY);
      return updated;
    });
  };

  const handleSubmit = () => {
    if (city.trim()) {
      setShowList(false);
      fetchWeather(city);
    }
    setWeather(data);

    setTimeout(() => {
      weatherRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCity(value);
    setSelectedIndex(-1);
    setError('');
    setInfoMessage('');
    setShowList(true);

    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(async () => {
      if (!value.trim()) {
        setSuggestions([]);
        setShowList(false);
        return;
      }

      try {
        const results = await fetchLocation(value);
        if (results.length > 0) {
          setSuggestions(results);
          setShowList(true);
        } else {
          setSuggestions([]);
          setShowList(false);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setSuggestions([]);
        setShowList(false);
      }
    }, 300);

    if (value === 'Clear History') {
      setHistory([]);
      localStorage.removeItem('weatherHistory');
      setCity('');
      setShowList(false);
      setSuggestions([]);
      return;
    }
  };

  const handleInputClick = () => {
    if (city.trim()) {
      setCity('');
      setSuggestions([]);
      setShowList(true);
    }
  };

  const handleSuggestionSelect = (selection) => {
    setCity(selection);
    setSuggestions([]);
    setShowList(false);
    fetchWeather(selection);
  };

  const combined = [
    ...suggestions.map((item) => ({
      type: 'suggestion',
      name: item.name || item,
    })),
    ...(history.length > 0
      ? [
          { type: 'divider', name: 'Recent Searches' },
          ...history.map((item) => ({
            type: 'history',
            name: item.name || item,
          })),
          { type: 'clear', name: '🗑️ Clear History' },
        ]
      : []),
  ];

  const handleKeyDown = (e) => {
    if (
      (!showList || combined.length === 0) &&
      e.key === 'Enter' &&
      city.trim()
    ) {
      e.preventDefault();
      handleSubmit();
      return;
    }

    if (e.key === 'Escape' || (e.key === 'Backspace' && city.trim() === '')) {
      setShowList(false);
      setSelectedIndex(-1);
      return;
    }

    if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) e.preventDefault();

    if (!showList || combined.length === 0) return;

    if (e.key === 'ArrowDown') {
      setSelectedIndex((prev) => (prev < 0 ? 0 : (prev + 1) % combined.length));
      return;
    }

    if (e.key === 'ArrowUp') {
      setSelectedIndex((prev) =>
        prev < 0
          ? combined.length - 1
          : (prev - 1 + combined.length) % combined.length
      );
      return;
    }

    if (e.key === 'Enter') {
      if (selectedIndex === -1 && city.trim()) {
        handleSubmit();
        setShowList(false);
        return;
      }

      const chosen = combined[selectedIndex];
      if (!chosen || chosen.type === 'divider') return;

      if (chosen.type === 'clear') {
        setHistory([]);
        localStorage.removeItem('weatherHistory');
        setCity('');
        setSuggestions([]);
        setShowList(false);
        setSelectedIndex(-1);
        return;
      }

      handleSuggestionSelect(chosen.name);
      setSelectedIndex(-1);
      setShowList(false);
    }
  };

  const handleReset = () => {
    setCity('');
    setError('');
    setInfoMessage('');
    setPlaceholderText('Enter city...');
  };

  const ripple = (e) => {
    const button = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${e.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');

    button.appendChild(circle);
  };

  /*const ripple = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    btn.style.setProperty('--x', `${x}px`);
    btn.style.setProperty('--y', `${y}px`);

    btn.classList.remove('ripple-active');
    void btn.offsetWidth; // forces reflow so animation restarts
    btn.classList.add('ripple-active');
  };*/

  const getTimePeriod = (weather) => {
    if (!weather || !weather.sys) return '#b8e2fe)';

    const { dt, timezone, sys } = weather;
    const now = dt + timezone;
    const sunrise = sys.sunrise + timezone;
    const sunset = sys.sunset + timezone;

    const dawnStart = sunrise - 10800; // 900 / 1800 = 15 / 30 mins
    const dawnEnd = sunrise + 10900; // 10800 ~3 hours for testing purpose
    const duskStart = sunset - 10900;
    const duskEnd = sunset + 10800;

    if (now >= dawnStart && now <= dawnEnd) return 'dawn';
    if (now > dawnEnd && now < duskStart) return 'day';
    if (now >= duskStart && now <= duskEnd) return 'dusk';
    return 'night';
  };

  const getBackgroundColor = (weather) => {
    const periodState = getTimePeriod(weather);
    if (periodState === 'day') {
      return 'linear-gradient(to bottom, rgba(146, 213, 254, 1), rgba(236, 245, 252, 1))';
    }
    if (periodState === 'dawn') {
      return 'linear-gradient(180deg, #ff9a8b, #ff6a88, #e9b4f4)';
    }
    if (periodState === 'dusk') {
      return 'linear-gradient(180deg, #243d55, #a683bfff, #fc8e7dff)';
    }
    return 'linear-gradient(to bottom, rgba(61, 75, 101, 1), rgba(26, 35, 51, 1))'; // night
  };

  const getFontColor = (weather) => {
    const periodState = getTimePeriod(weather);
    if (
      periodState === 'day' ||
      periodState === 'dawn' ||
      periodState === 'dusk'
    ) {
      return '#0a0f2d';
    }
    return '#bcd4f6'; // night
  };

  const appStyle = {
    background: getBackgroundColor(weather),
    color: getFontColor(weather),
    transition: 'background-color 0.8s ease',
  };

  // Key for weatherImages
  const getWeatherKey = (id) => {
    const mapping = {
      clear: { value: 800 },
      mostly_clear: { value: 801 },

      clouds: { min: 802, max: 803 },
      overcast: { value: 804 },

      drizzle: { min: 300, max: 321 },
      rain: { list: [500, 501, 511, 520, 521, 522, 531] },
      heavy_rain: { list: [502, 503, 504] },
      thunderstorm: { min: 200, max: 232 },

      snow: { min: 600, max: 602 },
      sleet: { min: 611, max: 622 },

      fog: { list: [701, 711, 721, 741] },
      wind: { list: [731, 751, 761, 762, 771, 781] },
    };

    for (const key in mapping) {
      const rule = mapping[key];

      if (rule.value && id === rule.value) return key;
      if (rule.min && rule.max && id >= rule.min && id <= rule.max) return key;
      if (rule.list && rule.list.includes(id)) return key;
    }

    return null;
  };
  // --- Determine day/night for weather images
  const getWeatherTimeState = (weather) => {
    if (!weather || !weather.sys) return 'night'; // fallback

    const { dt, timezone, sys } = weather;
    const now = dt + timezone;
    const sunrise = sys.sunrise + timezone;
    const sunset = sys.sunset + timezone;

    const dawnStart = sunrise - 1800;
    const dawnEnd = sunrise + 900;
    const duskStart = sunset - 900;
    const duskEnd = sunset + 1800;

    if (now >= dawnStart && now <= dawnEnd) return 'day'; // treat dawn as day
    if (now > dawnEnd && now < duskStart) return 'day';
    if (now >= duskStart && now <= duskEnd) return 'night'; // treat dusk as night
    return 'night';
  };
  // --- Convert timeState to image prefix for weatherImages keys
  const getImageTimePrefix = (timeState) => {
    if (timeState === 'dawn') return 'day';
    if (timeState === 'dusk') return 'night';
    return timeState === 'day' ? 'day' : 'night';
  };

  let weatherImage = null;
  let isDayTime = true;

  if (weather) {
    const timeState = getWeatherTimeState(weather);
    const period = getImageTimePrefix(timeState);
    isDayTime = period === 'day';

    const key = getWeatherKey(weather.weather[0].id);
    const finalKey = `${period}_${key}`;

    weatherImage = weatherImages[finalKey] || weatherImages[key];
    console.log('weatherImage:', weatherImage);
  }

  const iconUrl = weather?.weather[0]
    ? `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`
    : '';

  // for weather conditions
  const capitalize = (str) =>
    str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  // {weather.wind?.deg} ° {windDirection}
  const getWindDirection = (deg) => {
    if (deg == null) return ''; // safety

    const directions = [
      'N',
      'NNE',
      'NE',
      'ENE',
      'E',
      'ESE',
      'SE',
      'SSE',
      'S',
      'SSW',
      'SW',
      'WSW',
      'W',
      'WNW',
      'NW',
      'NNW',
    ];

    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
  };

  return (
    <div className="app" style={appStyle}>
      <h1>Weather Orbit</h1>
      <div className="controls">
        <div className="input-group">
          <div className="input-wrapper">
            <input
              type="text"
              aria-label="Search"
              ref={inputRef}
              value={city}
              onChange={handleInputChange}
              placeholder={placeholderText}
              onFocus={() => {
                setShowList(true);
              }}
              onBlur={() => setTimeout(() => setShowList(false))}
              onClick={handleInputClick}
              onKeyDown={handleKeyDown}
            />
            {city && (
              <button
                type="button"
                className="reset-btn"
                onClick={handleReset}
                aria-label="Clear city"
              >
                ✗
              </button>
            )}
          </div>

          {showList && combined.length > 0 && (
            <ul className={`dropdown-list ${showList ? 'show' : 'hide'}`}>
              {combined.map((item, index) => {
                if (item.type === 'divider') {
                  return (
                    <li key={`divider-${index}`} className="divider">
                      {item.name}
                    </li>
                  );
                }

                if (item.type === 'clear') {
                  return (
                    <li
                      key={`clear-${index}`}
                      className="dropdown-item clear-history"
                      onMouseDown={() => {
                        setHistory([]);
                        localStorage.removeItem('weatherHistory');
                        setCity('');
                        setSuggestions([]);
                        setShowList(false);
                      }}
                    >
                      {item.name}
                    </li>
                  );
                }

                return (
                  <li
                    key={`${item.type}-${index}`}
                    className={`dropdown-item ${
                      index === selectedIndex ? 'active' : ''
                    } ${item.type === 'history' ? 'saved-history' : ''}`}
                    onMouseDown={() => handleSuggestionSelect(item.name)}
                  >
                    {item.name}
                  </li>
                );
              })}
            </ul>
          )}

          {!loading &&
            !error &&
            showList &&
            history.length === 0 &&
            suggestions.length === 0 && (
              <div className="info-message">No recent searches</div>
            )}
          {loading && (
            <div className="info-message loading">
              <div className="spinner"></div>
              <p>Loading weather...</p>
            </div>
          )}
          {/* ERROR MESSAGE */}
          {error && (
            <div className="info-message error-message show">⚠️ {error}</div>
          )}
          {/* INFO MESSAGE */}
          {!error && infoMessage && (
            <div className="info-message show">ℹ️ {infoMessage}</div>
          )}
        </div>

        <button
          className="get-weather-btn ripple-btn"
          onClick={(e) => {
            ripple(e);
            handleSubmit();
          }}
          onKeyDown={handleKeyDown}
        >
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>

      <div className="weather-placeholder">
        {!loading && !error && !weather && (
          <p className="landing">Enter a city to get started!</p>
        )}
        {weather && (
          <div ref={weatherRef} className="weather-result">
            {/*City + Country + Date + Image*/}
            <h2>
              {weather.name}
              {weather.sys?.country ? ` · ${weather.sys.country}` : ''}
            </h2>

            {weatherImage && (
              <img
                className="weather-graphic"
                src={weatherImage || iconUrl}
                alt={weather.weather[0].description}
              />
            )}

            {/*Description + Temperature*/}
            <div className="description-temperature">
              <p>{capitalize(weather.weather[0].description)}</p>
              <p className="temp-line">
                <span className="material-symbols-outlined icon">
                  thermometer
                </span>
                <span className="temp-value">
                  {weather.main?.temp.toFixed(1)} °C
                </span>
              </p>
            </div>
            {/* WEATHER DETAILS */}
            <div className="weather-details-grid">
              {/* Left Column*/}
              <div className="detail-group">
                <div className="detail-item">
                  <p className="label">Feels Like</p>
                  <p className="value">
                    {' '}
                    {weather.main?.feels_like.toFixed(1)} °C
                  </p>
                </div>

                <div className="detail-item">
                  <p className="label">TimeZone</p>
                  <p className="value">
                    GMT
                    {(weather.timezone / 3600 >= 1 ? '+' : '') +
                      weather.timezone / 3600}
                  </p>
                </div>
                <div className="detail-item">
                  <p className="label">Sunrise</p>
                  <p className="value">
                    {new Date(
                      (weather.sys?.sunrise + weather.timezone) * 1000
                    ).toLocaleTimeString('en-GB', {
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </p>
                </div>
                <div className="detail-item">
                  <p className="label">Sunset</p>
                  <p className="value">
                    {new Date(
                      (weather.sys?.sunset + weather.timezone) * 1000
                    ).toLocaleTimeString('en-GB', {
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </p>
                </div>
                <div className="detail-item">
                  <p
                    className="label value"
                    style={{
                      textAlign: 'center',
                      fontSize: '10px',
                      opacity: 0.7,
                    }}
                  >
                    Last Updated {' · '}
                    {weather.name}
                    {' · '}
                    {new Date(
                      (weather.dt + weather.timezone) * 1000
                    ).toLocaleString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              {/* Right Column*/}
              <div className="detail-group">
                {' '}
                <div className="detail-item">
                  <p className="label">Humidity</p>
                  <p className="value">{weather.main?.humidity} %</p>
                </div>
                <div className="detail-item">
                  <p className="label">Visibility</p>
                  <p className="value">
                    {(weather.visibility / 1000).toFixed(1)} km
                  </p>
                </div>
                <div className="detail-item">
                  <p className="label">Wind Direction</p>
                  <p className="value">
                    {weather.wind?.deg} ° {getWindDirection(weather.wind?.deg)}
                  </p>
                </div>
                <div className="detail-item">
                  <p className="label">Wind Speed</p>
                  <p className="value">{weather.wind?.speed} m/s</p>
                </div>
                <div className="detail-item">
                  <p className="label">Wind Gust</p>
                  <p className="value">{weather.wind?.gust} m/s</p>
                </div>
              </div>
            </div>
            {/*footer*/}
            <p
              style={{
                textAlign: 'center',
                fontSize: '10px',
                opacity: 0.7,
                marginTop: '20px',
              }}
            >
              Powered by OpenWeather
            </p>
            <p style={{ textAlign: 'center', fontSize: '10px', opacity: 0.7 }}>
              <p>
                <em>
                  GMT now:{' '}
                  {new Date().toLocaleString('en-GB', {
                    timeZone: 'UTC',
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </em>
              </p>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
