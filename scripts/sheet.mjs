/**
 * Renders the profile sheet as a standalone SVG.
 * Beige paper only: the sheet is a printed datasheet, not a theme.
 *
 * Palette and type scale follow the measured conventions of a printed
 * technical plate: one electric blue carrying all emphasis, a neutral warm
 * grey for everything secondary, and a single coral reserved for the arm
 * that failed its gate.
 */

const PAL = {
  paper: '#fafaf6',
  grid: '#edede7',
  ink: '#1a1a1a',
  muted: '#747472',
  rule: '#c8c8c4',
  blue: '#3553ff',
  blueTint: '#e9ecfd',
  accent: '#e8402a',
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

/** greedy wrap by character budget derived from real advance width */
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
      size = 11, fill = PAL.ink, weight = 400, anchor = 'start',
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
      `<defs><pattern id="bp" width="26" height="26" patternUnits="userSpaceOnUse">`,
      `<path d="M26 0H0V26" fill="none" stroke="${PAL.grid}" stroke-width="1"/>`,
      `</pattern></defs>`,
      `<rect width="${this.w}" height="${h}" fill="${PAL.paper}"/>`,
      `<rect width="${this.w}" height="${h}" fill="url(#bp)"/>`,
      ...this.parts,
      `</svg>`,
    ].join('');
  }
}

/** nice tick step covering span with roughly 4 intervals */
function niceStep(span) {
  const raw = span / 4;
  const steps = [0.0005, 0.001, 0.002, 0.0025, 0.005, 0.01, 0.02, 0.05];
  for (const s of steps) if (s >= raw) return s;
  return steps[steps.length - 1];
}

const fmt = (v, dp = 6) => v.toFixed(dp);

/* ------------------------------------------------------------------ */
/*  desktop                                                            */
/* ------------------------------------------------------------------ */

