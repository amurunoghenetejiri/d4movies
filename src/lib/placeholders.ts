// Branded SVG placeholders for missing images (no external requests, no broken thumbs)

function svg(w: number, h: number, label: string) {
  const s = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0' stop-color='#0a1f14'/>
        <stop offset='1' stop-color='#050707'/>
      </linearGradient>
      <radialGradient id='r' cx='50%' cy='40%' r='60%'>
        <stop offset='0' stop-color='#00c853' stop-opacity='0.35'/>
        <stop offset='1' stop-color='#050707' stop-opacity='0'/>
      </radialGradient>
    </defs>
    <rect width='${w}' height='${h}' fill='url(#g)'/>
    <rect width='${w}' height='${h}' fill='url(#r)'/>
    <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
      font-family='Inter,system-ui,sans-serif' font-weight='800'
      font-size='${Math.round(Math.min(w, h) / 10)}' fill='#00c853' letter-spacing='4'>D4</text>
    <text x='50%' y='${h / 2 + Math.round(Math.min(w, h) / 12)}' text-anchor='middle'
      font-family='Inter,system-ui,sans-serif' font-size='${Math.round(Math.min(w, h) / 24)}'
      fill='#ffd700' letter-spacing='6'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;
}

export const PLACEHOLDER_POSTER = svg(500, 750, "MOVIES");
export const PLACEHOLDER_BACKDROP = svg(1600, 900, "D4MOVIES");
export const PLACEHOLDER_PORTRAIT = svg(185, 278, "CAST");
export const PLACEHOLDER_AVATAR = svg(200, 200, "USER");
