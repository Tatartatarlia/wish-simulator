const STARS: readonly (readonly [number, number, number])[] = [
  [80, 48, 1.1],
  [150, 90, 1.6],
  [230, 36, 1],
  [310, 110, 1.3],
  [420, 52, 1.8],
  [860, 40, 1.2],
  [980, 78, 1.5],
  [1120, 46, 1],
  [1240, 96, 1.7],
  [1320, 40, 1.1],
  [70, 180, 1],
  [1180, 180, 1.4],
  [1280, 240, 1],
  [90, 300, 1.5],
  [200, 250, 1],
  [1040, 300, 1.2],
  [1360, 340, 1.3],
  [160, 430, 1],
  [1260, 470, 1.6],
  [40, 520, 1.2],
  [300, 560, 1],
  [1080, 540, 1.1],
  [500, 30, 1],
  [700, 24, 1.4],
  [760, 70, 1],
]

export function BannerArt() {
  return (
    <svg className="banner-art" viewBox="0 0 1400 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ba-space" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#07111f" />
          <stop offset="0.42" stopColor="#10284d" />
          <stop offset="0.72" stopColor="#1a4e86" />
          <stop offset="1" stopColor="#12345f" />
        </linearGradient>
        <radialGradient id="ba-nebula" cx="0.62" cy="0.48" r="0.48">
          <stop offset="0" stopColor="#7fd0ff" stopOpacity="0.55" />
          <stop offset="0.45" stopColor="#2f6dff" stopOpacity="0.2" />
          <stop offset="1" stopColor="#2f6dff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ba-moon" cx="0.4" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#f7fbff" />
          <stop offset="0.55" stopColor="#b9dcff" />
          <stop offset="1" stopColor="#6e97c9" />
        </radialGradient>
        <linearGradient id="ba-ice" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor="#b7ecff" />
          <stop offset="1" stopColor="#4f8dff" />
        </linearGradient>
        <linearGradient id="ba-shade" x1="0" x2="1">
          <stop offset="0" stopColor="#050a14" stopOpacity="0.62" />
          <stop offset="0.38" stopColor="#050a14" stopOpacity="0.08" />
          <stop offset="0.7" stopColor="#050a14" stopOpacity="0" />
          <stop offset="1" stopColor="#050a14" stopOpacity="0.28" />
        </linearGradient>
      </defs>

      <rect width="1400" height="640" fill="url(#ba-space)" />
      <ellipse cx="860" cy="300" rx="460" ry="250" fill="url(#ba-nebula)" />
      <circle cx="210" cy="500" r="96" fill="url(#ba-moon)" opacity="0.18" />

      {STARS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} className="art-star" cx={x} cy={y} r={r} fill="#fff" />
      ))}

      <g className="art-crystal" style={{ animationDelay: '0s' }}>
        <path d="M120 90 156 142 120 196 84 142Z" fill="url(#ba-ice)" opacity="0.75" />
      </g>
      <g className="art-crystal" style={{ animationDelay: '1.4s' }}>
        <path d="M1260 150 1296 200 1260 254 1224 200Z" fill="url(#ba-ice)" opacity="0.8" />
      </g>
      <g className="art-crystal" style={{ animationDelay: '0.4s' }}>
        <path d="M430 500 462 546 430 598 398 546Z" fill="url(#ba-ice)" opacity="0.8" />
      </g>

      <path d="M250 150 286 198 250 248 214 198Z" fill="url(#ba-ice)" opacity="0.7" />
      <rect width="1400" height="640" fill="url(#ba-shade)" />
    </svg>
  )
}
