const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

function validate(activity) {
  if (!activity || typeof activity !== 'object') throw new TypeError('activity must be an object');
  if (typeof activity.username !== 'string' || !activity.username.trim()) throw new TypeError('activity.username is required');
  if (!activity.counts || typeof activity.counts !== 'object') throw new TypeError('activity.counts is required');
  for (const key of ['merged', 'open', 'closed', 'mergedRepositories', 'publicProjects']) {
    if (!Number.isSafeInteger(activity.counts[key]) || activity.counts[key] < 0) throw new TypeError(`activity.counts.${key} must be a non-negative integer`);
  }
  if (typeof activity.updatedAt !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(activity.updatedAt) || !Number.isFinite(Date.parse(activity.updatedAt))) throw new TypeError('activity.updatedAt must be a valid ISO date');
}

const style = (animated) => `<style>
text{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;fill:#f4eee3}.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.muted{fill:#a7a9ab}.amber{fill:#f1ae54}.line{stroke:#71685d;stroke-opacity:.46}.signal{fill:none;stroke:#f1ae54;stroke-width:1.2;stroke-dasharray:3 10;stroke-linecap:round}${animated ? '@keyframes orbit{to{stroke-dashoffset:-52}}.signal{animation:orbit 9s linear infinite}@media(prefers-reduced-motion:reduce){.signal{animation:none}}' : ''}
</style>`;

function blackHole(cx, cy, scale = 1) {
  const disk = Array.from({length: 13}, (_, i) => {
    const y = 6 + i * .75;
    return `<ellipse cx="0" cy="${y}" rx="${144 - i * 1.6}" ry="${10 + i * .8}" fill="none" stroke="${i < 4 ? '#fff0d4' : '#d49049'}" stroke-width="${i < 4 ? .7 : .5}" opacity="${.42 - i * .022}"/>`;
  }).join('');
  const arch = 'M-144 7C-100 10-75-10-60-37C-37-80 37-80 60-37C75-10 100 10 144 7';
  return `<g transform="translate(${cx} ${cy}) scale(${scale})">
<ellipse rx="176" ry="66" fill="url(#aura)"/>
<path d="${arch}" fill="none" stroke="#bb7a40" stroke-width="13" opacity=".07"/>
<path d="${arch}" fill="none" stroke="#dfaa66" stroke-width="5" opacity=".18"/>
<path d="${arch}" fill="none" stroke="#ffe7c1" stroke-width="1.4" opacity=".85"/>
${disk}<circle r="48" fill="#07090e" stroke="#dba45d" stroke-width=".8"/>
<circle r="46.7" fill="none" stroke="#f8dfb7" stroke-width=".7" opacity=".55"/>
<path d="M-144 8C-94 28-56 28-28 21C-12 17 12 17 28 21C56 28 94 28 144 8" fill="none" stroke="#d69c55" stroke-width="5" opacity=".24"/>
<path d="M-144 8C-94 28-56 28-28 21C-12 17 12 17 28 21C56 28 94 28 144 8" fill="none" stroke="#ffeed3" stroke-width="1" opacity=".9"/>
<path d="M-80 15Q0 72 80 15" fill="none" stroke="#dfaa66" stroke-width=".65" opacity=".3"/>
</g>`;
}

const aura = '<radialGradient id="aura"><stop stop-color="#bb7940" stop-opacity=".25"/><stop offset=".48" stop-color="#855b35" stop-opacity=".08"/><stop offset="1" stop-color="#0a0c12" stop-opacity="0"/></radialGradient>';
function stars(width, height) {
  return '<g fill="#e9e5dc">' + Array.from({length: 47}, (_, i) => {
    const x = ((i * 137.508 + 17) % width).toFixed(2);
    const y = ((i * i * 29.19 + 11) % height).toFixed(2);
    const opacity = (.15 + (i % 5) * .09).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${i % 7 === 0 ? 1 : .55}" opacity="${opacity}"/>`;
  }).join('') + '</g>';
}

