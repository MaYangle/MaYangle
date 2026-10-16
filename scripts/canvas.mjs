const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const ink = '#172c40';
const mid = '#637d95';
const random01 = seed => {const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123; return value - Math.floor(value);};

function wrap(value, width, size, limit = 4) {
  const words = String(value ?? '').trim().split(/\s+/).filter(Boolean);
  const capacity = Math.max(10, Math.floor(width / (size * .51)));
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > capacity && line) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  if (lines.length > limit) {
    const visible = lines.slice(0, limit);
    visible[limit - 1] = `${visible[limit - 1].slice(0, Math.max(1, capacity - 1))}…`;
    return visible;
  }
  return lines;
}
function text(x, y, value, size = 18, color = ink, options = {}) {
  const {weight = 400, anchor = 'start', spacing = 0, className = '', href = ''} = options;
  const node = `<text x="${x}" y="${y}" font-family="Inter,Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${spacing}" fill="${color}"${className ? ` class="${className}"` : ''}>${esc(value)}</text>`;
  return href ? `<a href="${esc(href)}" target="_top">${node}</a>` : node;
}
function paragraph(x, y, value, width, size, color = mid, leading = size * 1.46, maxLines = 4) {
  const lines = wrap(value, width, size, maxLines);
  return {svg: lines.map((line, i) => text(x, y + i * leading, line, size, color)).join(''), bottom: y + Math.max(0, lines.length - 1) * leading, lines};
}
function link(x, y, label, url, size = 17, color = mid, options = {}) {
  return text(x, y, label, size, color, {...options, href: url});
}
function flowingLink(x, y, value, href, width, size, color = ink, leading = size * 1.38, maxLines = 3) {
  const lines = wrap(value, width, size, maxLines);
  const safeHref = esc(href);
  const tspans = lines.map((line, index) => `<tspan x="${x}" dy="${index ? leading : 0}">${esc(line)}</tspan>`).join('');
  return `<a href="${safeHref}" target="_top"><text x="${x}" y="${y}" font-family="Inter,Arial,Helvetica,sans-serif" font-size="${size}" fill="${color}">${tspans}</text></a>`;
}
function safeDate(value) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return 'DATE UNAVAILABLE';
  return new Date(value).toISOString().slice(0, 10);
}
function label(x, y, value, mobile = false) {
  return text(x, y, String(value).toUpperCase(), mobile ? 12 : 11, mid, {weight: 600, spacing: mobile ? 2 : 2.4});
}
function stars(width, height, count = 118) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = ((i * 193.37 + 31) % width).toFixed(2);
    const y = ((i * i * 43.77 + i * 17 + 29) % height).toFixed(2);
    const r = i % 13 === 0 ? 1.7 : i % 5 === 0 ? 1.2 : .7;
    const delay = -((i * .73) % 9).toFixed(2);
    const opacity = i % 4 === 0 ? '.64' : '.30';
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 3 ? '#b9ccde' : '#819cb8'}" opacity="${opacity}" class="spark" style="animation-delay:${delay}s"/>`;
  }
  return out;
}
function planet(x, y, radius) {
  let surface = '<g clip-path="url(#planet-clip)">';
  for (let row = -2; row <= 2; row++) {
    const base = y + row * radius * .29;
    const a = Math.sin(row * 1.47 + .4) * radius * .13;
    const b = Math.cos(row * 1.12 + .8) * radius * .13;
    surface += `<path d="M${x - radius * 1.1} ${(base - radius * .12).toFixed(2)} C${x - radius * .57} ${(base + a).toFixed(2)} ${x + radius * .32} ${(base - b).toFixed(2)} ${x + radius * 1.1} ${(base + radius * .08).toFixed(2)}" fill="none" stroke="${row % 2 ? '#f2f7fc' : '#344c64'}" stroke-opacity="${row % 2 ? '.085' : '.09'}" stroke-width="${(radius * (row === 0 ? .075 : .045)).toFixed(2)}" class="world-cloudline"/>`;
  }
  for (let i = 0; i < 288; i++) {
    const angle = random01(i + 9) * Math.PI * 2;
    const distance = radius * .89 * Math.sqrt(random01(i + 71));
    const px = x + Math.cos(angle) * distance;
    const py = y + Math.sin(angle) * distance;
    const seed = random01(i + 193);
    const r = .52 + seed * 1.35;
    const color = i % 7 === 0 ? '#f5f8fb' : i % 4 === 0 ? '#526d88' : '#dce8f3';
    const opacity = (.08 + seed * .24).toFixed(2);
    const delay = (-seed * 14).toFixed(2);
    surface += `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${r.toFixed(2)}" fill="${color}" opacity="${opacity}" class="world-dust spark" style="animation-delay:${delay}s"/>`;
  }
  surface += '</g>';
  let ringDust = '';
  const tilt = -.315, outerX = radius * 1.11, outerY = radius * .26;
  for (let i = 0; i < 420; i++) {
    const angle = (i / 420) * Math.PI * 2 + random01(i + 997) * .018;
    const distance = .87 + random01(i * 5 + 211) * .29;
    const px = x + Math.cos(angle) * outerX * distance * Math.cos(tilt) - Math.sin(angle) * outerY * distance * Math.sin(tilt);
    const py = y + Math.cos(angle) * outerX * distance * Math.sin(tilt) + Math.sin(angle) * outerY * distance * Math.cos(tilt);
    const seed = random01(i * 7 + 79);
    const size = .34 + seed * 1.1;
    const delay = (-seed * 16).toFixed(2);
    const tint = i % 23 === 0 ? '#fff1d9' : i % 3 === 0 ? '#91adc9' : '#eef6ff';
    ringDust += `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${size.toFixed(2)}" fill="${tint}" opacity="${(.16 + seed * .54).toFixed(2)}" class="ring-dust spark" style="animation-delay:${delay}s"/>`;
  }
  return `<defs><clipPath id="planet-clip"><circle cx="${x}" cy="${y}" r="${radius}"/></clipPath></defs><g class="world-drift">
<ellipse cx="${x}" cy="${y}" rx="${radius * 1.1}" ry="${radius * .26}" transform="rotate(-18 ${x} ${y})" fill="none" stroke="#b9cce0" stroke-opacity=".21" stroke-width=".8"/>
<ellipse cx="${x}" cy="${y}" rx="${radius * 1.02}" ry="${radius * .23}" transform="rotate(-18 ${x} ${y})" fill="none" stroke="#a7c2dc" stroke-opacity=".48" stroke-width="1.1" stroke-dasharray="1 9" class="flow"/>
<circle cx="${x}" cy="${y}" r="${radius}" fill="url(#world)"/>
${surface}
<path d="M${x - radius * .87} ${y - radius * .52} A${radius} ${radius} 0 0 1 ${x + radius * .65} ${y - radius * .76}" fill="none" stroke="url(#rim)" stroke-width="4" opacity=".82"/>
<path d="M${x - radius * .94} ${y + radius * .14} A${radius} ${radius} 0 0 0 ${x + radius * .6} ${y + radius * .79}" fill="none" stroke="#e7f3ff" stroke-width="1.1" stroke-opacity=".42"/>
${ringDust}
<ellipse cx="${x}" cy="${y}" rx="${radius * 1.1}" ry="${radius * .26}" transform="rotate(-18 ${x} ${y})" fill="none" stroke="#f2dfc4" stroke-opacity=".7" stroke-width="2.2"/>
<ellipse cx="${x}" cy="${y}" rx="${radius * 1.1}" ry="${radius * .26}" transform="rotate(-18 ${x} ${y})" fill="none" stroke="#fff8ea" stroke-opacity=".55" stroke-width=".8" stroke-dasharray="2 22" class="flow"/>
</g>`;
}
function heroClouds(width, endY) {
  let out = `<g class="cloud-bank"><path d="M0 ${endY - 260}Q${width * .09} ${endY - 323} ${width * .21} ${endY - 252}T${width * .43} ${endY - 266}T${width * .7} ${endY - 250}T${width} ${endY - 278}V${endY}H0Z" fill="url(#cloudback)"/>
<path d="M0 ${endY - 209}Q${width * .1} ${endY - 258} ${width * .21} ${endY - 210}T${width * .45} ${endY - 203}T${width * .72} ${endY - 214}T${width} ${endY - 208}V${endY}H0Z" fill="#f8fbfe" fill-opacity=".49"/>
<path d="M0 ${endY - 195}Q${width * .17} ${endY - 255} ${width * .3} ${endY - 183}T${width * .57} ${endY - 192}T${width * .82} ${endY - 175}T${width} ${endY - 213}V${endY}H0Z" fill="url(#cloudfront)"/>
<path d="M0 ${endY - 150}Q${width * .1} ${endY - 198} ${width * .23} ${endY - 151}T${width * .51} ${endY - 148}T${width * .79} ${endY - 157}T${width} ${endY - 151}V${endY}H0Z" fill="#fff" fill-opacity=".65"/>
<path d="M0 ${endY - 117}Q${width * .13} ${endY - 173} ${width * .25} ${endY - 113}T${width * .5} ${endY - 129}T${width * .75} ${endY - 107}T${width} ${endY - 140}V${endY}H0Z" fill="#fff" fill-opacity=".74"/>
<path d="M0 ${endY - 230}Q${width * .12} ${endY - 282} ${width * .24} ${endY - 230}T${width * .47} ${endY - 236}T${width * .71} ${endY - 221}T${width} ${endY - 246}" fill="none" stroke="#f2f7fc" stroke-width="13" stroke-opacity=".35" class="cloud-flow"/>`;
  for (let i = 0; i < 510; i++) {
    const t = random01(i * 3 + 37);
    const layer = Math.floor(random01(i * 9 + 71) * 3);
    const x = 16 + t * (width - 32);
    const centerline = endY - 233 + layer * 44 + Math.sin(t * 6.283 + layer * 1.9) * 25;
    const noise = (random01(i * 17 + 3) - random01(i * 19 + 5)) * 58;
    const py = centerline + noise;
    const glow = random01(i * 29 + 7);
    const rx = .56 + glow * (i % 17 === 0 ? 3.2 : 1.75);
    const ry = .7 + glow * (i % 17 === 0 ? 1.65 : .95);
    const delay = (-(random01(i * 43 + 13) * 26)).toFixed(2);
    out += `<ellipse cx="${x.toFixed(2)}" cy="${py.toFixed(2)}" rx="${rx.toFixed(2)}" ry="${ry.toFixed(2)}" fill="${i % 11 === 0 ? '#fff' : i % 5 === 0 ? '#bad0e3' : '#e5eff8'}" opacity="${(.11 + glow * .38).toFixed(2)}" class="cloud-flow spark" style="animation-delay:${delay}s"/>`;
  }
  return out + '</g>';
}
function mountainSea(width, endY) {
  const base = endY - 186;
  return `<g transform="scale(${width / 1200} 1)"><g class="mountain-haze">
<path d="M0 ${base + 28}L38 ${base + 6}L58 ${base + 2}L79 ${base + 15}L107 ${base - 88}L121 ${base - 38}L143 ${base - 62}L163 ${base - 22}L184 ${base - 44}L207 ${base + 6}L243 ${base - 111}L259 ${base - 82}L278 ${base - 30}L299 ${base - 91}L321 ${base - 19}L349 ${base - 73}L382 ${base - 42}L406 ${base - 53}L435 ${base + 4}L472 ${base - 56}L498 ${base - 22}L524 ${base - 31}L553 ${base + 9}L573 ${base + 10}V${endY}H0Z" fill="#d8e3ed" fill-opacity=".24"/>
<path d="M91 ${base - 68}L107 ${base - 88}L121 ${base - 38}L134 ${base - 57}L124 ${base - 46}L116 ${base - 58}L109 ${base - 49}Z M226 ${base - 82}L243 ${base - 111}L259 ${base - 82}L272 ${base - 53}L254 ${base - 79}L245 ${base - 89}L237 ${base - 75}Z M286 ${base - 68}L299 ${base - 91}L321 ${base - 19}L305 ${base - 56}L299 ${base - 70}L294 ${base - 53}Z M330 ${base - 54}L349 ${base - 73}L382 ${base - 42}L360 ${base - 58}L348 ${base - 50}Z" fill="#f8fbfe" fill-opacity=".36"/>
<path d="M0 ${endY - 151}Q${width * .09} ${endY - 193} ${width * .2} ${endY - 150}T${width * .39} ${endY - 159}T${width * .58} ${endY - 146}T${width * .79} ${endY - 158}T${width} ${endY - 149}V${endY}H0Z" fill="#eef3f7" fill-opacity=".48"/>
</g></g>`;
}
function explorer(x, y) {
  return `<g transform="translate(${x} ${y})" fill="#384f64" stroke="#f4f8fc" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" opacity=".8">
<circle cx="0" cy="0" r="5.6" fill="#405870"/><path d="M-5 -1Q-4 -7 1 -6Q6 -4 5 1L2 3L-4 2Z" fill="#71889e"/><path d="M-7 8Q-5 5 0 5Q5 6 7 9L6 24L4 27L-4 26L-7 22Z" fill="#e7eff6"/><path d="M-6 11L-12 19L-9 22L-3 16M6 11L11 18L8 21L3 16" fill="none"/><path d="M-4 25L-5 38L-9 47L-5 49L0 39L2 26M3 26L4 38L9 47L6 49L0 40" fill="#d9e4ee"/><path d="M-7 10L-12 11L-15 17M7 10L12 11L15 17" fill="none"/><rect x="5" y="7" width="5" height="13" rx="2" fill="#8ca2b6" stroke="#e8eff6"/><path d="M-5 1H5" fill="none" stroke="#fff" stroke-width="1.5"/></g>`;
}
function horizonParticles(x, y, width, mobile = false) {
  let out = '';
  for (let i = 0; i < 78; i++) {
    const px = (x + ((i * 37.71) % width)).toFixed(1);
    const py = (y + Math.sin(i * .46) * (mobile ? 8 : 11) + (i % 4) * 3).toFixed(1);
    const r = i % 11 === 0 ? 1.65 : .8;
    out += `<circle cx="${px}" cy="${py}" r="${r}" fill="${i % 4 ? '#93abc3' : '#c5a978'}" opacity=".48" class="spark" style="animation-delay:-${(i * .41 % 9).toFixed(2)}s"/>`;
  }
  return out;
}
function researchFlow(mobile, y) {
  const left = mobile ? 46 : 624;
  const right = mobile ? 550 : 1154;
  const center = mobile ? 383 : 958;
  const top = y;
  const textSize = mobile ? 17 : 14;
  const names = ['TEXT', 'AUDIO', 'VISION'];
  const ys = [top, top + (mobile ? 55 : 49), top + (mobile ? 110 : 98)];
  let out = `<defs><radialGradient id="fusion"><stop stop-color="#b7d7f0" stop-opacity=".78"/><stop offset="1" stop-color="#d9e8f6" stop-opacity="0"/></radialGradient></defs><circle cx="${center}" cy="${top + (mobile ? 56 : 49)}" r="${mobile ? 83 : 76}" fill="url(#fusion)"/>`;
  for (let i = 0; i < names.length; i++) {
    const start = mobile ? left + 89 : left + 73;
    const path = `M${start} ${ys[i]} C${center - 139} ${ys[i]} ${center - 117} ${top + (mobile ? 56 : 49)} ${center} ${top + (mobile ? 56 : 49)} S${right - 99} ${top + (mobile ? 56 : 49)} ${right} ${top + (mobile ? 56 : 49)}`;
    out += text(left, ys[i] + 5, names[i], textSize, '#738ca5', {spacing: 1.4});
    out += `<path d="${path}" fill="none" stroke="#d1dfec" stroke-width="1.2" stroke-opacity=".85"/>
<path d="${path}" fill="none" stroke="${i === 1 ? '#83b5df' : '#afc3d8'}" stroke-width="1.3" stroke-linecap="round" stroke-dasharray="1 15" class="flow" style="animation-delay:-${i * 2.8}s"/>`;
  }
  out += `<circle cx="${center}" cy="${top + (mobile ? 56 : 49)}" r="4" fill="#83a8cc" class="pulse"/>
${text(center, top + (mobile ? 87 : 77), 'FUSION', mobile ? 12 : 10, '#71879c', {anchor: 'middle', spacing: 1.8})}
${text(right, top + (mobile ? 62 : 55), 'SENTIMENT', textSize, '#71879c', {anchor: 'end', spacing: 1.4})}`;
  return out;
}
function coverImage(cover, project, x, y, width, height) {
  if (!cover?.uri) return '';
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice"><image data-cover-repo="${esc(project.repo)}" data-cover-path="${esc(cover.path)}" data-cover-sha="${esc(cover.sha)}" href="${cover.uri}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/></svg>`;
}
function miniOrbit(x, y, width, mobile, index) {
  const top = y + 29;
  return `<path d="M${x} ${top + 10} Q${x + width * .48} ${top - 2} ${x + width} ${top + 10}" fill="none" stroke="#dce8f2" stroke-width=".8"/>
<path d="M${x} ${top + 10} Q${x + width * .48} ${top - 2} ${x + width} ${top + 10}" fill="none" stroke="#a7c4df" stroke-width="1" stroke-dasharray="1 15" class="flow" style="animation-delay:-${(index * 3.3).toFixed(1)}s"/>
${horizonParticles(x, top + 4, width, mobile)}`;
}
function featureSection(config, activity, mobile, animated) {
  const width = mobile ? 600 : 1200;
  const left = mobile ? 38 : 60;
  const right = mobile ? 562 : 1140;
  let y = mobile ? 705 : 705;
  let out = label(left, y, '01 / SELECTED RESEARCH', mobile);
  out += `<path d="M${mobile ? 38 : 293} ${y - (mobile ? 4 : 5)}H${right}" fill="none" stroke="#d8e2eb" stroke-width="1"/>`;
  y += mobile ? 57 : 71;
  const titleSize = mobile ? 32 : 40;
  out += text(left, y, config.projects[0]?.name ?? 'Multimodal Sentiment Fusion', titleSize, ink, {weight: 600, spacing: -1.6});
  const titleBottom = y;
  const description = 'Text, audio and vision. Controlled experiments, native evaluation and reproducible training.';
  const descriptionWidth = mobile ? 520 : 500;
  const desc = paragraph(left, y + (mobile ? 43 : 48), description, descriptionWidth, mobile ? 20 : 19, mid, mobile ? 29 : 29, 3);
  out += desc.svg;
  const flowY = mobile ? desc.bottom + 58 : y + 45;
  const flowX = mobile ? left : 620;
  const flowGraphic = researchFlow(mobile, flowY);
  if (mobile) out += flowGraphic;
  else out += flowGraphic;
  const metricsY = mobile ? flowY + 183 : flowY + 186;
  const metricGap = mobile ? 159 : 180;
  const features = [
    ['27', 'COMPLETED FITS'],
    ['3', 'SEEDS'],
    ['VALID', 'DEVELOPMENT SPLIT']
  ];
  for (let i = 0; i < features.length; i++) {
    const x = left + i * metricGap;
    out += text(x, metricsY, features[i][0], mobile ? 30 : 33, i === 2 ? '#527ca7' : ink, {weight: 400, spacing: -.7});
    out += text(x, metricsY + (mobile ? 21 : 23), features[i][1], mobile ? 9 : 10, mid, {spacing: 1.1});
  }
  const noteY = metricsY + (mobile ? 51 : 53);
  out += text(left, noteY, 'Routing gain not established against matched controls.', mobile ? 15 : 14, mid);
  out += text(left, noteY + (mobile ? 24 : 23), 'CH-SIMS v2.0 · 14 Oct 2026 · Final TEST remains independent.', mobile ? 13 : 12, '#8797a7');
  const metrics = config.research.snapshot.metrics.map(metric => `${metric.name}: MAE ${metric.score}`);
  let metricsBottom = noteY + (mobile ? 48 : 47);
  for (const item of metrics) {
    const row = paragraph(left, metricsBottom, item, mobile ? 520 : 500, 12, '#627e96', 17, 2);
    out += row.svg;
    metricsBottom = row.bottom + 18;
  }
  const linksY = Math.max(noteY + (mobile ? 61 : 56), metricsBottom + 2);
  const project = config.projects[0];
  const codeLink = link(left, linksY, 'CODE', project.url, mobile ? 13 : 12, '#5688b7', {spacing: 1.1});
  const architecture = link(left + (mobile ? 97 : 88), linksY, 'ARCHITECTURE', project.links[0].url, mobile ? 13 : 12, '#5688b7', {spacing: 1.1});
  const experiment = link(left + (mobile ? 250 : 228), linksY, 'EXPERIMENTS', project.links[1].url, mobile ? 13 : 12, '#5688b7', {spacing: 1.1});
  out += codeLink + architecture + experiment;
  const bottom = linksY + (mobile ? 42 : 34);
  out += `<path d="M${left} ${bottom}H${right}" fill="none" stroke="#e5ebf1" stroke-width="1"/>`;
  return {svg: out, bottom, firstY: titleBottom, flowX};
}
function renderProjectRows(activity, config, y0, mobile, covers = {}) {
  const projects = activity.projects.filter(item => !config.projects.some(project => project.url.toLowerCase() === item.url.toLowerCase()));
  if (!projects.length) return {svg: '', height: 0};
  const w = mobile ? 600 : 1200;
  const x = mobile ? 38 : 60;
  const right = mobile ? 562 : 1140;
  const rowHeight = mobile ? 205 : 164;
  let svg = '';
  svg += label(x, y0 + 4, '02 / MORE PUBLIC PROJECTS', mobile);
  let y = y0 + 32;
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const rowTop = y + i * rowHeight;
    const imageW = mobile ? 522 : 338;
    const imageH = mobile ? 96 : 111;
    const art = covers[project.repo] ? coverImage(covers[project.repo], project, x, rowTop + 12, imageW, imageH) : '';
    svg += art || miniOrbit(x, rowTop + 20, imageW, mobile, i);
    const tx = mobile ? x : x + imageW + 32;
    const tw = mobile ? 520 : 700;
    const titleY = mobile ? rowTop + imageH + 36 : rowTop + 43;
    const name = project.name || project.repo.split('/')[1].replaceAll('-', ' ');
    const target = project.url;
    svg += link(tx, titleY, name, target, mobile ? 21 : 22, ink, {weight: 550, spacing: -.45});
    const description = project.description || 'Public repository.';
    const desc = paragraph(tx, titleY + (mobile ? 25 : 31), description, tw, mobile ? 16 : 15, mid, mobile ? 22 : 21, mobile ? 2 : 2);
    svg += desc.svg;
    const metaY = Math.max(desc.bottom + 24, mobile ? rowTop + rowHeight - 18 : rowTop + 119);
    const meta = [project.language, `${safeDate(project.pushedAt)} · UPDATED`].filter(Boolean).join('   ·   ');
    svg += text(tx, metaY, meta, mobile ? 12 : 11, '#8798a8', {spacing: .5});
    if (i < projects.length - 1) svg += `<path d="M${x} ${rowTop + rowHeight - 1}H${right}" stroke="#e8edf2" fill="none"/>`;
  }
  const height = 32 + projects.length * rowHeight;
  svg += `<path d="M${x} ${y0 + height}H${right}" stroke="#e5ebf1" fill="none"/>`;
  return {svg, height};
}
function renderOpenSource(activity, config, y0, mobile) {
  const x = mobile ? 38 : 60;
  const right = mobile ? 562 : 1140;
  const projects = activity.repositories ?? [];
  const rows = activity.pullRequests ?? [];
  const primary = projects.slice(0, 6);
  const rowHeight = mobile ? 90 : 67;
  const hasAdditionalProjects = activity.projects.some(item => !config.projects.some(project => project.url.toLowerCase() === item.url.toLowerCase()));
  let out = label(x, y0 + 4, `${hasAdditionalProjects ? '03' : '02'} / UPSTREAM CONTRIBUTIONS`, mobile);
  let y = y0 + 50;
  for (let i = 0; i < primary.length; i++) {
    const repo = primary[i];
    const name = config.activity?.repositoryLabels?.[repo.repo] ?? repo.repo.split('/')[1].replaceAll('-', ' ');
    const primaryStatus = repo.merged > 0 ? `${repo.merged} merged` : repo.open > 0 ? `${repo.open} open` : `${repo.closed} closed without merge`;
    const secondary = repo.merged > 0 ? `${repo.open} open · ${repo.closed} closed without merge` : '';
    out += link(x, y + 1, name, repo.url, mobile ? 17 : 19, ink, {weight: 500});
    if (mobile) {
      out += text(x, y + 26, `${repo.merged} merged · ${repo.open} open · ${repo.closed} closed without merge`, 12, repo.open > 0 && repo.merged === 0 ? '#648c76' : '#8293a3');
    } else {
      const statusX = right - 104;
      out += text(statusX, y, primaryStatus, 16, repo.open > 0 && repo.merged === 0 ? '#6e9b84' : '#6685a2', {anchor: 'end'});
      if (secondary) out += text(x, y + 25, secondary, 12, '#8998a6');
    }
    y += rowHeight;
    if (i < primary.length - 1) out += `<path d="M${x} ${y - 17}H${right}" fill="none" stroke="#edf1f5"/>`;
  }
  const recent = rows.filter(p => p.status === 'open').slice(0, 1).concat(rows.filter(p => p.status === 'merged').slice(0, 1));
  const height = 50 + primary.length * rowHeight + 14;
  let activityY = y0 + height;
  out += text(x, activityY, 'RECENT ACTIVITY', mobile ? 11 : 11, '#8393a2', {spacing: 1.3});
  let activityX = x + (mobile ? 137 : 152);
  for (const pr of recent) {
    const state = pr.status === 'merged' ? 'MERGED' : 'OPEN';
    const color = pr.status === 'merged' ? '#5984ad' : '#648f7c';
    const repoLabel = config.activity?.repositoryLabels?.[pr.repo] ?? pr.repo.split('/')[1];
    const itemText = `PR #${pr.number} · ${state}`;
    const href = pr.url;
    out += `<circle cx="${activityX}" cy="${activityY - 4}" r="3" fill="${color}"/>`;
    activityX += 11;
    out += link(activityX, activityY, itemText, href, mobile ? 12 : 12, color);
    activityX += mobile ? 141 : 150;
  }
  return {svg: out, height: height + 37};
}
function verifyActivity(activity, config) {
  if (!activity || !config || activity.username !== config.username || !activity.counts) throw new TypeError('Activity and profile config are required');
  for (const key of ['merged', 'open', 'closed', 'mergedRepositories', 'publicProjects']) {
    if (!Number.isSafeInteger(activity.counts[key]) || activity.counts[key] < 0) throw new TypeError(`Invalid activity.counts.${key}`);
  }
  if (!Array.isArray(activity.projects) || !Array.isArray(activity.repositories) || !Array.isArray(activity.pullRequests)) throw new TypeError('Incomplete activity snapshot');
  for (const pr of activity.pullRequests) if (!['merged', 'open', 'closed'].includes(pr.status)) throw new TypeError('Invalid upstream PR state');
  for (const repo of activity.repositories) for (const key of ['merged', 'open', 'closed']) if (!Number.isSafeInteger(repo[key]) || repo[key] < 0) throw new TypeError(`Invalid ${key} repository PR count`);
  if (!config.research?.snapshot || !Array.isArray(config.research.directions)) throw new TypeError('Research snapshot is required');
}
export function renderProfile(activity, config, {mobile = false, animated = true, covers = {}} = {}) {
  verifyActivity(activity, config);
  if (!config.projects?.length) throw new TypeError('Select at least one featured project');
  const width = mobile ? 600 : 1200;
  const margin = mobile ? 38 : 60;
  const right = width - margin;
  let y = mobile ? 617 : 670;
  const heroHeight = mobile ? 640 : 690;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${heroHeight}" viewBox="0 0 ${width} ${heroHeight}" preserveAspectRatio="xMidYMid slice"><rect width="${width}" height="${heroHeight}" fill="#f7fbff"/>
<defs><linearGradient id="world" x1=".12" y1=".12" x2=".91" y2=".89"><stop stop-color="#ddeaf6"/><stop offset=".48" stop-color="#a8bed2"/><stop offset="1" stop-color="#334b62"/></linearGradient><linearGradient id="rim"><stop stop-color="#fff" stop-opacity=".1"/><stop offset=".45" stop-color="#fff8ec"/><stop offset="1" stop-color="#d5e7f8" stop-opacity=".1"/></linearGradient><linearGradient id="cloudback" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#dce8f3" stop-opacity=".77"/></linearGradient><linearGradient id="cloudfront" x2="0" y2="1"><stop stop-color="#edf4fb" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity=".96"/></linearGradient><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#f8fbff"/><stop offset=".6" stop-color="#fff"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect width="${width}" height="${heroHeight}" fill="url(#sky)"/>`;
  svg += stars(width, heroHeight - 88, mobile ? 76 : 118);
  const pX = mobile ? 452 : 930, pY = mobile ? 207 : 196, pR = mobile ? 143 : 203;
  svg += planet(pX, pY, pR);
  svg += mountainSea(width, heroHeight - 5);
  svg += heroClouds(width, heroHeight - 5);
  if (!mobile) svg += explorer(148, heroHeight - 288);
  svg += `<path d="M${margin} ${heroHeight - 57} Q${width * .5} ${heroHeight - 37} ${right} ${heroHeight - 58}" fill="none" stroke="#ccd9e6" stroke-width="1"/><path d="M${margin} ${heroHeight - 57} Q${width * .5} ${heroHeight - 37} ${right} ${heroHeight - 58}" fill="none" stroke="#a4bad0" stroke-width="1" stroke-dasharray="1 17" class="flow"/>`;
  const mast = label(margin, mobile ? 48 : 48, 'AI ENGINEERING / MULTIMODAL LEARNING', mobile);
  svg += mast + text(right, mobile ? 48 : 48, `@${activity.username}`, mobile ? 13 : 13, mid, {anchor: 'end'});
  const title = mobile ? 60 : 96;
  svg += text(margin, mobile ? 137 : 205, config.name, title, ink, {weight: 600, spacing: mobile ? -3.2 : -5.2});
  svg += text(margin + 2, mobile ? 184 : 265, 'Multimodal learning.', mobile ? 23 : 30, '#627e96', {weight: 300, spacing: -.7});
  svg += text(margin + 2, mobile ? 216 : 302, 'Reproducible systems.', mobile ? 23 : 30, '#627e96', {weight: 300, spacing: -.7});
  const statY = mobile ? 495 : 606;
  const stats = [
    [String(activity.counts.merged), 'Merged upstream PRs'],
    [String(activity.counts.open), 'Open upstream PRs'],
    [String(activity.counts.publicProjects), 'Public projects']
  ];
  const gap = mobile ? 178 : 232;
  for (let i = 0; i < stats.length; i++) {
    const x = margin + i * gap;
    svg += text(x, statY, stats[i][0], mobile ? 36 : 46, ink, {weight: 400, spacing: -1.3});
    svg += text(x, statY + (mobile ? 24 : 27), stats[i][1], mobile ? 12 : 13, '#62778b');
    if (i > 0) svg += `<path d="M${x - 18} ${statY - 31}V${statY + (mobile ? 38 : 41)}" fill="none" stroke="#d8e2eb" stroke-width="1"/>`;
  }
  const stripBottom = mobile ? 540 : 653;
  svg += `<path d="M${margin} ${stripBottom}H${right}" fill="none" stroke="#edf1f5"/>`;
  svg += '</svg>';
  const research = featureSection(config, activity, mobile, animated);
  const projectStart = research.bottom + (mobile ? 47 : 42);
  const projects = renderProjectRows(activity, config, projectStart, mobile, covers);
  const openStart = projectStart + projects.height + (projects.height ? (mobile ? 26 : 24) : 0);
  const open = renderOpenSource(activity, config, openStart, mobile);
  const commitY = openStart + open.height + (mobile ? 61 : 50);
  const x = margin;
  const ruleTo = right;
  let foot = `<path d="M${x} ${commitY - 30}H${ruleTo}" fill="none" stroke="#e6ecf2"/>`;
  foot += label(x, commitY, 'Latest project activity', mobile);
  const commit = activity.projects.find(p => p.latestCommit)?.latestCommit;
  let bottom = commitY + 43;
  if (commit) {
    const project = activity.projects.find(p => p.latestCommit)?.name ?? 'Recent project update';
    const commitLines = wrap(`${safeDate(commit.date)} · ${project} · ${commit.message}`, width - margin * 2, mobile ? 13 : 14, 2);
    foot += flowingLink(x, bottom, `${safeDate(commit.date)} · ${project} · ${commit.message}`, commit.url, width - margin * 2, mobile ? 13 : 14, mid, mobile ? 19 : 20, 2);
    bottom += commitLines.length * (mobile ? 19 : 20) + (mobile ? 24 : 20);
  }
  const updated = safeDate(activity.updatedAt);
  bottom += mobile ? 18 : 13;
  foot += `<path d="M${x} ${bottom} Q${width / 2} ${bottom - 25} ${right} ${bottom}" fill="none" stroke="#dce6ef"/><path d="M${x} ${bottom} Q${width / 2} ${bottom - 25} ${right} ${bottom}" fill="none" stroke="#a7bed4" stroke-dasharray="1 14" class="flow"/>`;
  foot += text(x, bottom + 31, `GITHUB PUBLIC DATA · REFRESHED EVERY 6 HOURS · ${updated}`, mobile ? 10 : 11, '#8697a7', {spacing: .55});
  foot += text(x, bottom + 53, 'Development VALID only · Final TEST remains independent', mobile ? 11 : 12, '#8b9baa');
  const height = bottom + (mobile ? 75 : 70);
  const dots = animated ? `<style>@keyframes current-line{to{stroke-dashoffset:-100}}.streak{animation:current-line 18s linear infinite}</style>` : '';
  const art = `${svg.slice(0, svg.lastIndexOf('</svg>'))}${dots}${svg.slice(svg.lastIndexOf('</svg>'))}`;
  const motion = animated ? `<style>
@keyframes orbit-flow{to{stroke-dashoffset:-190}}
@keyframes particle-shimmer{0%,100%{opacity:.18}40%{opacity:.78}70%{opacity:.38}}
@keyframes cloud-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(7px)}}
@keyframes focal-breathe{0%,100%{opacity:.68}50%{opacity:1}}
@keyframes world-drift{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
@keyframes mountain-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(3px)}}
.flow,.current{animation:orbit-flow 32s linear infinite;stroke-linecap:round}
.spark{animation:particle-shimmer 8s ease-in-out infinite}
.cloud-flow{animation:cloud-drift 54s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.cloud-bank{animation:cloud-drift 86s ease-in-out infinite}
.mountain-haze{animation:mountain-drift 96s ease-in-out infinite}
.pulse{animation:focal-breathe 8s ease-in-out infinite}
 .world-drift{animation:world-drift 76s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@media(prefers-reduced-motion:reduce){.flow,.current,.spark,.cloud-flow,.cloud-bank,.mountain-haze,.pulse,.world-drift{animation:none!important}}
</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="profile-title profile-desc">
<title id="profile-title">${esc(config.name)} — multimodal learning and reproducible systems</title>
<desc id="profile-desc">${esc(config.bio)} ${activity.counts.merged} merged upstream pull requests and ${activity.counts.open} open. Research studies multimodal fusion on CH-SIMS v2.0. The full text version below includes live links and experiment limits.</desc>
<defs><linearGradient id="paper" x1="0" y1="0" x2=".92" y2="1"><stop stop-color="#f9fbfe"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#fbfdff"/></linearGradient><radialGradient id="nebula"><stop stop-color="#dceaf7" stop-opacity=".53"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
${motion}<rect width="${width}" height="${height}" fill="url(#paper)"/><ellipse cx="${width * .66}" cy="${mobile ? 1170 : 1110}" rx="${width * .54}" ry="270" fill="url(#nebula)" opacity=".2"/>
${art}<g>${research.svg}</g>${projects.svg}<g>${open.svg}</g><g>${foot}</g></svg>\n`;
}
