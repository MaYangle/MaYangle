/**
 * Renders the profile sheet as a standalone SVG.
 *
 * A dark metrics panel rather than a printed plate: the projects' own star and
 * fork counts are the largest things on the page, because that is the number a
 * reader evaluates before deciding whether to look further. Contributions sit
 * underneath them at a fraction of the size.
 *
 * Type pairing does the work a style sheet would otherwise do: sans for the
 * display numerals, mono for anything whose width the layout depends on.
 */

const PAL = {
  bg: '#0a0c10',
  card: '#11141a',
  border: '#1f242c',
  ink: '#e8ebf0',
  muted: '#79818f',
  gold: '#f0b429',
  teal: '#38d9c4',
};

const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace";

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** monospace advance, used only where wrapping must be predictable */
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
      ls = 0, upper = false, font = MONO,
    } = o;
    const body = upper ? String(str).toUpperCase() : String(str);
    const attrs = [
      `x="${x}"`, `y="${y}"`,
      `font-family="${font}"`, `font-size="${size}"`,
      `fill="${fill}"`,
      weight !== 400 ? `font-weight="${weight}"` : '',
      anchor !== 'start' ? `text-anchor="${anchor}"` : '',
      ls ? `letter-spacing="${ls}"` : '',
    ].filter(Boolean).join(' ');
    return this.add(`<text ${attrs}>${esc(body)}</text>`);
  }

  line(x1, y1, x2, y2, o = {}) {
    const { stroke = PAL.border, w = 1 } = o;
    return this.add(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}"/>`
    );
  }

  rect(x, y, w, h, o = {}) {
    const { stroke = PAL.border, fill = PAL.card, sw = 1, rx = 10 } = o;
    return this.add(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ` +
      `stroke="${stroke}" stroke-width="${sw}"/>`
    );
  }

  render() {
    const h = Math.round(this.h);
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${h}" `,
      `viewBox="0 0 ${this.w} ${h}" role="img">`,
      `<rect width="${this.w}" height="${h}" fill="${PAL.bg}"/>`,
      ...this.parts,
      `</svg>`,
    ].join('');
  }
}

const nf = (n) => (n == null ? '—' : n.toLocaleString('en-US'));

/* ------------------------------------------------------------------ */
/*  desktop                                                            */
/* ------------------------------------------------------------------ */