export function renderSummary(activity, { animated = true, mobile = false, name = 'Yangle Ma' } = {}) {
  validate(activity);
  const synced = new Date(activity.updatedAt).toISOString().replace('T', ' ').replace(/:\d{2}\.\d{3}Z$/, ' UTC');
  const stats = [
    ['Merged upstream PRs', activity.counts.merged],
    ['Open upstream PRs', activity.counts.open],
    ['Merged into repos', activity.counts.mergedRepositories],
    ['Public projects', activity.counts.publicProjects],
  ];
  if (mobile) {
    const statSvg = stats.map(([label, value], i) => {
      const x = i % 2 ? 250 : 24;
      const y = i < 2 ? 204 : 282;
      return `<g transform="translate(${x} 0)"><text x="0" y="${y}" font-size="30" font-weight="600" letter-spacing="-1">${value}</text><text x="0" y="${y + 24}" font-size="16" class="muted">${label}</text></g>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="380" viewBox="0 0 480 380" role="img" aria-labelledby="title desc">
<title id="title">${esc(name)} — public work and GitHub activity</title><desc id="desc">Public GitHub activity counts updated ${esc(synced)}.</desc>${style(animated)}
<defs><radialGradient id="space"><stop stop-color="#211e1b"/><stop offset="1" stop-color="#090b10"/></radialGradient><radialGradient id="lens"><stop offset="0" stop-color="#07080b"/><stop offset=".5" stop-color="#090b10"/><stop offset=".64" stop-color="#e9ad5e"/><stop offset=".72" stop-color="#111217"/><stop offset="1" stop-color="#090b10"/></radialGradient>${aura}</defs><rect width="480" height="380" rx="10" fill="url(#space)"/>
${stars(480,132)}<text x="24" y="45" font-size="28" font-weight="600">${esc(name)}</text><text x="24" y="72" font-size="16" class="muted">AI engineering · multimodal research</text>${blackHole(413, 82, .33)}
<text x="24" y="124" font-size="13" letter-spacing="1.5" class="amber">PUBLIC WORK / GITHUB ACTIVITY</text><path d="M24 140H456" class="line"/>${statSvg}<path d="M24 324H456" class="line"/><text x="24" y="346" font-size="12" class="muted">Closed without merge ${activity.counts.closed} · Public GitHub data</text><text x="24" y="367" font-size="12" class="muted mono">${esc(synced)}</text></svg>`;
  }
  const statSvg = stats.map(([label, value], i) => `<g transform="translate(${40 + i * 222} 0)"><text x="0" y="248" font-size="31" font-weight="600" letter-spacing="-1">${value}</text><text x="0" y="276" font-size="15" class="muted">${label}</text></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="320" viewBox="0 0 960 320" role="img" aria-labelledby="title desc">
<title id="title">${esc(name)} — public work and GitHub activity</title><desc id="desc">Public GitHub activity counts updated ${esc(synced)}.</desc>${style(animated)}
<defs><radialGradient id="space"><stop stop-color="#22201e"/><stop offset="1" stop-color="#090b10"/></radialGradient><radialGradient id="lens"><stop offset="0" stop-color="#07080b"/><stop offset=".47" stop-color="#08090d"/><stop offset=".58" stop-color="#f4c276"/><stop offset=".62" stop-color="#bd7438"/><stop offset=".68" stop-color="#16151a"/><stop offset="1" stop-color="#090b10"/></radialGradient>${aura}</defs>
<rect width="960" height="320" rx="10" fill="url(#space)"/>${stars(960,155)}
<text x="40" y="51" font-size="32" font-weight="600" letter-spacing=".3">${esc(name)}</text><text x="40" y="78" font-size="15" class="muted">AI engineering · multimodal research</text><text x="40" y="119" font-size="12" letter-spacing="1.7" class="amber">PUBLIC WORK / GITHUB ACTIVITY</text>
${blackHole(800, 90)}
<path d="M40 164H920" class="line"/><path d="M40 164H920" class="signal" opacity=".27"/>${statSvg}<path d="M40 291H920" class="line"/><text x="40" y="309" font-size="12" class="muted">Closed without merge ${activity.counts.closed} · Public GitHub data</text><text x="920" y="309" text-anchor="end" font-size="12" class="muted mono">Updated ${esc(synced)}</text></svg>`;
}

export function renderResearch({ animated = true, mobile = false } = {}) {
  if (mobile) {
    const stages = ['Frozen T / A / V features', 'Masked branches', 'Cross-attention', 'Policy routing', 'Scalar sentiment'];
    const boxes = stages.map((label, i) => {
      const y = 52 + i * 42;
      return `<g><rect x="78" y="${y}" width="324" height="34" rx="4" fill="#111318" stroke="${i === 4 ? '#a97b45' : '#48464a'}"/><text x="240" y="${y + 23}" text-anchor="middle" font-size="15">${label}</text></g>${i < stages.length - 1 ? `<path d="M240 ${y + 34}V${y + 42}" class="signal" marker-end="url(#arrow)"/>` : ''}`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320" role="img" aria-labelledby="research-title research-desc"><title id="research-title">Multimodal sentiment research architecture</title><desc id="research-desc">Frozen text, audio, and vision features pass through masked branches, cross-attention, policy routing, and scalar sentiment prediction. A training-only teacher distills the deployment policy.</desc>${style(animated)}<defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#f1ae54" stroke-width="1"/></marker></defs><rect width="480" height="320" rx="10" fill="#0b0d11"/><text x="24" y="29" font-size="12" letter-spacing="1.3" class="amber">MULTIMODAL SENTIMENT / MODEL PATH</text>${boxes}<text x="24" y="302" font-size="13" class="muted">TRAIN-only teacher distills deployment policy</text></svg>`;
  }
  const stages = [
    { x: 28, w: 150, title: 'Frozen T / A / V', sub: 'features' },
    { x: 210, w: 145, title: 'Masked branches', sub: 'modality paths' },
    { x: 387, w: 142, title: 'Cross-attention', sub: 'feature exchange' },
    { x: 561, w: 146, title: 'Policy routing', sub: 'selective fusion' },
    { x: 739, w: 193, title: 'Scalar sentiment', sub: 'prediction' },
  ];
  const nodes = stages.map((s, i) => `<g><rect x="${s.x}" y="72" width="${s.w}" height="59" rx="5" fill="#111318" stroke="${i === 4 ? '#a97b45' : '#48464a'}"/><text x="${s.x + s.w / 2}" y="96" text-anchor="middle" font-size="15" font-weight="550">${s.title}</text><text x="${s.x + s.w / 2}" y="117" text-anchor="middle" font-size="13" class="muted">${s.sub}</text></g>`).join('');
  const arrows = stages.slice(0, -1).map((s, i) => `<path d="M${s.x + s.w + 5} 101H${stages[i + 1].x - 7}" class="signal" marker-end="url(#arrow)"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="190" viewBox="0 0 960 190" role="img" aria-labelledby="research-title research-desc">
<title id="research-title">Multimodal sentiment research architecture</title><desc id="research-desc">Frozen text, audio, and vision features pass through masked branches, cross-attention, policy routing, and scalar sentiment prediction. A training-only teacher distills the deployment policy.</desc>${style(animated)}<defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#f1ae54" stroke-width="1"/></marker></defs><rect width="960" height="190" rx="10" fill="#0b0d11"/><text x="28" y="35" font-size="12" letter-spacing="1.7" class="amber">MULTIMODAL SENTIMENT / MODEL PATH</text><text x="932" y="35" text-anchor="end" font-size="12" class="muted mono">RESEARCH OVERVIEW</text>${arrows}${nodes}<text x="28" y="166" font-size="13" class="muted">TRAIN-only teacher distills deployment policy</text><path d="M420 162H932" class="line"/></svg>`;
}
