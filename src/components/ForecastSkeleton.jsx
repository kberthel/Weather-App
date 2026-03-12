export default function ForecastSkeleton() {
  return (
    <section
      className="forecast-container skeleton show"
      aria-busy="true"
      aria-live="polite"
    >
      <h2 className="forecast-heading skeleton-box">Loading forecast...</h2>

      <div className="forecast-content">
        {Array.from({ length: 5 }).map((_, i) => (
          <article key={i} className="forecast-day skeleton">
            <div className="forecast-weekday-date-group">
              <div className="skeleton-box skeleton-text small"></div>
              <div className="skeleton-box skeleton-text small"></div>
            </div>

            <div className="forecast-image">
              <div className="skeleton-box skeleton-icon"></div>
            </div>

            <div className="forecast-temp-pop-group">
              <div className="skeleton-box skeleton-text"></div>
              <div className="skeleton-box skeleton-text min"></div>
              <div className="skeleton-box skeleton-text"></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