function desktop(data, s) {
  const W = 920;
  const PAD = 44;
  const RIGHT = W - PAD;
  const BAND = 40;

  s.w = W;

  /* masthead band */
  s.rect(0, 0, W, BAND, { fill: PAL.blue, stroke: 'none' });
  s.text(PAD, 25, `FIG 001–00${data.figCount} / PROFILE SHEET`, {
    size: 10, fill: '#ffffff', weight: 700, ls: 1.7, upper: true,
  });
  s.text(RIGHT, 25, 'github.com/MaYangle', {
    size: 10, fill: '#ffffff', ls: 1.7, anchor: 'end',
  });

  /* identity */
  s.text(PAD, BAND + 66, data.name, { size: 60, weight: 700, ls: 1.2 });
  s.text(PAD, BAND + 94, data.role, { size: 17, weight: 700 });
  s.text(PAD, BAND + 116, `${data.company} · ${data.location} · ${data.revised}`, {
    size: 10.5, fill: PAL.muted, ls: 1.6, upper: true,
  });
  s.line(PAD, BAND + 134, RIGHT, BAND + 134);

  let y = BAND + 134;

  const labelX = PAD;
  const labelW = 132;
  const nameX = labelX + labelW + 22;
  const valueW = 136;
  const valueX = RIGHT;

  /** section header: blue figure number, bold title, hairline beneath */
  const head = (cy, no, lines) => {
    s.text(labelX, cy, no, { size: 12, weight: 700, fill: PAL.blue, ls: 1.3 });
    lines.forEach((l, i) => s.text(labelX, cy + 21 + i * 18, l, { size: 14, weight: 700, ls: 0.3 }));
    const underlineY = cy + 21 + (lines.length - 1) * 18 + 11;
    s.line(PAD, underlineY, RIGHT, underlineY, { stroke: PAL.rule });
  };

  /* ---- FIG 001 ---- */
  y += 30;
  head(y, 'FIG 001', ['MATCHED-ARM', 'COMPARISON']);

  const plotTop = y + 62;
  const nameW = 236;
  const trackX = nameX + nameW;
  const trackW = valueX - valueW - trackX;
  const rowH = 38;

  const arms = data.arms;
  const extremes = arms.flatMap((a) => [a.mean - a.sd, a.mean + a.sd]);
  const step = niceStep(Math.max(...extremes) - Math.min(...extremes));
  const lo = Math.floor(Math.min(...extremes) / step) * step;
  const hi = Math.ceil(Math.max(...extremes) / step) * step;
  const xOf = (v) => trackX + ((v - lo) / (hi - lo)) * trackW;
  const best = Math.min(...arms.map((a) => a.mean));

  arms.forEach((a, i) => {
    const cy = plotTop + 17 + i * rowH;
    const col = a.candidate ? PAL.accent : PAL.muted;
    const op = a.candidate ? 1 : 0.6;

    if (a.candidate) {
      s.rect(nameX - 8, cy - 16, valueX - nameX + 8, 32, { fill: '#fdeeeb', stroke: 'none' });
    }

    s.line(nameX, cy, nameX + 14, cy, { stroke: col, w: 2.5, opacity: op });
    s.text(nameX + 23, cy + 4.5, a.name, {
      size: 13, weight: a.candidate ? 700 : 400,
      fill: a.candidate ? PAL.accent : PAL.ink,
    });

    s.line(xOf(a.mean - a.sd), cy, xOf(a.mean + a.sd), cy, { stroke: col, w: 1.5, opacity: op });
    for (const v of [a.mean - a.sd, a.mean + a.sd]) {
      s.line(xOf(v), cy - 6, xOf(v), cy + 6, { stroke: col, w: 1.5, opacity: op });
    }
    s.circle(xOf(a.mean), cy, 4.5, col);

    s.text(valueX, cy + 4.5, `${fmt(a.mean)} ± ${fmt(a.sd)}`, {
      size: 11.5, anchor: 'end',
      fill: a.candidate ? PAL.accent : PAL.ink,
      weight: a.candidate ? 700 : 400,
    });
  });

  const axisY = plotTop + arms.length * rowH + 6;

  s.line(xOf(best), plotTop - 2, xOf(best), axisY, { stroke: PAL.blue, dash: '3 3', opacity: 0.55 });

  s.line(trackX, axisY, trackX + trackW, axisY, { stroke: PAL.ink });
  for (let v = lo; v <= hi + 1e-12; v += step) {
    const x = xOf(v);
    s.line(x, axisY, x, axisY + 5, { stroke: PAL.ink });
    s.text(x, axisY + 21, v.toFixed(3), { size: 10.5, fill: PAL.muted, anchor: 'middle' });
  }
  s.text(valueX, axisY + 21, 'MAE ↓', {
    size: 10.5, fill: PAL.blue, weight: 700, anchor: 'end', ls: 1.2,
  });

  y = axisY + 46;
  const capW = 640;
  const lines = wrapWords(data.caption, 11, capW);
  lines.forEach((line, i) => s.text(nameX, y + i * 18, line, { size: 11, fill: PAL.muted }));

  const lastY = y + (lines.length - 1) * 18;
  const lastEnd = nameX + lines[lines.length - 1].length * ch(11);
  const noteW = data.captionNote.length * ch(11);
  if (lastEnd + noteW + 24 <= RIGHT) {
    // verdict sits on the right margin, like a stamp on the drawing
    s.text(RIGHT, lastY, data.captionNote, { size: 11, fill: PAL.accent, weight: 700, anchor: 'end', ls: 0.6 });
  } else {
    s.text(nameX, lastY + 18, data.captionNote, { size: 11, fill: PAL.accent, weight: 700, ls: 0.6 });
  }
  y = lastY + 8;

  /* ---- FIG 002 ---- */
  y += 34;
  head(y, 'FIG 002', ['FUSION', 'PATHWAY']);

  const boxTop = y + 62;
  const boxH = 88;
  const gap = 24;
  const boxW = (RIGHT - PAD - 3 * gap) / 4;
  const nodes = data.pipeline;

  nodes.forEach((n, i) => {
    const x = PAD + i * (boxW + gap);
    s.rect(x, boxTop, boxW, boxH, {
      stroke: n.highlight ? PAL.blue : PAL.rule,
      fill: n.highlight ? PAL.blueTint : 'none',
      sw: n.highlight ? 1.5 : 1,
    });
    s.text(x + 12, boxTop + 22, n.label, {
      size: 9.5, fill: n.highlight ? PAL.blue : PAL.muted, weight: n.highlight ? 700 : 400,
      ls: 1.3, upper: true,
    });
    n.body.forEach((b, j) => {
      s.text(x + 12, boxTop + 46 + j * 17, b, {
        size: 12.5, fill: n.highlight ? PAL.blue : PAL.ink,
        weight: n.highlight ? 700 : 400,
      });
    });
    if (i < nodes.length - 1) {
      s.text(x + boxW + gap / 2, boxTop + boxH / 2 + 5, '→', {
        size: 13, fill: PAL.muted, anchor: 'middle',
      });
    }
  });

  y = boxTop + boxH + 20;
  s.text(nameX, y, data.pipelineNote, { size: 10.5, fill: PAL.muted, ls: 0.6, upper: true });
  s.text(valueX, y, data.params, { size: 10.5, fill: PAL.blue, weight: 700, anchor: 'end', ls: 0.6, upper: true });

  /* ---- FIG 003 ---- */
  y += 34;
  head(y, 'FIG 003', ['UPSTREAM', 'CONTRIBUTIONS']);

  y += 62;
  let first = true;
  for (const c of data.contributions) {
    if (!first) s.line(nameX, y - 16, RIGHT, y - 16, { stroke: PAL.rule });
    first = false;

    s.text(nameX, y, c.repo, { size: 14, weight: 700 });
    s.text(RIGHT, y + 4, c.count, { size: 34, weight: 700, anchor: 'end', fill: PAL.blue });
    s.text(RIGHT, y + 22, c.countLabel, { size: 9, fill: PAL.muted, ls: 1.4, anchor: 'end', upper: true });

    let dy = y + 22;
    for (const line of wrapWords(c.detail, 11, 600)) {
      s.text(nameX, dy, line, { size: 11, fill: PAL.muted });
      dy += 17;
    }
    y = dy + 18;
  }

  /* ---- FIG 004 ---- */
  y += 22;
  head(y, 'FIG 004', ['TOOLING']);
  y += 48;

  let cx = nameX;
  for (const t of data.tooling) {
    const w = t.length * ch(12) + 20;
    if (cx + w > RIGHT) { cx = nameX; y += 34; }
    s.rect(cx, y - 15, w, 28, { stroke: PAL.blue });
    s.text(cx + 10, y + 4.5, t, { size: 12, fill: PAL.blue, ls: 0.4 });
    cx += w + 8;
  }

  /* ---- footer ---- */
  y += 52;
  s.line(PAD, y, RIGHT, y);
  s.text(PAD, y + 19, data.footerLeft, { size: 9.5, fill: PAL.muted, ls: 1.3, upper: true });
  s.text(RIGHT, y + 19, data.footerRight, { size: 9.5, fill: PAL.muted, ls: 1.3, anchor: 'end', upper: true });

  s.h = y + 19 + 32;
}

