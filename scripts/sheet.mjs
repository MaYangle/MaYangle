/**
 * Renders the profile sheet as a standalone SVG.
 *
 * Hierarchy comes from scale, not from colour. One number carries the page at
 * roughly fifteen times the size of running text; section labels are smaller
 * than the text they introduce, so they read as labels and never compete.
 * The paper is plain — texture belongs to the type, not to the background.
 */

const PAL = {
  paper: '#fafaf6',
  ink: '#1a1a1a',
  muted: '#747472',
  rule: '#c8c8c4',
  blue: '#3553ff',
  blueTint: '#eef0ff',
  accent: '#e8402a',
  accentTint: '#fdeeeb',
};

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace";

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** advance width of one monospace glyph; measured against Consolas and the
 *  DejaVu fallback that GitHub's SVG renderer ends up using */
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
      ls = 0, opacity = 1, upper = false,
    } = o;
    const body = upper ? String(str).toUpperCase() : String(str);
    const attrs = [
      `x="${x}"`, `y="${y}"`,
      `font-family="${MONO}"`, `font-size="${size}"`,
      `fill="${fill}"`,
      weight !== 400 ? `font-weight="${weight}"` : '',
      anchor !== 'start' ? `text-anchor="${anchor}"` : '',
      ls ? `letter-spacing="${ls}"` : '',
      opacity !== 1 ? `opacity="${opacity}"` : '',
    ].filter(Boolean).join(' ');
    return this.add(`<text ${attrs}>${esc(body)}</text>`);
  }

  /** two-tone label: blue figure number, then an ink title */
  sectionLabel(x, y, no, title, size = 9) {
    this.text(x, y, no, { size, weight: 700, fill: PAL.blue, ls: 1.5 });
    this.text(x + (no.length + 3) * ch(size), y, title, { size, weight: 700, ls: 1.5, upper: true });
  }

  line(x1, y1, x2, y2, o = {}) {
    const { stroke = PAL.rule, w = 1, dash = '', opacity = 1 } = o;
    return this.add(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" ` +
      `stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}` +
      `${opacity !== 1 ? ` opacity="${opacity}"` : ''}/>`
    );
  }

  rect(x, y, w, h, o = {}) {
    const { stroke = PAL.rule, fill = 'none', sw = 1 } = o;
    return this.add(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ` +
      `stroke="${stroke}" stroke-width="${sw}"/>`
    );
  }

  circle(cx, cy, r, fill) {
    return this.add(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`);
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

function niceStep(span) {
  const raw = span / 4;
  const steps = [0.0005, 0.001, 0.002, 0.0025, 0.005, 0.01, 0.02, 0.05];
  for (const s of steps) if (s >= raw) return s;
  return steps[steps.length - 1];
}

function domain(arms) {
  const vals = arms.flatMap((a) => [a.mean - a.sd, a.mean + a.sd]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(max - min, 1e-6);
  const step = niceStep(span);
  const pad = span * 0.04;
  const lo = min - pad;
  const hi = max + pad;
  const ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-12; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  if (ticks.length < 2) ticks.splice(0, ticks.length, lo, (lo + hi) / 2, hi);
  return { lo, hi, step, ticks };
}

/* ------------------------------------------------------------------ */
/*  desktop                                                            */
/* ------------------------------------------------------------------ */

function desktop(data, s) {
  const W = 920;
  const PAD = 44;
  const RIGHT = W - PAD;
  const CONTENT = RIGHT - PAD;

  s.w = W;

  /* masthead: a blue hairline, then micro caps — not a filled bar */
  s.line(PAD, 30, RIGHT, 30, { stroke: PAL.blue, w: 1.5 });
  s.text(PAD, 48, `FIG 000 / PROFILE SHEET`, { size: 9, weight: 700, fill: PAL.blue, ls: 1.8 });
  s.text(RIGHT, 48, 'github.com/MaYangle', { size: 9, fill: PAL.muted, ls: 1.4, anchor: 'end' });

  /* identity */
  s.text(PAD, 116, data.name, { size: 46, weight: 700, fill: PAL.blue, ls: 2.4 });
  s.text(PAD, 148, data.role, { size: 19, weight: 700 });
  s.text(PAD, 170, `${data.company} · ${data.location} · ${data.revised}`, {
    size: 9, fill: PAL.muted, ls: 1.5, upper: true,
  });
  s.line(PAD, 188, RIGHT, 188);

  let y = 188;

  /* ---------------- FIG 001: the one number ---------------- */
  s.sectionLabel(PAD, y + 24, 'FIG 001', 'what the fusion bought');
  s.line(PAD, y + 34, RIGHT, y + 34);
  y += 34;

  const { lo, hi, ticks } = domain(data.arms);
  const xOf = (v) => PAD + ((v - lo) / (hi - lo)) * CONTENT;

  s.text(PAD, y + 30, data.heroLabel, { size: 9, fill: PAL.muted, ls: 1.5, upper: true });
  s.text(PAD, y + 132, data.hero.value, { size: 104, weight: 700, fill: PAL.blue, ls: -1 });
  s.text(PAD, y + 158, data.hero.err, { size: 14, fill: PAL.muted });

  s.text(RIGHT, y + 30, data.control.label, { size: 9, fill: PAL.muted, ls: 1.5, anchor: 'end', upper: true });
  s.text(RIGHT, y + 78, data.control.value, { size: 30, weight: 700, anchor: 'end' });
  s.text(RIGHT, y + 98, data.control.err, { size: 11, fill: PAL.muted, anchor: 'end' });

  s.text(PAD, y + 188, data.verdict, { size: 10.5, weight: 700, fill: PAL.accent, ls: 1.4, upper: true });

  /* whisker strip: five arms drawn on one axis, no table */
  const stripTop = y + 210;
  const gapY = 7;
  const axisY = stripTop + data.arms.length * gapY + 10;

  for (const v of ticks) {
    s.line(xOf(v), stripTop, xOf(v), axisY, { stroke: PAL.rule, opacity: 0.28 });
  }

  const ordered = [...data.arms.filter((a) => a.candidate), ...data.arms.filter((a) => !a.candidate)];
  ordered.forEach((a, i) => {
    const cy = stripTop + 3 + i * gapY;
    const col = a.candidate ? PAL.accent : PAL.muted;
    const op = a.candidate ? 1 : 0.45;
    const w = a.candidate ? 2 : 1.2;
    s.line(xOf(a.mean - a.sd), cy, xOf(a.mean + a.sd), cy, { stroke: col, w, opacity: op });
    for (const v of [a.mean - a.sd, a.mean + a.sd]) {
      s.line(xOf(v), cy - 3, xOf(v), cy + 3, { stroke: col, w, opacity: op });
    }
    s.circle(xOf(a.mean), cy, a.candidate ? 3.4 : 2.2, col);
  });

  s.line(PAD, axisY, RIGHT, axisY, { stroke: PAL.ink });
  for (const v of ticks) {
    s.line(xOf(v), axisY, xOf(v), axisY + 4, { stroke: PAL.ink });
    s.text(xOf(v), axisY + 16, v.toFixed(3), { size: 8.5, fill: PAL.muted, anchor: 'middle' });
  }

  s.text(PAD, axisY + 40, data.armsNote, { size: 8.5, fill: PAL.muted, ls: 1.2, upper: true });
  y = axisY + 40;

  /* ---------------- two-column band ---------------- */
  y += 40;
  const colW = (CONTENT - 40) / 2;
  const c1 = PAD;
  const c2 = PAD + colW + 40;

  s.sectionLabel(c1, y, 'FIG 002', 'pathway');
  s.line(c1, y + 10, c1 + colW, y + 10);
  s.sectionLabel(c2, y, 'FIG 003', 'upstream');
  s.line(c2, y + 10, RIGHT, y + 10);

  const bodyTop = y + 26;
  s.line(c2 - 20, y - 8, c2 - 20, bodyTop + 148, { stroke: PAL.rule });

  /* pathway, vertically because the column is narrow */
  let fy = bodyTop + 14;
  s.text(c1, fy, data.flow.inputs, { size: 13, weight: 700 });
  s.text(c1, fy + 16, data.flow.inputsSub, { size: 9, fill: PAL.muted, ls: 0.8, upper: true });
  fy += 40;
  s.text(c1 + colW / 2, fy, '↓', { size: 11, fill: PAL.muted, anchor: 'middle' });
  fy += 20;
  s.rect(c1, fy - 18, colW, 34, { stroke: PAL.blue, fill: PAL.blueTint, sw: 1.2 });
  s.text(c1 + 12, fy + 4, data.flow.fusion, { size: 13, weight: 700, fill: PAL.blue });
  fy += 44;
  s.text(c1 + colW / 2, fy, '↓', { size: 11, fill: PAL.muted, anchor: 'middle' });
  fy += 20;
  s.text(c1, fy, data.flow.output, { size: 13, weight: 700 });
  s.text(c1, fy + 16, data.params, { size: 9, fill: PAL.muted, ls: 0.8, upper: true });

  /* upstream counts */
  let uy = bodyTop + 26;
  for (const c of data.contributions) {
    s.text(c2, uy, c.count, { size: 40, weight: 700, fill: PAL.blue });
    s.text(c2 + c.count.length * ch(40) + 8, uy - 2, c.countLabel, {
      size: 8.5, fill: PAL.muted, ls: 1.3, upper: true,
    });
    s.text(c2, uy + 18, c.repo, { size: 11, weight: 700 });
    s.text(c2, uy + 33, c.tags, { size: 8.5, fill: PAL.muted, ls: 0.9, upper: true });
    uy += 66;
  }

  /* ---------------- footer ---------------- */
  y = bodyTop + 176;
  s.line(PAD, y, RIGHT, y);
  s.text(PAD, y + 18, 'STACK', { size: 8.5, weight: 700, fill: PAL.blue, ls: 1.5 });
  s.text(PAD + 46, y + 18, data.tooling.join(' · '), { size: 8.5, fill: PAL.muted, ls: 0.5 });
  s.text(RIGHT, y + 18, `GATE: ${data.gate}`, {
    size: 8.5, weight: 700, fill: PAL.accent, ls: 1.3, anchor: 'end', upper: true,
  });

  s.h = y + 18 + 30;
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
  let y = 96;
  for (const line of wrapWords(data.role, 12, CONTENT)) {
    s.text(PAD, y, line, { size: 12, weight: 700 });
    y += 16;
  }
  for (const line of wrapWords(`${data.company} · ${data.location} · ${data.revised}`, 7.5, CONTENT)) {
    s.text(PAD, y + 1, line, { size: 7.5, fill: PAL.muted, ls: 1.1, upper: true });
    y += 11;
  }
  y += 9;
  s.line(PAD, y, RIGHT, y);

  /* FIG 001 */
  y += 20;
  s.sectionLabel(PAD, y, 'FIG 001', 'what the fusion bought', 8);
  s.line(PAD, y + 9, RIGHT, y + 9);

  const { lo, hi, ticks } = domain(data.arms);
  const xOf = (v) => PAD + ((v - lo) / (hi - lo)) * CONTENT;

  s.text(PAD, y + 34, data.heroLabel, { size: 7.5, fill: PAL.muted, ls: 1.2, upper: true });
  s.text(PAD, y + 100, data.hero.value, { size: 62, weight: 700, fill: PAL.blue, ls: -0.5 });
  s.text(PAD, y + 114, data.hero.err, { size: 10, fill: PAL.muted });

  s.text(RIGHT, y + 34, data.control.label, { size: 7.5, fill: PAL.muted, ls: 1.2, anchor: 'end', upper: true });
  s.text(RIGHT, y + 60, data.control.value, { size: 21, weight: 700, anchor: 'end' });
  s.text(RIGHT, y + 74, data.control.err, { size: 8, fill: PAL.muted, anchor: 'end' });

  s.text(PAD, y + 134, data.verdict, { size: 8.5, weight: 700, fill: PAL.accent, ls: 1.1, upper: true });

  const stripTop = y + 158;
  const gapY = 6;
  const axisY = stripTop + data.arms.length * gapY + 9;

  for (const v of ticks) {
    s.line(xOf(v), stripTop, xOf(v), axisY, { stroke: PAL.rule, opacity: 0.28 });
  }

  const ordered = [...data.arms.filter((a) => a.candidate), ...data.arms.filter((a) => !a.candidate)];
  ordered.forEach((a, i) => {
    const cy = stripTop + 3 + i * gapY;
    const col = a.candidate ? PAL.accent : PAL.muted;
    const op = a.candidate ? 1 : 0.45;
    const w = a.candidate ? 1.8 : 1.1;
    s.line(xOf(a.mean - a.sd), cy, xOf(a.mean + a.sd), cy, { stroke: col, w, opacity: op });
    for (const v of [a.mean - a.sd, a.mean + a.sd]) {
      s.line(xOf(v), cy - 2.5, xOf(v), cy + 2.5, { stroke: col, w, opacity: op });
    }
    s.circle(xOf(a.mean), cy, a.candidate ? 3 : 2, col);
  });

  s.line(PAD, axisY, RIGHT, axisY, { stroke: PAL.ink });
  for (const v of ticks) {
    s.line(xOf(v), axisY, xOf(v), axisY + 3.5, { stroke: PAL.ink });
    s.text(xOf(v), axisY + 14, v.toFixed(3), { size: 7.5, fill: PAL.muted, anchor: 'middle' });
  }

  const noteLines = wrapWords(data.armsNote, 7.5, CONTENT);
  noteLines.forEach((line, i) =>
    s.text(PAD, axisY + 34 + i * 11, line, { size: 7.5, fill: PAL.muted, ls: 0.8, upper: true })
  );
  y = axisY + 34 + (noteLines.length - 1) * 11;

  /* FIG 002 */
  y += 26;
  s.sectionLabel(PAD, y, 'FIG 002', 'pathway', 8);
  s.line(PAD, y + 9, RIGHT, y + 9);

  let fy = y + 30;
  s.text(PAD, fy, data.flow.inputs, { size: 11, weight: 700 });
  s.text(PAD, fy + 13, data.flow.inputsSub, { size: 7.5, fill: PAL.muted, ls: 0.6, upper: true });
  fy += 30;
  s.text(PAD, fy, '↓', { size: 9, fill: PAL.muted });
  fy += 16;
  s.rect(PAD, fy - 14, CONTENT, 28, { stroke: PAL.blue, fill: PAL.blueTint, sw: 1.1 });
  s.text(PAD + 10, fy + 4, data.flow.fusion, { size: 10.5, weight: 700, fill: PAL.blue });
  fy += 34;
  s.text(PAD, fy, '↓', { size: 9, fill: PAL.muted });
  fy += 16;
  s.text(PAD, fy, data.flow.output, { size: 11, weight: 700 });
  s.text(PAD, fy + 13, data.params, { size: 7.5, fill: PAL.muted, ls: 0.6, upper: true });
  y = fy + 13;

  /* FIG 003 */
  y += 26;
  s.sectionLabel(PAD, y, 'FIG 003', 'upstream', 8);
  s.line(PAD, y + 9, RIGHT, y + 9);

  let uy = y + 32;
  for (const c of data.contributions) {
    s.text(PAD, uy, c.count, { size: 24, weight: 700, fill: PAL.blue });
    s.text(PAD + c.count.length * ch(24) + 6, uy - 1, c.countLabel, {
      size: 7.5, fill: PAL.muted, ls: 1, upper: true,
    });
    s.text(PAD, uy + 15, c.repo, { size: 9.5, weight: 700 });
    s.text(PAD, uy + 27, c.tags, { size: 7.5, fill: PAL.muted, ls: 0.7, upper: true });
    uy += 52;
  }
  y = uy - 14;

  /* footer */
  y += 22;
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
  s.text(PAD, ty + 5, `GATE: ${data.gate}`, {
    size: 7.5, weight: 700, fill: PAL.accent, ls: 1, upper: true,
  });

  s.h = ty + 5 + 18;
}

export function renderSheet(data) {
  const d = new Svg(920);
  desktop(data, d);
  const m = new Svg(380);
  mobile(data, m);
  return { desktop: d.render(), mobile: m.render() };
}
