import { useState, useEffect, useRef } from 'react';
import './styles.css';
import WeatherResult from './components/WeatherResult';
import SearchPanel from './components/SearchPanel';
import { getWeatherKey } from './utils/weather/getWeatherKey';
import { groupForecastByDay } from './utils/data/groupForecastByDay';
import { normalizeWeather } from './utils/data/normalizeWeather';
import { normalizeForecast } from './utils/data/normalizeForecast';
import { getWeatherImageSrc } from './utils/weather/getWeatherImageSrc';
import { validateWeather } from './utils/data/validateWeather';
import { getTimePeriod } from './utils/time/getTimePeriod';
const API_KEY = import.meta.env.VITE_API_KEY;
const MAX_HISTORY = 5;

/* =========================
  🧰 Utilities (pure)
========================= */
// text helpers
const capitalize = (str) => {
  if (str === undefined || str === null) {
    return '';
  }
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const getWindDirection = (deg) => {
  if (deg == null) return '';

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

// styles
const getBackgroundColor = (weather) => {
  const periodState = getTimePeriod(weather);
  if (periodState === 'day') {
    return 'linear-gradient(180deg, rgba(146, 213, 254, 1), rgba(236, 245, 252, 1))';
  }
  if (periodState === 'dawn') {
    return 'linear-gradient(180deg, #ff9a8b, #ff6a88, #e9b4f4)';
  }
  if (periodState === 'dusk') {
    return 'linear-gradient(180deg, #5a71c2ff, #ae7bd2ff, #fc8e7dff)';
  }
  return 'linear-gradient(180deg, rgba(26, 35, 51, 1), rgba(44, 80, 148, 1))';
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
  return '#bcd4f6';
};

export default function WeatherApp() {
  /* =========================
    🔸 State
  ========================= */
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [showList, setShowList] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('weatherHistory');
    if (!saved) return [];

    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [localTime, setLocalTime] = useState(new Date());
  const [showLocalTime, setShowLocalTime] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [dailyForecast, setDailyForecast] = useState([]);

  /* =========================
    🔸 Refs
  ========================= */
  const typingTimer = useRef(null);
  const inputRef = useRef(null);
  const weatherRef = useRef(null);
  const searchRef = useRef(null);
  const errorRef = useRef(null);

  /* =========================
    🔄 Persistence
  ========================= */
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

  /* =========================
    🎯 UI focus & dismissal
  ========================= */
  useEffect(() => {
    if (showSearch && !loading && !error && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSearch, loading, error]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (errorRef.current?.contains(e.target)) {
        return;
      }

      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowList(false);
        setShowSearch(false);
        setIsUserTyping(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearch]);

  /* =========================
    ⏱️ Timers & auto-dismiss
  ========================= */
  useEffect(() => {
    if (!error && !infoMessage) return;

    const timer = setTimeout(() => {
      dismissMessageAndResetSearch(); // ✅ same recovery logic
      setInfoMessage('');
      setShowList(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [error, infoMessage]);

  useEffect(() => {
    if (!showLocalTime) return;

    const interval = setInterval(() => {
      setLocalTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [showLocalTime]);

  /* =========================
    🌐 Async logic
  ========================= */
  const fetchCitySuggestions = async (geoLocation) => {
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

  const fetchCurrentWeather = async (city) => {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
    );
    if (!res.ok) throw new Error('Current weather failed');
    return res.json();
  };

  const fetchForecast = async (city) => {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
    );

    if (!res.ok) throw new Error('Forecast failed');

    return res.json();
  };

  const fetchWeather = async (inputCity) => {
    if (!inputCity.trim()) return;

    try {
      setLoading(true);
      setError('');
      setInfoMessage('');
      setIsUserTyping(false);
      setShowList(false);

      if (import.meta.env.DEV) {
        await new Promise((r) => setTimeout(r, 150));
      }

      const city = inputCity.trim();

      /* Check cache */
      const cacheKey = `weather_${city}`;

      const cached = sessionStorage.getItem(cacheKey);

      if (cached) {
        const { data, timestamp } = JSON.parse(cached);

        if (Date.now() - timestamp < 10 * 60 * 1000) {
          setWeather(data.weather);
          setDailyForecast(data.forecast);
          setLoading(false);
          return;
        }
      }

      const [current, forecastRaw] = await Promise.all([
        fetchCurrentWeather(city),
        fetchForecast(city),
      ]);

      const normalized = normalizeWeather(current);
      const safeWeather = validateWeather(normalized);
      setWeather(safeWeather);

      const normalizedForecast = normalizeForecast(forecastRaw.list);
      const groupedForecast = groupForecastByDay(
        normalizedForecast,
        forecastRaw.city.timezone
      );

      setDailyForecast(groupedForecast);

      /* Save cache */
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: {
            weather: safeWeather,
            forecast: groupedForecast,
          },
          timestamp: Date.now(),
        })
      );

      setShowSearch(false);
      setCity('');

      addToHistory(`${current.name}, ${current.sys.country}`, normalized);
      localStorage.setItem('lastCity', city);
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setShowSearch(true);
      setShowList(false);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
    🧠 Derived data
  ========================= */
  const dropdownItems = [
    ...suggestions.map((item) => ({
      type: 'suggestion',
      name: item.name || item,
    })),

    ...(history.length > 0
      ? [
          { type: 'divider', name: 'Recent Searches' },
          ...history.map((item) => ({ ...item, type: 'history' })),
          { type: 'clear', name: '🗑️ Clear History' },
        ]
      : []),
  ];

  const appStyle = {
    background: getBackgroundColor(weather),
    color: getFontColor(weather),
    '--focus-color': getFontColor(weather),
    transition: 'background-color 0.8s ease',
  };

  const placeholderText = loading
    ? 'Fetching...'
    : error
      ? 'Try another city'
      : 'Enter city...';

  let weatherImage = null;

  if (weather?.condition) {
    weatherImage = getWeatherImageSrc(weather);
  }

  /* =========================
    🎛️ Event handlers
  ========================= */
  const addToHistory = (city, weather) => {
    if (!city || !city.trim() || !weather) return;

    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const normalizedWeather = weather.condition
      ? weather
      : normalizeWeather(weather);

    const newItem = {
      city,
      temp: weather.temp ?? null,
      weather: normalizedWeather,
      time,
      type: 'history',
    };

    setHistory((prev) => {
      const withoutDup = prev.filter(
        (item) => item.city.toLowerCase() !== city.toLowerCase()
      );
      return [newItem, ...withoutDup].slice(0, MAX_HISTORY);
    });
  };

  const handleSearchSubmit = (shouldScroll = false) => {
    if (!city.trim()) return;
    setSuggestions([]);
    setShowList(false);
    setShowSearch(false);

    fetchWeather(city);
    /*fetchForecast(city);*/
    if (shouldScroll) {
      setTimeout(() => {
        weatherRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const handleSuggestionSelect = (selection) => {
    if (!selection?.trim()) return;

    setCity(selection);
    setSuggestions([]);
    setShowList(false);
    setShowSearch(false);

    fetchWeather(selection);
  };

  const handleInputClick = () => {
    setIsUserTyping(true);
    if (city.trim()) {
      setCity('');
      setSuggestions([]);
      setShowList(true);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;

    setCity(value);
    setIsUserTyping(true);
    setSelectedIndex(-1);

    if (error || infoMessage) {
      setError('');
      setInfoMessage('');
    }

    setShowList(true);

    if (!value.trim()) {
      setSuggestions([]);
      setShowList(false);
      return;
    }

    clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(async () => {
      try {
        const results = await fetchCitySuggestions(value);
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
      setSuggestions([]);
      setShowList(false);
      return;
    }
  };

  const resetSearchState = () => {
    if (loading) return;
    setCity('');
    setSuggestions([]);
    setSelectedIndex(-1);
    setShowList(false);
    setIsUserTyping(false);
    setError('');
    setInfoMessage('');
  };

  const handleSearchToggle = () => {
    if (loading) return;
    resetSearchState();
    setShowSearch(true);
  };

  const handleCloseSearch = () => {
    resetSearchState();
    setShowSearch(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowList(false);
      setSelectedIndex(-1);
      return;
    }

    if (e.key === 'Backspace' && city.trim() === '') {
      setShowList(false);
      setSelectedIndex(-1);
      return;
    }

    if (e.key === 'Enter' && !showList && city.trim()) {
      e.preventDefault();
      handleSearchSubmit();
      return;
    }

    if (!showList || dropdownItems.length === 0) return;

    if (['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === 'ArrowDown') {
      setSelectedIndex((prev) =>
        prev < dropdownItems.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : dropdownItems.length - 1
      );
      return;
    }

    if (e.key === 'Enter') {
      if (selectedIndex === -1 && city.trim()) {
        handleSearchSubmit();
        setShowList(false);
        return;
      }
      const chosen = dropdownItems[selectedIndex];
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

      if (chosen.type === 'suggestion') {
        handleSuggestionSelect(chosen.name);
      } else if (chosen.type === 'history') {
        handleSuggestionSelect(chosen.city);
      }

      setShowList(false);
      setSelectedIndex(-1);
    }
  };

  const handleReset = () => {
    setCity('');
    setError('');
    setInfoMessage('');
  };

  const dismissMessageAndResetSearch = () => {
    setError('');
    setCity('');
    setShowSearch(true);
    setSuggestions([]);
    setShowList(false);
    setIsUserTyping(false); // 🔒 prevent dropdown from reopening
  };

  /* =========================
    🎨 UI effects (DOM)
  ========================= */
  const ripple = (e) => {
    const button = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${
      e.clientX - button.getBoundingClientRect().left - radius
    }px`;
    circle.style.top = `${
      e.clientY - button.getBoundingClientRect().top - radius
    }px`;
    circle.classList.add('ripple');

    const existing = button.getElementsByClassName('ripple')[0];
    if (existing) existing.remove();

    button.appendChild(circle);
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        {' '}
        Skip to main content{' '}
      </a>
      <div className="app" style={appStyle}>
        {/* TITLE | SEARCH-TOGGLE | CLOSE-SEARCH-BTN */}
        <header className="app-header">
          <div className="header-row">
            <div className="header-left" />
            <h1 className="title">Weather Orbit </h1>
            <div className="header-actions">
              {!showSearch && (
                <button
                  className={`search-toggle ${showSearch ? 'hidden' : ''}`}
                  style={appStyle}
                  onClick={handleSearchToggle}
                  aria-label="Open search"
                >
                  <span className="material-symbols-outlined">search</span>
                </button>
              )}
              {showSearch && (
                <button
                  className={`close-search-btn ${showSearch ? 'show' : ''}`}
                  style={appStyle}
                  onClick={handleCloseSearch}
                  aria-label="Close search"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>
          </div>
          {/* SEARCH-PANEL */}
          <SearchPanel
            inputRef={inputRef}
            searchRef={searchRef}
            state={{
              city,
              loading,
              error,
              suggestions,
              history,
              showList,
              showSearch,
              selectedIndex,
            }}
            actions={{
              setCity,
              setSuggestions,
              setHistory,
              setShowList,
              handleSearchSubmit,
              handleSuggestionSelect,
              handleInputClick,
              handleInputChange,
              handleKeyDown,
              handleReset,
              ripple,
            }}
            derived={{
              dropdownItems,
              placeholderText,
            }}
          />
        </header>

        {/* MAIN CONTENT */}
        <main id="main-content" className="main-display ">
          {/* GLOBAL MESSAGES – ERR/INFO MSG */}
          <div className="messages-group">
            <div className="messages">
              {!loading && error && (
                <div
                  className="info-message error-message"
                  ref={errorRef}
                  role="alert"
                >
                  <button
                    className="close-msg"
                    onClick={dismissMessageAndResetSearch}
                    aria-label="Close error message"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                  ⚠️ {error}
                </div>
              )}
              {!loading && !error && infoMessage && (
                <div className="info-message">ℹ️ {infoMessage}</div>
              )}
            </div>
          </div>
          {/* WEATHER INFO */}
          <div className="weather-placeholder">
            <div className={`weather-stage ${weather ? 'has-weather' : ''}`}>
              <WeatherResult
                weather={weather}
                weatherImage={weatherImage}
                dailyForecast={dailyForecast}
                timezone={weather?.timezone}
                getWeatherKey={getWeatherKey}
                getWindDirection={getWindDirection}
                capitalize={capitalize}
                loading={loading}
              />
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="app-footer">
          {weather && (
            <>
              <p className="last-updated">
                Last Updated –{' '}
                <span className="material-symbols-outlined location">
                  location_on
                </span>{' '}
                {weather.name}
                {' · '}
                {weather.sys?.country}
                {new Date(
                  (weather.dt + weather.timezone) * 1000
                ).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  hour: 'numeric',
                  minute: 'numeric',
                })}
              </p>
              <p className="gmt-now">
                GMT Now –{' '}
                {new Date().toLocaleString('en-GB', {
                  timeZone: 'UTC',
                  weekday: 'long',
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </p>
              <p className="powered-by">
                Powered by{' '}
                <a href="https://openweathermap.org/" target="_blank">
                  OpenWeatherMap
                </a>
              </p>
            </>
          )}
        </footer>
      </div>
    </>
  );
}
