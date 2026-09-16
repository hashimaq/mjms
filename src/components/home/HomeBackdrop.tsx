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

        <circle cx="120" cy="200" r="260" fill="#6FB0B0" opacity="0.14" />
        <circle cx="1320" cy="140" r="220" fill="#5F4F92" opacity="0.16" />
        <circle cx="200" cy="900" r="180" fill="#1F5AA6" opacity="0.1" />
        <circle cx="1240" cy="1100" r="200" fill="#E3B233" opacity="0.11" />

        <path fill="#5F4F92" d="M0 680h360V480H180a180 180 0 0 1-180-180Z" opacity="0.12" />
        <path fill="#6FB0B0" d="M1440 820h-280V620h280V760a140 140 0 0 0-140 140Z" opacity="0.11" />
        <path
          fill="none"
          stroke="#1F5AA6"
          strokeWidth="2.5"
          d="M1080 720a160 160 0 0 1 320 0"
          opacity="0.22"
        />
        <path
          fill="none"
          stroke="#CC2027"
          strokeWidth="2"
          d="M80 420a56 56 0 0 1 112 0"
          opacity="0.18"
        />
        <rect
          fill="#E3B233"
          x="880"
          y="480"
          width="140"
          height="40"
          transform="skewX(-18)"
          opacity="0.14"
        />
        <path fill="#CC2027" d="M1280 600a56 56 0 0 1 112 0" opacity="0.12" />
        <polygon fill="#E3B233" points="220,520 280,420 340,520" opacity="0.13" />
        <path fill="#5F4F92" d="M1180 980h64v64h-64V1012a32 32 0 0 1 32-32Z" opacity="0.1" />
        <rect fill="#6FB0B0" x="60" y="1280" width="100" height="28" transform="skewX(-16)" opacity="0.12" />
        <path
          fill="none"
          stroke="#5F4F92"
          strokeWidth="2.5"
          d="M1320 1500a80 80 0 0 1 160 0"
          opacity="0.15"
        />
        <polygon fill="#1F5AA6" points="100,1680 160,1680 130,1740" opacity="0.1" />
        <rect fill="#CC2027" x="1100" y="1780" width="48" height="48" opacity="0.08" transform="rotate(12 1124 1804)" />
      </svg>
    </div>
  );
}

/** Extra hero-local layer for stronger edge composition. */
export function HomeHeroBackdrop() {
  return (
    <div className="home-backdrop" aria-hidden="true">
      <svg className="home-backdrop-svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <circle cx="200" cy="180" r="240" fill="#5F4F92" opacity="0.1" />
        <circle cx="1240" cy="200" r="200" fill="#6FB0B0" opacity="0.12" />
        <path fill="#1F5AA6" d="M1440 0h-200v200H1240a200 200 0 0 0 200-200Z" opacity="0.09" />
        <path fill="#E3B233" d="M0 900h240V720H120a120 120 0 0 1-120-120Z" opacity="0.1" />
        <path
          fill="none"
          stroke="#CC2027"
          strokeWidth="2.5"
          d="M720 760a100 100 0 0 1 200 0"
          opacity="0.16"
        />
        <rect fill="#5F4F92" x="40" y="640" width="88" height="26" transform="skewX(-16)" opacity="0.11" />
      </svg>
    </div>
  );
}