function desktop(data, s) {
  const W = 920;
  const PAD = 56;
  const RIGHT = W - PAD;
  const CONTENT = RIGHT - PAD;

  s.w = W;

  s.text(PAD, 82, data.name, { size: 44, weight: 700, font: SANS, ls: -0.5 });
  s.text(PAD, 110, data.role, { size: 15, fill: PAL.muted, font: SANS });
  s.text(PAD, 132, `${data.company} · ${data.location}`, {
    size: 10, fill: PAL.muted, ls: 1.6, upper: true,
  });

  let y = 176;
  s.text(PAD, y, 'contributor to', { size: 10, fill: PAL.muted, ls: 2, upper: true });

  /* ---- project cards: the numerals lead ---- */
  const gap = 28;
  const cardW = (CONTENT - gap) / 2;
  const cardH = 196;
  const cardY = y + 18;

  data.record.forEach((r, i) => {
    const x = PAD + i * (cardW + gap);
    s.rect(x, cardY, cardW, cardH);

    const inner = x + 22;
    const innerRight = x + cardW - 22;

    const nameLines = wrapWords(r.repo, 11.5, cardW - 44);
    nameLines.slice(0, 2).forEach((line, j) => {
      s.text(inner, cardY + 30 + j * 17, line, { size: 11.5, weight: 700, fill: PAL.ink });
    });

    // stars: the largest element on the sheet
    s.text(inner, cardY + 108, nf(r.stars), { size: 48, weight: 700, font: SANS, fill: PAL.gold, ls: -1 });
    s.text(inner, cardY + 126, 'stars', { size: 9, fill: PAL.muted, ls: 1.6, upper: true });

    // forks: same line, one step down in weight
    s.text(innerRight, cardY + 108, nf(r.forks), {
      size: 30, weight: 700, font: SANS, fill: PAL.teal, anchor: 'end', ls: -0.5,
    });
    s.text(innerRight, cardY + 126, 'forks', { size: 9, fill: PAL.muted, ls: 1.6, anchor: 'end', upper: true });

    s.line(inner, cardY + 146, innerRight, cardY + 146, { stroke: PAL.border });
    s.text(inner, cardY + 172, `${r.merged} of ${r.total} pull requests merged`, {
      size: 10, fill: PAL.muted,
    });
  });

  y = cardY + cardH;

  /* ---- Kaggle: the role leads, the platform qualifies it ---- */
  y += 44;
  s.text(PAD, y, 'elsewhere', { size: 10, fill: PAL.muted, ls: 2, upper: true });

  const kY = y + 18;
  const kH = 108;
  s.rect(PAD, kY, CONTENT, kH);

  for (const c of data.credentials) {
    s.text(PAD + 24, kY + 52, c.role, { size: 32, weight: 700, font: SANS, ls: -0.5 });
    s.text(PAD + 24, kY + 76, c.label, { size: 10, fill: PAL.gold, ls: 1.6, upper: true });
    s.text(PAD + CONTENT - 24, kY + 52, c.url, { size: 12, fill: PAL.muted, anchor: 'end' });
  }

  y = kY + kH + 44;
  s.text(PAD, y, data.tooling.join(' · '), { size: 10, fill: PAL.muted, ls: 0.4 });
  s.text(RIGHT, y, data.revised, { size: 10, fill: PAL.muted, ls: 1.4, anchor: 'end', upper: true });

  s.h = y + 40;
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

  s.text(PAD, 52, data.name, { size: 28, weight: 700, font: SANS, ls: -0.4 });
  let y = 74;
  for (const line of wrapWords(data.role, 10, CONTENT)) {
    s.text(PAD, y, line, { size: 10, fill: PAL.muted, font: SANS });
    y += 14;
  }
  y += 2;
  s.text(PAD, y, `${data.company} · ${data.location}`, {
    size: 7.5, fill: PAL.muted, ls: 1.2, upper: true,
  });

  y += 26;
  s.text(PAD, y, 'contributor to', { size: 7.5, fill: PAL.muted, ls: 1.4, upper: true });

  y += 12;
  data.record.forEach((r) => {
    const cardH = 150;
    s.rect(PAD, y, CONTENT, cardH);

    const inner = PAD + 18;
    const innerRight = RIGHT - 18;

    const nameLines = wrapWords(r.repo, 10, CONTENT - 36);
    nameLines.slice(0, 2).forEach((line, j) => {
      s.text(inner, y + 26 + j * 14, line, { size: 10, weight: 700 });
    });

    s.text(inner, y + 84, nf(r.stars), { size: 36, weight: 700, font: SANS, fill: PAL.gold, ls: -0.8 });
    s.text(inner, y + 99, 'stars', { size: 7, fill: PAL.muted, ls: 1.2, upper: true });

    s.text(innerRight, y + 84, nf(r.forks), {
      size: 24, weight: 700, font: SANS, fill: PAL.teal, anchor: 'end', ls: -0.4,
    });
    s.text(innerRight, y + 99, 'forks', { size: 7, fill: PAL.muted, ls: 1.2, anchor: 'end', upper: true });

    s.line(inner, y + 114, innerRight, y + 114, { stroke: PAL.border });
    s.text(inner, y + 134, `${r.merged} of ${r.total} PRs merged`, { size: 8.5, fill: PAL.muted });

    y += cardH + 12;
  });

  y += 10;
  s.text(PAD, y, 'elsewhere', { size: 7.5, fill: PAL.muted, ls: 1.4, upper: true });

  y += 12;
  for (const c of data.credentials) {
    const kH = 92;
    s.rect(PAD, y, CONTENT, kH);
    s.text(PAD + 18, y + 40, c.role, { size: 22, weight: 700, font: SANS, ls: -0.4 });
    s.text(PAD + 18, y + 58, c.label, { size: 7.5, fill: PAL.gold, ls: 1.2, upper: true });
    s.text(PAD + 18, y + 74, c.url, { size: 8.5, fill: PAL.muted });
    y += kH + 12;
  }

  y += 10;
  const half = Math.ceil(data.tooling.length / 2);
  for (const line of [data.tooling.slice(0, half), data.tooling.slice(half)]) {
    s.text(PAD, y, line.join(' · '), { size: 7.5, fill: PAL.muted });
    y += 12;
  }
  y += 2;
  s.text(PAD, y, data.revised, { size: 7.5, fill: PAL.muted, ls: 1.2, upper: true });

  s.h = y + 26;
}

export function renderSheet(data) {
  const d = new Svg(920);
  desktop(data, d);
  const m = new Svg(380);
  mobile(data, m);
  return { desktop: d.render(), mobile: m.render() };
}
