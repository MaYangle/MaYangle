/**
 * Renders the profile sheet as a standalone SVG.
 *
 * There is no headline metric on this sheet, so the name leads and the record
 * carries the second weight. Counts are drawn as one tick per pull request —
 * a unit chart, which stays honest at six and would stay honest at sixty.
 */

const PAL = {
  paper: '#fafaf6',
  ink: '#1a1a1a',
  muted: '#747472',
  rule: '#c8c8c4',
  blue: '#3553ff',
};

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace";

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const ch = (size) => size * 0.63;

export function wrapWords(text, size, maxW) {
  const budget = Math.max(8, Math.floor(maxW / ch(size)));
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if (!line.length) line = w;
    else if (line.length + 1 + w.length <= budget) line += ' ' + w;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}

class Svg {
  constructor(w) { this.w = w; this.parts = []; this.h = 0; }
  add(...s) { this.parts.push(...s); return this; }

  text(x, y, str, o = {}) {
    const {
      size = 10, fill = PAL.ink, weight = 400, anchor = 'start',
      ls = 0, upper = false,
    } = o;
    const body = upper ? String(str).toUpperCase() : String(str);
    const attrs = [
      `x="${x}"`, `y="${y}"`,
      `font-family="${MONO}"`, `font-size="${size}"`,
      `fill="${fill}"`,
      weight !== 400 ? `font-weight="${weight}"` : '',
      anchor !== 'start' ? `text-anchor="${anchor}"` : '',
      ls ? `letter-spacing="${ls}"` : '',
    ].filter(Boolean).join(' ');
    return this.add(`<text ${attrs}>${esc(body)}</text>`);
  }

  sectionLabel(x, y, no, title, size = 9) {
    this.text(x, y, no, { size, weight: 700, fill: PAL.blue, ls: 1.5 });
    this.text(x + (no.length + 3) * ch(size), y, title, { size, weight: 700, ls: 1.5, upper: true });
  }

  line(x1, y1, x2, y2, o = {}) {
    const { stroke = PAL.rule, w = 1 } = o;
    return this.add(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}"/>`
    );
  }

  rect(x, y, w, h, o = {}) {
    const { stroke = PAL.rule, fill = 'none', sw = 1 } = o;
    return this.add(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ` +
      `stroke="${stroke}" stroke-width="${sw}"/>`
    );
  }

  render() {
    const h = Math.round(this.h);
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${h}" `,
      `viewBox="0 0 ${this.w} ${h}" role="img">`,
      `<rect width="${this.w}" height="${h}" fill="${PAL.paper}"/>`,
      ...this.parts,
      `</svg>`,
    ].join('');
  }
}

/** one bar per pull request: filled when merged, outlined when not */
function ticks(s, x, baseY, total, merged, o) {
  const { w = 8, h = 16, gap = 7 } = o;
  for (let i = 0; i < total; i += 1) {
    const bx = x + i * (w + gap);
    const filled = i < merged;
    s.rect(bx, baseY - h, w, h, {
      fill: filled ? PAL.blue : 'none',
      stroke: filled ? PAL.blue : PAL.muted,
    });
  }
  return x + total * (w + gap) - gap;
}

const countLabel = (r) => `${r.merged} of ${r.total} merged`;
const nf = (n) => (n == null ? '—' : n.toLocaleString('en-US'));
const scaleLabel = (r) => `${nf(r.stars)} stars · ${nf(r.forks)} forks`;

/* ------------------------------------------------------------------ */
/*  desktop                                                            */
/* ------------------------------------------------------------------ */

