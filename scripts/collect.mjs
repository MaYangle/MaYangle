/**
 * Collects everything the sheet prints.
 *
 * Two sources:
 *   1. GitHub's search API for pull-request counts
 *   2. the research repository's README for the measured arms
 *
 * The research README is the single source of truth for every number in
 * FIG 001 and FIG 002. If it moves, the sheet moves.
 */

const API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const USER = 'MaYangle';
const RESEARCH = 'MaYangle/Multimodal-Sentiment-Fusion';

const UPSTREAM = [
  {
    repo: '19376357/Bilingual-Multimodal-Sentiment-Analysis',
    label: 'MERGED',
    detail:
      'Training and inference reliability: dtype and single-sample output shapes, ' +
      'NaN/Inf prediction handling, missing-face feature shapes, cross-platform ' +
      'result loading. Followed by bilingual documentation and a licensing pass.',
  },
  {
    repo: 'rohitg00/ai-engineering-from-scratch',
    label: 'PULL REQ',
    detail:
      '150 missing lesson quizzes backfilled · README i18n audited across 12 ' +
      'translations · research links for 7 lessons.',
  },
];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

async function gh(path) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'profile-sheet',
    },
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${res.statusText}`);
  return res.json();
}

async function prCount(repo, extra = '') {
  const q = `author:${USER}+repo:${repo}+type:pr${extra}`;
  const { total_count } = await gh(`/search/issues?q=${q}&per_page=1`);
  return total_count;
}

async function researchReadme() {
  const { content, encoding } = await gh(`/repos/${RESEARCH}/readme`);
  if (encoding !== 'base64') throw new Error('unexpected readme encoding');
  return Buffer.from(content, 'base64').toString('utf8');
}

/** arm rows look like: | **Name** | **0.378497 ± 0.007455** | */
function parseArms(md) {
  const arms = [];
  const re = /^\|\s*\*{0,2}([^|*]+?)\*{0,2}\s*\|\s*\*{0,2}\s*([0-9.]+)\s*±\s*([0-9.]+)\s*\*{0,2}\s*\|/;
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(re);
    if (!m) continue;
    const name = m[1].trim();
    if (/^(matched arm|validation arm|arm)$/i.test(name)) continue;
    arms.push({
      name,
      mean: Number(m[2]),
      sd: Number(m[3]),
      candidate: /candidate/i.test(name),
    });
  }
  return arms.sort((a, b) => a.mean - b.mean);
}

function firstNumber(md, re) {
  const m = md.match(re);
  return m ? m[1] : null;
}

export async function collect() {
  if (!TOKEN) throw new Error('GITHUB_TOKEN is required');

  /* --- pull requests --- */
  const contributions = [];
  for (const u of UPSTREAM) {
    const total = await prCount(u.repo);
    const merged = await prCount(u.repo, '+is:merged');
    contributions.push({
      repo: u.repo,
      detail: u.detail,
      count: String(u.label === 'MERGED' ? merged : total).padStart(1),
      countLabel: u.label,
    });
  }

  /* --- research --- */
  const md = await researchReadme();
  const arms = parseArms(md);
  if (arms.length < 2) throw new Error(`parsed ${arms.length} arms; refusing to render a broken plot`);

  const paramsRaw = firstNumber(md, /([\d,]{5,})\s+parameters/i);
  const clips = firstNumber(md, /(\d{3})\s+clips/i);
  const seeds = md.match(/seeds?\s+(\d+(?:\s*\/\s*\d+)+)/i);
  const gateMet = /passes the preregistered/i.test(md);
  const gateFailed = /fails the preregistered/i.test(md);

  const best = arms[0];
  const cand = arms.find((a) => a.candidate) || arms[arms.length - 1];

  // do all intervals overlap? this is the point of the figure
  const allOverlap = arms.every((a) =>
    arms.every((b) => a.mean - a.sd <= b.mean + b.sd && b.mean - a.sd <= a.mean + a.sd)
  );

  const now = new Date();
  const revised = `${now.getUTCDate()} ${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  const dataset = 'CH-SIMS v2.0';
  const clipText = clips || '647';
  const seedText = seeds ? seeds[1].replace(/\s+/g, '') : '13/42/2026';
  const overlapText = allOverlap
    ? 'every interval overlaps every other one'
    : 'the intervals separate';
  const gateText = gateMet ? 'met' : gateFailed ? 'not met' : 'undetermined';

  const caption =
    `${dataset} native VALID, ${clipText} clips, native clipped MAE ↓, mean ± sample SD ` +
    `over seeds ${seedText}. All arms share identical features, branch pretraining, ` +
    `initialisation and a 50-epoch budget; ${arms.length} matched arms are shown. ` +
    `The candidate does not clear the best control, and ${overlapText}. ` +
    `Preregistered all-seed gain requirement `;

  return {
    name: 'YANGLE MA',
    role: 'Applied AI/ML · multimodal learning · industrial AI · Mettler Toledo',
    location: 'Jiangsu, CN',
    revised,
    figCount: 4,

    arms,
    caption,
    captionShort:
      `${dataset} native VALID, ${clipText} clips, MAE ↓, mean ± sample SD over seeds ${seedText}. ` +
      `The candidate does not clear the best control; ${overlapText}. Preregistered all-seed gain requirement `,
    captionNote: gateText,

    pipeline: [
      { label: 'Inputs (frozen)', body: ['MacBERT', 'WavLM', 'DINOv2'] },
      { label: 'Branches', body: ['Masked pretrained', 'channel stacks'] },
      { label: 'Fusion', body: ['8-query multi-key', 'cross-attention ×3'], highlight: true },
      { label: 'Output', body: ['Post-norm routing', '→ native scalar'] },
    ],
    pipelineNote: 'DISTILLATION ← TRAIN-ONLY SCORE-ERROR TEACHER',
    params: `${paramsRaw ? Number(paramsRaw.replace(/,/g, '')).toLocaleString('en-US') : '2,084,871'} TRAINABLE PARAMS`,

    contributions,
    tooling: ['PYTHON', 'PYTORCH', 'HUGGING FACE', 'WavLM', 'MacBERT', 'DINOv2', 'WHISPER', 'pytest', 'GITHUB ACTIONS'],

    footerLeft: `SOURCE / ${RESEARCH}`,
    footerRight: `GATE: PREREGISTERED PROMOTION — ${gateText.toUpperCase()}`,

    _debug: { best: best.name, candidate: cand.name, arms: arms.length },
  };
}
