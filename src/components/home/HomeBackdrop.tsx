/** MJMS geometric atmosphere — full homepage + hero depth (light-first). */
export function HomePageAtmosphere() {
  return (
    <div className="home-page-atmosphere" aria-hidden="true">
      <div className="home-page-atmosphere-wash" />
      <svg
        className="home-page-atmosphere-svg"
        viewBox="0 0 1440 2400"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="home-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path
              d="M48 0H0V48"
              fill="none"
              stroke="#1F5AA6"
              strokeWidth="0.65"
              opacity="0.14"
            />
          </pattern>
          <linearGradient id="home-wash-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5F4F92" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#5F4F92" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="home-wash-teal" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6FB0B0" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#6FB0B0" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#home-grid)" />
        <rect width="100%" height="55%" fill="url(#home-wash-purple)" />
        <rect width="100%" height="45%" y="55%" fill="url(#home-wash-teal)" opacity="0.85" />

      </svg>
    </div>
  );
}

/** Extra hero-local layer for stronger edge composition. */
export function HomeHeroBackdrop() {
  return (
    <div className="home-backdrop" aria-hidden="true">
      <svg className="home-backdrop-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      </svg>
    </div>
  );
}