function desktop(data, s) {
  const W = 920;
  const PAD = 44;
  const RIGHT = W - PAD;
  const CONTENT = RIGHT - PAD;

  s.w = W;

  s.line(PAD, 30, RIGHT, 30, { stroke: PAL.blue, w: 1.5 });
  s.text(PAD, 48, 'FIG 000 / PROFILE SHEET', { size: 9, weight: 700, fill: PAL.blue, ls: 1.8 });
  s.text(RIGHT, 48, 'github.com/MaYangle', { size: 9, fill: PAL.muted, ls: 1.4, anchor: 'end' });

  s.text(PAD, 116, data.name, { size: 56, weight: 700, fill: PAL.blue, ls: 2.4 });
  s.text(PAD, 148, data.role, { size: 19, weight: 700 });
  s.text(PAD, 170, `${data.company} · ${data.location} · ${data.revised}`, {
    size: 9, fill: PAL.muted, ls: 1.5, upper: true,
  });
  s.line(PAD, 188, RIGHT, 188);

  let y = 188;

  /* ---- FIG 001: the record ---- */
  s.sectionLabel(PAD, y + 24, 'FIG 001', 'as a contributor');
  s.line(PAD, y + 34, RIGHT, y + 34);

  let by = y + 60;
  data.record.forEach((r, i) => {
    if (i) by += 26;
    s.text(PAD, by, r.repo, { size: 14, weight: 700 });
    s.text(RIGHT, by, scaleLabel(r), { size: 9, fill: PAL.muted, ls: 1.4, anchor: 'end', upper: true });
    by += 19;
    for (const line of wrapWords(r.note, 11, CONTENT)) {
      s.text(PAD, by, line, { size: 11, fill: PAL.muted });
      by += 16;
    }
    by += 10;
    const baseY = by + 16;
    ticks(s, PAD, baseY, r.total, r.merged, {});
    s.text(RIGHT, baseY - 3, countLabel(r), {
      size: 9, fill: PAL.muted, ls: 1.4, anchor: 'end', upper: true,
    });
    by = baseY + 8;
  });

  y = by + 20;

  /* ---- FIG 002: what the merges contained ---- */
  s.sectionLabel(PAD, y, 'FIG 002', 'what landed');
  s.line(PAD, y + 10, RIGHT, y + 10);

  const colW = CONTENT / 2 + 20;
  data.landed.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = PAD + col * colW;
    const iy = y + 40 + row * 26;
    s.line(x, iy - 4, x + 12, iy - 4, { stroke: PAL.blue, w: 2 });
    s.text(x + 20, iy, item, { size: 11, fill: PAL.ink });
  });

  y += 40 + Math.ceil(data.landed.length / 2) * 26;

  /* ---- FIG 003: elsewhere ---- */
  y += 30;
  s.sectionLabel(PAD, y, 'FIG 003', 'elsewhere');
  s.line(PAD, y + 10, RIGHT, y + 10);

  let cy = y + 40;
  for (const c of data.credentials) {
    s.text(PAD, cy, c.label, { size: 14, weight: 700 });
    s.text(RIGHT, cy, c.url, { size: 11, fill: PAL.muted, anchor: 'end' });
    cy += 22;
  }
  y = cy + 14;

  /* ---- footer ---- */
  s.line(PAD, y, RIGHT, y);
  s.text(PAD, y + 18, 'STACK', { size: 8.5, weight: 700, fill: PAL.blue, ls: 1.5 });
  s.text(PAD + 46, y + 18, data.tooling.join(' · '), { size: 8.5, fill: PAL.muted, ls: 0.5 });
  s.text(RIGHT, y + 18, data.revised, { size: 8.5, fill: PAL.muted, ls: 1.4, anchor: 'end', upper: true });

  s.h = y + 18 + 32;
}

/* ------------------------------------------------------------------ */
/*  mobile                                                             */
/* ------------------------------------------------------------------ */