/* ------------------------------------------------------------------ */
/*  mobile                                                             */
/* ------------------------------------------------------------------ */

function mobile(data, s) {
  const W = 380;
  const PAD = 22;
  const RIGHT = W - PAD;
  const CONTENT = RIGHT - PAD;
  const BAND = 30;

  s.w = W;

  s.rect(0, 0, W, BAND, { fill: PAL.blue, stroke: 'none' });
  s.text(PAD, 19, `FIG 001–00${data.figCount} / PROFILE`, {
    size: 7.5, fill: '#ffffff', weight: 700, ls: 1.3, upper: true,
  });
  s.text(RIGHT, 19, 'MaYangle', { size: 7.5, fill: '#ffffff', ls: 1.3, anchor: 'end' });

  s.text(PAD, BAND + 34, data.name, { size: 34, weight: 700, ls: 0.6 });
  let y = BAND + 56;
  for (const line of wrapWords(data.role, 12, CONTENT)) {
    s.text(PAD, y, line, { size: 12, weight: 700 });
    y += 16;
  }
  for (const line of wrapWords(`${data.company} · ${data.location} · ${data.revised}`, 8, CONTENT)) {
    s.text(PAD, y + 2, line, { size: 8, fill: PAL.muted, ls: 1.2, upper: true });
    y += 12;
  }
  y += 10;
  s.line(PAD, y, RIGHT, y);

  const head = (cy, no, title) => {
    s.text(PAD, cy, no, { size: 9.5, weight: 700, fill: PAL.blue, ls: 1.2 });
    s.text(PAD, cy + 16, title, { size: 11, weight: 700, ls: 0.3 });
    s.line(PAD, cy + 25, RIGHT, cy + 25, { stroke: PAL.rule });
  };

  /* FIG 001 */
  y += 24;
  head(y, 'FIG 001', 'MATCHED-ARM COMPARISON');

  const arms = data.arms;
  const extremes = arms.flatMap((a) => [a.mean - a.sd, a.mean + a.sd]);
  const step = niceStep(Math.max(...extremes) - Math.min(...extremes));
  const lo = Math.floor(Math.min(...extremes) / step) * step;
  const hi = Math.ceil(Math.max(...extremes) / step) * step;
  const xOf = (v) => PAD + ((v - lo) / (hi - lo)) * CONTENT;
  const best = Math.min(...arms.map((a) => a.mean));

  y += 38;
  arms.forEach((a) => {
    const col = a.candidate ? PAL.accent : PAL.muted;
    const op = a.candidate ? 1 : 0.6;
    if (a.candidate) {
      s.rect(PAD - 5, y - 4, CONTENT + 10, 32, { fill: '#fdeeeb', stroke: 'none' });
    }
    s.text(PAD, y + 10, a.name, {
      size: 10.5, weight: a.candidate ? 700 : 400,
      fill: a.candidate ? PAL.accent : PAL.ink,
    });
    s.text(RIGHT, y + 10, `${a.mean.toFixed(4)} ± ${a.sd.toFixed(4)}`, {
      size: 9.5, anchor: 'end',
      fill: a.candidate ? PAL.accent : PAL.muted,
      weight: a.candidate ? 700 : 400,
    });
    const cy = y + 24;
    s.line(PAD, cy, RIGHT, cy, { stroke: PAL.rule, opacity: 0.55 });
    s.line(xOf(best), y + 12, xOf(best), cy + 7, { stroke: PAL.blue, dash: '2 3', opacity: 0.55 });
    s.line(xOf(a.mean - a.sd), cy, xOf(a.mean + a.sd), cy, { stroke: col, w: 1.4, opacity: op });
    for (const v of [a.mean - a.sd, a.mean + a.sd]) {
      s.line(xOf(v), cy - 5, xOf(v), cy + 5, { stroke: col, w: 1.4, opacity: op });
    }
    s.circle(xOf(a.mean), cy, 3.5, col);
    y += 34;
  });

  const axisY = y + 6;
  s.line(PAD, axisY, RIGHT, axisY, { stroke: PAL.ink });
  for (let v = lo; v <= hi + 1e-12; v += step) {
    const x = xOf(v);
    s.line(x, axisY, x, axisY + 4, { stroke: PAL.ink });
    s.text(x, axisY + 17, v.toFixed(3), { size: 8.5, fill: PAL.muted, anchor: 'middle' });
  }

  y = axisY + 34;
  const mLines = wrapWords(data.captionShort, 9, CONTENT);
  mLines.forEach((line, i) => s.text(PAD, y + i * 15, line, { size: 9, fill: PAL.muted }));
  const mLastY = y + (mLines.length - 1) * 15;
  const mNoteX = PAD + mLines[mLines.length - 1].length * ch(9) - 2;
  if (mNoteX + data.captionNote.length * ch(9) <= RIGHT) {
    s.text(mNoteX, mLastY, data.captionNote, { size: 9, fill: PAL.accent, weight: 700 });
  } else {
    s.text(PAD, mLastY + 15, data.captionNote, { size: 9, fill: PAL.accent, weight: 700 });
  }
  y = mLastY + 10;

  /* FIG 002 */
  y += 24;
  head(y, 'FIG 002', 'FUSION PATHWAY');
  y += 38;

  data.pipeline.forEach((n, i) => {
    const h = 32;
    s.rect(PAD, y, CONTENT, h, {
      stroke: n.highlight ? PAL.blue : PAL.rule,
      fill: n.highlight ? PAL.blueTint : 'none',
      sw: n.highlight ? 1.5 : 1,
    });
    s.text(PAD + 9, y + 20, n.label, {
      size: 8, fill: n.highlight ? PAL.blue : PAL.muted, weight: n.highlight ? 700 : 400,
      ls: 1.1, upper: true,
    });
    s.text(RIGHT - 9, y + 20, n.body.join(' · '), {
      size: 9.5, anchor: 'end', fill: n.highlight ? PAL.blue : PAL.ink,
      weight: n.highlight ? 700 : 400,
    });
    y += h;
    if (i < data.pipeline.length - 1) {
      s.text(W / 2, y + 11, '↓', { size: 9, fill: PAL.muted, anchor: 'middle' });
      y += 15;
    }
  });

  y += 18;
  s.text(PAD, y, data.params, { size: 8, fill: PAL.blue, weight: 700, ls: 1.1, upper: true });
  y += 12;

  /* FIG 003 */
  y += 24;
  head(y, 'FIG 003', 'UPSTREAM CONTRIBUTIONS');
  y += 38;

  for (const c of data.contributions) {
    s.text(PAD, y + 10, c.repo, { size: 10, weight: 700 });
    s.text(RIGHT, y + 10, c.count, { size: 18, weight: 700, anchor: 'end', fill: PAL.blue });
    let dy = y + 26;
    for (const line of wrapWords(c.detail, 9, CONTENT)) {
      s.text(PAD, dy, line, { size: 9, fill: PAL.muted });
      dy += 14;
    }
    s.text(PAD, dy + 2, `${c.count} ${c.countLabel}`, { size: 8.5, fill: PAL.blue, weight: 700, ls: 1.1, upper: true });
    y = dy + 18;
  }

  /* FIG 004 */
  y += 16;
  head(y, 'FIG 004', 'TOOLING');
  y += 34;

  let cx = PAD;
  for (const t of data.tooling) {
    const w = t.length * ch(9) + 14;
    if (cx + w > RIGHT) { cx = PAD; y += 26; }
    s.rect(cx, y - 12, w, 22, { stroke: PAL.blue });
    s.text(cx + 7, y + 2, t, { size: 9, fill: PAL.blue, ls: 0.3 });
    cx += w + 5;
  }

  y += 40;
  s.line(PAD, y, RIGHT, y);
  s.text(PAD, y + 14, data.footerLeft, { size: 6.8, fill: PAL.muted, ls: 1, upper: true });
  s.text(PAD, y + 26, data.footerRight, { size: 6.8, fill: PAL.muted, ls: 1, upper: true });

  s.h = y + 26 + 18;
}

export function renderSheet(data) {
  const d = new Svg(920);
  desktop(data, d);
  const m = new Svg(380);
  mobile(data, m);
  return { desktop: d.render(), mobile: m.render() };
}
