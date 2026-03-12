import { getWeatherImageSrc } from '../utils/weather/getWeatherImageSrc';

export default function SearchPanel({
  inputRef,
  searchRef,
  state,
  actions,
  derived,
}) {
  // ---- state (read-only)
  const {
    city,
    loading,
    error,
    showList,
    showSearch,
    history,
    suggestions,
    selectedIndex,
  } = state;

  // ---- actions (functions)
  const {
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
  } = actions;

  // ---- derived (computed elsewhere)
  const { dropdownItems = [], placeholderText = '' } = derived || {};

  return (
    <div className={`search-panel ${showSearch ? 'open' : ''}`} ref={searchRef}>
      <div className="controls">
        <div className="input-group">
          {/* INPUT-WRAPPER – INPUT RESET SEARCH */}
          <div className="input-wrapper">
            <label className="visually-hidden" htmlFor="city-search">
              City
            </label>
            <input
              id="city-search"
              type="text"
              ref={inputRef}
              value={city}
              onChange={handleInputChange}
              placeholder={placeholderText}
              onFocus={() => {
                if (!loading || error) {
                  setShowList(true);
                }
              }}
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
                <span className="material-symbols-outlined">close</span>
              </button>
            )}
            <button
              type="button"
              className="get-weather-btn"
              onClick={(e) => {
                ripple(e);
                handleSearchSubmit();
              }}
              aria-label="Search city"
            >
              <span className="material-symbols-outlined">search</span>
            </button>
          </div>

          {/* DROPDOWN */}
          {showList && dropdownItems.length > 0 && (
            <ul className={`dropdown-list ${showList ? 'show' : 'hide'}`}>
              {dropdownItems.map((item, index) => {
                const imgSrc =
                  item.type === 'history'
                    ? getWeatherImageSrc(item.weather)
                    : null;

                console.log('History Weather:', item.weather);

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
                    onMouseDown={() => {
                      if (item.type === 'suggestion') {
                        handleSuggestionSelect(item.name);
                      } else if (item.type === 'history') {
                        handleSuggestionSelect(item.city);
                      }
                    }}
                  >
                    {item.type === 'suggestion' && <span>{item.name}</span>}
                    {item.type === 'history' && (
                      <span className="recent-search-item">
                        <span className="city">{item.city}</span>
                        <span className="weather-mini">
                          {item.type === 'history' && imgSrc && (
                            <img
                              src={imgSrc}
                              alt={item.weather?.description || 'weather'}
                              width="36"
                              height="36"
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                        </span>
                        <span className="temp-mini">
                          {item.temp.toFixed(1) ?? '--'} °C{' '}
                        </span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {/* EMPTY STATE */}
        {showSearch &&
          !loading &&
          !error &&
          city.trim() === '' &&
          history.length === 0 &&
          suggestions.length === 0 && (
            <div className="no-recent-searches">No recent searches</div>
          )}
      </div>
    </div>
  );
}