function mobile(data, s) {
  const W = 380;
  const PAD = 22;
  const RIGHT = W - PAD;
  const CONTENT = RIGHT - PAD;

  s.w = W;

  s.line(PAD, 20, RIGHT, 20, { stroke: PAL.blue, w: 1.2 });
  s.text(PAD, 34, 'FIG 000 / PROFILE', { size: 7, weight: 700, fill: PAL.blue, ls: 1.2 });
  s.text(RIGHT, 34, 'MaYangle', { size: 7, fill: PAL.muted, ls: 1, anchor: 'end' });

  s.text(PAD, 74, data.name, { size: 30, weight: 700, fill: PAL.blue, ls: 1.6 });
  let y = 94;
  for (const line of wrapWords(data.role, 12, CONTENT)) {
    s.text(PAD, y, line, { size: 12, weight: 700 });
    y += 16;
  }
  y += 2;
  for (const line of wrapWords(`${data.company} · ${data.location} · ${data.revised}`, 7.5, CONTENT)) {
    s.text(PAD, y, line, { size: 7.5, fill: PAL.muted, ls: 1.1, upper: true });
    y += 11;
  }
  y += 8;
  s.line(PAD, y, RIGHT, y);

  /* FIG 001 */
  y += 20;
  s.sectionLabel(PAD, y, 'FIG 001', 'as a contributor', 8);
  s.line(PAD, y + 9, RIGHT, y + 9);

  let by = y + 32;
  data.record.forEach((r, i) => {
    if (i) by += 20;
    for (const line of wrapWords(r.repo, 9.5, CONTENT)) {
      s.text(PAD, by, line, { size: 9.5, weight: 700 });
      by += 13;
    }
    by += 2;
    for (const line of wrapWords(r.note, 8.5, CONTENT)) {
      s.text(PAD, by, line, { size: 8.5, fill: PAL.muted });
      by += 12;
    }
    by += 7;
    const baseY = by + 13;
    ticks(s, PAD, baseY, r.total, r.merged, { w: 7, h: 13, gap: 6 });
    s.text(PAD, baseY + 15, `${scaleLabel(r)} · ${countLabel(r)}`, {
      size: 7.5, fill: PAL.muted, ls: 1.1, upper: true,
    });
    by = baseY + 15;
  });

  y = by + 4;

  /* FIG 002 */
  y += 22;
  s.sectionLabel(PAD, y, 'FIG 002', 'what landed', 8);
  s.line(PAD, y + 9, RIGHT, y + 9);

  data.landed.forEach((item, i) => {
    const iy = y + 30 + i * 18;
    s.line(PAD, iy - 3, PAD + 10, iy - 3, { stroke: PAL.blue, w: 1.8 });
    s.text(PAD + 17, iy, item, { size: 8.5, fill: PAL.ink });
  });

  y += 30 + data.landed.length * 18;

  /* FIG 003 */
  y += 20;
  s.sectionLabel(PAD, y, 'FIG 003', 'elsewhere', 8);
  s.line(PAD, y + 9, RIGHT, y + 9);
  let cy = y + 30;
  for (const c of data.credentials) {
    s.text(PAD, cy, c.label, { size: 10, weight: 700 });
    s.text(RIGHT, cy, c.url, { size: 8, fill: PAL.muted, anchor: 'end' });
    cy += 16;
  }
  y = cy + 10;

  /* footer */
  s.line(PAD, y, RIGHT, y);
  s.text(PAD, y + 15, 'STACK', { size: 7.5, weight: 700, fill: PAL.blue, ls: 1.2 });
  const half = Math.ceil(data.tooling.length / 2);
  const stackLines = [
    data.tooling.slice(0, half).join(' · '),
    data.tooling.slice(half).join(' · '),
  ].filter(Boolean);
  let ty = y + 27;
  for (const line of stackLines) {
    s.text(PAD, ty, line, { size: 7.5, fill: PAL.muted });
    ty += 11;
  }
  s.text(PAD, ty + 6, data.revised, { size: 7.5, fill: PAL.muted, ls: 1.2, upper: true });

  s.h = ty + 6 + 18;
}

export function renderSheet(data) {
  const d = new Svg(920);
  desktop(data, d);
  const m = new Svg(380);
  mobile(data, m);
  return { desktop: d.render(), mobile: m.render() };
}
