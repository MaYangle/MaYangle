import {readFileSync} from 'node:fs';
const art = JSON.parse(readFileSync(new URL('../assets/art/cosmic-particles.json', import.meta.url), 'utf8'));
const cache = new Map();
const n = value => String(Math.round(value * 10) / 10);

function buildRegion(name) {
  if (cache.has(name)) return cache.get(name);
  const region = art.regions[name];
  if (!region) throw new Error(`Unknown particle region: ${name}`);
  const indices = Buffer.from(region.indices, 'base64');
  if (indices.length !== region.columns * region.rows) throw new Error('Invalid particle sample length');
  const groups = Array.from({length: 4}, () => new Map());
  const dx = region.bounds.width / region.columns, dy = region.bounds.height / region.rows;
  let count = 0;
  for (let row = 0; row < region.rows; row++) {
    for (let column = 0; column < region.columns; column++) {
      const color = region.palette[indices[row * region.columns + column]];
      if (!/^[a-f0-9]{6}$/.test(color)) throw new Error('Invalid sampled colour');
      const r = parseInt(color.slice(0, 2), 16), g = parseInt(color.slice(2, 4), 16), b = parseInt(color.slice(4, 6), 16);
      if (Math.min(r, g, b) >= 250) continue;
      const phase = (column * 3 + row * 7) % 4;
      const x = (column + .5) * dx, y = (row + .5) * dy;
      const existing = groups[phase].get(color) ?? [];
      existing.push(`M${n(x)} ${n(y)}h.01`);
      groups[phase].set(color, existing);
      count++;
    }
  }
  const strokeWidth = n(Math.max(dx, dy) * 1.48);
  const svg = groups.map((palette, phase) => `<g class="sample-phase sample-${phase}">${[...palette].map(([color, path]) => `<path fill="none" stroke="#${color}" stroke-width="${strokeWidth}" stroke-linecap="round" d="${path.join('')}"/>`).join('')}</g>`).join('');
  const result = {...region, count, svg};
  cache.set(name, result);
  return result;
}
function heroStreams() {
  return `<g fill="none" stroke-linecap="round"><path d="M492 225C625 257 784 302 1020 373" stroke="#c4a777" stroke-opacity=".46" stroke-width="1.5" stroke-dasharray="1 23" class="photo-stream"/><path d="M548 249C708 307 862 353 1020 388" stroke="#b7d3ee" stroke-opacity=".65" stroke-width="1.25" stroke-dasharray="1 23" class="photo-stream"/><path d="M3 512C199 467 390 544 598 556S857 535 1023 579" stroke="#adc4d9" stroke-opacity=".32" stroke-width="1.2" stroke-dasharray="1 19" class="photo-cloud-stream"/></g>`;
}
function fusionStreams() {
  return `<g fill="none" stroke-linecap="round"><path d="M85 53C180 60 238 139 353 137" stroke="#b8d8f1" stroke-width="1.3" stroke-opacity=".7" stroke-dasharray="1 23" class="photo-stream"/><path d="M85 133C188 123 255 144 353 137" stroke="#7eafd6" stroke-width="1.3" stroke-opacity=".7" stroke-dasharray="1 23" class="photo-stream"/><path d="M84 223C183 198 251 147 353 137" stroke="#d7b782" stroke-width="1.3" stroke-opacity=".7" stroke-dasharray="1 23" class="photo-stream"/></g>`;
}
export function renderParticleArtwork(name, x, y, width, height, {animated = true, fadeBottom = false, fit = 'xMidYMid meet'} = {}) {
  const region = buildRegion(name);
  const gradient = `particle-fade-${name}-${Math.round(x)}-${Math.round(y)}`;
  const streams = animated ? name === 'hero' ? heroStreams() : name === 'fusion' ? fusionStreams() : '' : '';
  const fade = fadeBottom ? `<defs><linearGradient id="${gradient}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#fff"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect x="0" y="${n(region.bounds.height * .76)}" width="${region.bounds.width}" height="${n(region.bounds.height * .24)}" fill="url(#${gradient})"/>` : '';
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${region.bounds.width} ${region.bounds.height}" preserveAspectRatio="${fit}" aria-label="Image-sampled ${animated ? 'animated' : 'static'} particle scene: ${name}"><rect width="${region.bounds.width}" height="${region.bounds.height}" fill="#fff"/>${region.svg}${streams}${fade}</svg>`;
}
export function particleRegionStats(name) { const region = buildRegion(name); return {particles: region.count, bytes: region.svg.length, source: region.bounds}; }
export const sampledParticleMotion = `
.sample-phase{will-change:transform}
@keyframes sampled-drift-a{0%,100%{transform:translate(0,0)}50%{transform:translate(.23px,-.18px)}}
@keyframes sampled-drift-b{0%,100%{transform:translate(0,0)}50%{transform:translate(-.2px,.2px)}}
@keyframes sampled-drift-c{0%,100%{transform:translate(0,0)}50%{transform:translate(.17px,.21px)}}
@keyframes sampled-drift-d{0%,100%{transform:translate(0,0)}50%{transform:translate(-.21px,-.16px)}}
@keyframes sampled-current{to{stroke-dashoffset:-120}}
.sample-0{animation:sampled-drift-a 11s ease-in-out infinite}
.sample-1{animation:sampled-drift-b 13s ease-in-out infinite}
.sample-2{animation:sampled-drift-c 17s ease-in-out infinite}
.sample-3{animation:sampled-drift-d 19s ease-in-out infinite}
.photo-stream{animation:sampled-current 9s linear infinite}
.photo-cloud-stream{animation:sampled-current 28s linear infinite}
@media(prefers-reduced-motion:reduce){.sample-phase,.photo-stream,.photo-cloud-stream{animation:none!important}}
`;
