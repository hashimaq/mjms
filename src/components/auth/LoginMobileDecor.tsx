/** Mobile-only scattered decorative shapes — no container box, individually positioned. */
export function LoginMobileDecor() {
  return (
    <div className="login-mobile-shapes login-geometry-masked" aria-hidden>
      <div className="login-mobile-shape login-mobile-shape--1">
        <svg viewBox="0 0 48 48" aria-hidden>
          <g className="brand-geo-anim brand-geo-anim--subtle brand-geo-anim-1">
            <path fill="#5F4F92" d="M4 4h40v40H4V24a20 20 0 0 1 20-20Z" />
          </g>
        </svg>
      </div>

      <div className="login-mobile-shape login-mobile-shape--2">
        <svg viewBox="0 0 56 32" aria-hidden>
          <g className="brand-geo-anim brand-geo-anim--subtle brand-geo-anim-2">
            <rect fill="#6FB0B0" x="4" y="6" width="48" height="20" transform="skewX(-22)" />
          </g>
        </svg>
      </div>

      <div className="login-mobile-shape login-mobile-shape--3">
        <svg viewBox="0 0 64 64" aria-hidden>
          <g className="brand-geo-anim brand-geo-anim--subtle brand-geo-anim-3">
            <path
              fill="none"
              stroke="#1F5AA6"
              strokeWidth="3.5"
              d="M8 48a32 32 0 0 1 64 0"
            />
          </g>
        </svg>
      </div>

      <div className="login-mobile-shape login-mobile-shape--4">
        <svg viewBox="0 0 40 40" aria-hidden>
          <g className="brand-geo-anim brand-geo-anim--subtle brand-geo-anim-4">
            <rect fill="#E3B233" x="6" y="12" width="28" height="16" transform="rotate(32 20 20)" />
          </g>
        </svg>
      </div>

      <div className="login-mobile-shape login-mobile-shape--5">
        <svg viewBox="0 0 36 36" aria-hidden>
          <g className="brand-geo-anim brand-geo-anim--subtle brand-geo-anim-5">
            <path fill="#CC2027" d="M4 4h28v28H4z" />
          </g>
        </svg>
      </div>
    </div>
  );
}
