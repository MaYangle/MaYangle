/**
 * Renders the profile sheet as a standalone SVG.
 * Beige paper only: the sheet is a printed datasheet, not a theme.
 */

const PAL = {
  paper: '#f5f3ec',
  grid: '#e2ded1',
  ink: '#15171c',
  muted: '#6e7280',
  rule: '#c9c4b4',
  blue: '#2440c4',
  accent: '#b8321f',
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
  const CONTENT = RIGHT - PAD;

  s.w = W;

  /* header */
  s.text(PAD, 84, data.name, { size: 48, weight: 700, ls: 1 });
  s.text(PAD, 110, data.role, { size: 15 });
  s.text(RIGHT, 52, data.location, { size: 10.5, fill: PAL.muted, ls: 1.4, anchor: 'end', upper: true });
  s.text(RIGHT, 72, `FIG 001–00${data.figCount} / PROFILE`, { size: 10.5, weight: 700, ls: 1.4, anchor: 'end', upper: true });
  s.text(RIGHT, 92, data.revised, { size: 10.5, fill: PAL.muted, ls: 1.4, anchor: 'end', upper: true });
  s.line(PAD, 134, RIGHT, 134);

  let y = 134;

  /* ---- FIG 001 ---- */
  const labelX = PAD;
  const figTitle = (cy, no, lines) => {
    s.text(labelX, cy, no, { size: 11, weight: 700, fill: PAL.blue, ls: 1.2 });
    lines.forEach((l, i) => s.text(labelX, cy + 18 + i * 16, l, { size: 12, weight: 700, ls: 0.6 }));
  };

  y += 26;
  figTitle(y, 'FIG 001', ['MATCHED-ARM', 'COMPARISON']);

  const plotTop = y + 36;
  const nameX = PAD + 140;
  const nameW = 236;
  const trackX = nameX + nameW;
  const trackW = 328;
  const valueX = RIGHT;
  const rowH = 37;

  const arms = data.arms;
  const extremes = arms.flatMap((a) => [a.mean - a.sd, a.mean + a.sd]);
  const step = niceStep(Math.max(...extremes) - Math.min(...extremes));
  const lo = Math.floor(Math.min(...extremes) / step) * step;
  const hi = Math.ceil(Math.max(...extremes) / step) * step;
  const xOf = (v) => trackX + ((v - lo) / (hi - lo)) * trackW;

  const best = Math.min(...arms.map((a) => a.mean));

  arms.forEach((a, i) => {
    const cy = plotTop + 18 + i * rowH;
    const col = a.candidate ? PAL.accent : PAL.muted;
    const op = a.candidate ? 1 : 0.55;

    s.line(nameX, cy, nameX + 13, cy, { stroke: col, w: 2, opacity: op });
    s.text(nameX + 22, cy + 4, a.name, { size: 12.5, weight: a.candidate ? 700 : 400 });

    s.line(xOf(a.mean - a.sd), cy, xOf(a.mean + a.sd), cy, { stroke: col, opacity: op });
    for (const v of [a.mean - a.sd, a.mean + a.sd]) {
      s.line(xOf(v), cy - 5.5, xOf(v), cy + 5.5, { stroke: col, opacity: op });
    }
    s.circle(xOf(a.mean), cy, 4, col);

    s.text(valueX, cy + 4, `${fmt(a.mean)} ± ${fmt(a.sd)}`, {
      size: 11.5, anchor: 'end',
      fill: a.candidate ? PAL.accent : PAL.ink,
      weight: a.candidate ? 700 : 400,
    });
  });

  const axisY = plotTop + arms.length * rowH + 4;

  // reference line at the best control, behind nothing else
  s.line(xOf(best), plotTop, xOf(best), axisY, { stroke: PAL.muted, dash: '3 3', opacity: 0.45 });

  s.line(trackX, axisY, trackX + trackW, axisY);
  for (let v = lo; v <= hi + 1e-12; v += step) {
    const x = xOf(v);
    s.line(x, axisY, x, axisY + 5);
    s.text(x, axisY + 20, v.toFixed(3), { size: 10, fill: PAL.muted, anchor: 'middle' });
  }
  s.text(valueX, axisY + 20, 'MAE ↓', { size: 10, fill: PAL.muted, anchor: 'end', ls: 1 });

  y = axisY + 44;
  const capW = 650;
  const lines = wrapWords(data.caption, 11, capW);
  lines.forEach((line, i) => s.text(nameX, y + i * 18, line, { size: 11, fill: PAL.muted }));

  // the gate verdict continues the sentence rather than starting a new line
  const lastY = y + (lines.length - 1) * 18;
  const lastLen = lines[lines.length - 1].length;
  const noteX = nameX + lastLen * ch(11) + 6;
  const noteW = data.captionNote.length * ch(11);
  if (noteX + noteW <= RIGHT) {
    s.text(noteX - 2, lastY, data.captionNote, { size: 11, fill: PAL.accent, weight: 700 });
  } else {
    s.text(nameX, lastY + 18, data.captionNote, { size: 11, fill: PAL.accent, weight: 700 });
  }
  y = lastY + 6;

  /* ---- FIG 002 ---- */
  y += 34;
  figTitle(y, 'FIG 002', ['FUSION', 'PATHWAY']);

  const boxTop = y + 36;
  const boxH = 86;
  const gap = 24;
  const boxW = (CONTENT - 3 * gap) / 4;
  const nodes = data.pipeline;

  nodes.forEach((n, i) => {
    const x = PAD + i * (boxW + gap);
    const hi_ = n.highlight;
    s.rect(x, boxTop, boxW, boxH, { stroke: hi_ ? PAL.blue : PAL.rule });
    s.text(x + 11, boxTop + 20, n.label, { size: 9.5, fill: PAL.muted, ls: 1.2, upper: true });
    n.body.forEach((b, j) => {
      s.text(x + 11, boxTop + 42 + j * 16, b, { size: 12, fill: hi_ ? PAL.blue : PAL.ink });
    });
    if (i < nodes.length - 1) {
      const ax = x + boxW + gap / 2;
      s.text(ax, boxTop + boxH / 2 + 4, '→', { size: 12, fill: PAL.muted, anchor: 'middle' });
    }
  });

  y = boxTop + boxH + 18;
  s.text(nameX, y, data.pipelineNote, { size: 10.5, fill: PAL.muted, ls: 0.6, upper: true });
  s.text(valueX, y, data.params, { size: 10.5, anchor: 'end', ls: 0.6, upper: true });

  /* ---- FIG 003 ---- */
  y += 34;
  figTitle(y, 'FIG 003', ['UPSTREAM', 'CONTRIBUTIONS']);

  y += 36;
  let first = true;
  for (const c of data.contributions) {
    if (!first) { s.line(nameX, y - 12, RIGHT, y - 12, { stroke: PAL.rule }); }
    first = false;

    s.text(nameX, y, c.repo, { size: 13.5, weight: 700 });
    s.text(RIGHT, y + 2, c.count, { size: 20, weight: 700, anchor: 'end' });
    s.text(RIGHT, y + 20, c.countLabel, { size: 8.5, fill: PAL.muted, ls: 1.3, anchor: 'end', upper: true });

    let dy = y + 20;
    for (const line of wrapWords(c.detail, 11, 600)) {
      s.text(nameX, dy, line, { size: 11, fill: PAL.muted });
      dy += 17;
    }
    y = dy + 14;
  }

  /* ---- FIG 004 ---- */
  y += 20;
  figTitle(y, 'FIG 004', ['TOOLING']);

  y += 38;
  let cx = nameX;
  for (const t of data.tooling) {
    const w = t.length * ch(11) + 16;
    if (cx + w > RIGHT) { cx = nameX; y += 30; }
    s.rect(cx, y - 13, w, 24, { stroke: PAL.rule });
    s.text(cx + 8, y + 3, t, { size: 11, ls: 0.5 });
    cx += w + 6;
  }

  /* ---- footer ---- */
  y += 46;
  s.line(PAD, y, RIGHT, y);
  s.text(PAD, y + 18, data.footerLeft, { size: 9.5, fill: PAL.muted, ls: 1.2, upper: true });
  s.text(RIGHT, y + 18, data.footerRight, { size: 9.5, fill: PAL.muted, ls: 1.2, anchor: 'end', upper: true });

  s.h = y + 18 + 34;
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

  s.text(PAD, 50, data.name, { size: 30, weight: 700, ls: 0.6 });
  let y = 70;
  for (const line of wrapWords(data.role, 11.5, CONTENT)) {
    s.text(PAD, y, line, { size: 11.5 });
    y += 16;
  }
  s.text(PAD, y + 4, `${data.location} · ${data.revised}`, { size: 8.5, fill: PAL.muted, ls: 1.2, upper: true });
  y += 18;
  s.line(PAD, y, RIGHT, y);

  /* FIG 001 */
  y += 20;
  s.text(PAD, y, 'FIG 001', { size: 9, weight: 700, fill: PAL.blue, ls: 1.2 });
  y += 15;
  s.text(PAD, y, 'MATCHED-ARM COMPARISON', { size: 10, weight: 700, ls: 0.5 });

  const arms = data.arms;
  const extremes = arms.flatMap((a) => [a.mean - a.sd, a.mean + a.sd]);
  const step = niceStep(Math.max(...extremes) - Math.min(...extremes));
  const lo = Math.floor(Math.min(...extremes) / step) * step;
  const hi = Math.ceil(Math.max(...extremes) / step) * step;
  const xOf = (v) => PAD + ((v - lo) / (hi - lo)) * CONTENT;
  const best = Math.min(...arms.map((a) => a.mean));

  y += 12;
  arms.forEach((a) => {
    const col = a.candidate ? PAL.accent : PAL.muted;
    const op = a.candidate ? 1 : 0.55;
    s.text(PAD, y + 10, a.name, { size: 10.5, weight: a.candidate ? 700 : 400 });
    s.text(RIGHT, y + 10, `${a.mean.toFixed(4)} ± ${a.sd.toFixed(4)}`, {
      size: 9.5, anchor: 'end',
      fill: a.candidate ? PAL.accent : PAL.muted,
      weight: a.candidate ? 700 : 400,
    });
    const cy = y + 24;
    s.line(PAD, cy, RIGHT, cy, { stroke: PAL.rule, opacity: 0.5 });
    s.line(xOf(best), y + 12, xOf(best), cy + 6, { stroke: PAL.muted, dash: '2 3', opacity: 0.45 });
    s.line(xOf(a.mean - a.sd), cy, xOf(a.mean + a.sd), cy, { stroke: col, opacity: op });
    for (const v of [a.mean - a.sd, a.mean + a.sd]) {
      s.line(xOf(v), cy - 4.5, xOf(v), cy + 4.5, { stroke: col, opacity: op });
    }
    s.circle(xOf(a.mean), cy, 3.5, col);
    y += 34;
  });

  const axisY = y + 4;
  s.line(PAD, axisY, RIGHT, axisY);
  for (let v = lo; v <= hi + 1e-12; v += step) {
    const x = xOf(v);
    s.line(x, axisY, x, axisY + 4);
    s.text(x, axisY + 17, v.toFixed(3), { size: 8.5, fill: PAL.muted, anchor: 'middle' });
  }

  y = axisY + 32;
  const mLines = wrapWords(data.captionShort, 9, CONTENT);
  mLines.forEach((line, i) => s.text(PAD, y + i * 15, line, { size: 9, fill: PAL.muted }));
  const mLastY = y + (mLines.length - 1) * 15;
  const mNoteX = PAD + mLines[mLines.length - 1].length * ch(9) + 5;
  const mNoteW = data.captionNote.length * ch(9);
  if (mNoteX + mNoteW <= RIGHT) {
    s.text(mNoteX, mLastY, data.captionNote, { size: 9, fill: PAL.accent, weight: 700 });
  } else {
    s.text(PAD, mLastY + 15, data.captionNote, { size: 9, fill: PAL.accent, weight: 700 });
  }
  y = mLastY + 24;

  /* FIG 002 */
  y += 22;
  s.text(PAD, y, 'FIG 002', { size: 9, weight: 700, fill: PAL.blue, ls: 1.2 });
  y += 15;
  s.text(PAD, y, 'FUSION PATHWAY', { size: 10, weight: 700, ls: 0.5 });
  y += 12;

  data.pipeline.forEach((n, i) => {
    const h = 30;
    s.rect(PAD, y, CONTENT, h, { stroke: n.highlight ? PAL.blue : PAL.rule });
    s.text(PAD + 9, y + 19, n.label, { size: 8, fill: PAL.muted, ls: 1.1, upper: true });
    s.text(RIGHT - 9, y + 19, n.body.join(' · '), {
      size: 9.5, anchor: 'end', fill: n.highlight ? PAL.blue : PAL.ink,
    });
    y += h;
    if (i < data.pipeline.length - 1) {
      s.text(W / 2, y + 10, '↓', { size: 9, fill: PAL.muted, anchor: 'middle' });
      y += 14;
    }
  });

  y += 16;
  s.text(PAD, y, data.params, { size: 8, fill: PAL.muted, ls: 1.1, upper: true });
  y += 16;

  /* FIG 003 */
  y += 22;
  s.text(PAD, y, 'FIG 003', { size: 9, weight: 700, fill: PAL.blue, ls: 1.2 });
  y += 15;
  s.text(PAD, y, 'UPSTREAM CONTRIBUTIONS', { size: 10, weight: 700, ls: 0.5 });
  y += 12;

  for (const c of data.contributions) {
    s.text(PAD, y + 10, c.repo, { size: 9.5, weight: 700 });
    let dy = y + 24;
    for (const line of wrapWords(c.detail, 9, CONTENT)) {
      s.text(PAD, dy, line, { size: 9, fill: PAL.muted });
      dy += 14;
    }
    s.text(PAD, dy + 2, `${c.count} ${c.countLabel}`, { size: 8, weight: 700, ls: 1.1, upper: true });
    y = dy + 16;
  }

  /* FIG 004 */
  y += 18;
  s.text(PAD, y, 'FIG 004', { size: 9, weight: 700, fill: PAL.blue, ls: 1.2 });
  y += 15;
  s.text(PAD, y, 'TOOLING', { size: 10, weight: 700, ls: 0.5 });

  y += 18;
  let cx = PAD;
  for (const t of data.tooling) {
    const w = t.length * ch(9) + 12;
    if (cx + w > RIGHT) { cx = PAD; y += 24; }
    s.rect(cx, y - 11, w, 20, { stroke: PAL.rule });
    s.text(cx + 6, y + 2, t, { size: 9, ls: 0.3 });
    cx += w + 5;
  }

  y += 34;
  s.line(PAD, y, RIGHT, y);
  s.text(PAD, y + 14, data.footerLeft, { size: 6.8, fill: PAL.muted, ls: 1, upper: true });
  s.text(PAD, y + 26, data.footerRight, { size: 6.8, fill: PAL.muted, ls: 1, upper: true });

  s.h = y + 26 + 20;
}

export function renderSheet(data) {
  const d = new Svg(920);
  desktop(data, d);
  const m = new Svg(380);
  mobile(data, m);
  return { desktop: d.render(), mobile: m.render() };
}
