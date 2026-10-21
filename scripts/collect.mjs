/**
 * Collects everything the sheet prints.
 *
 * One source: GitHub's search API, for the pull requests this account has
 * landed in repositories it does not own, plus each project's own scale.
 */

const API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const USER = 'MaYangle';

const UPSTREAM = [
  {
    repo: '19376357/Bilingual-Multimodal-Sentiment-Analysis',
    note: 'training and inference reliability · bilingual docs · licensing',
  },
  {
    repo: 'rohitg00/ai-engineering-from-scratch',
    note: 'lesson quizzes · README i18n audit · research links',
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
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${res.statusText}`);
  return res.json();
}

/** stars and forks of the project itself, not of the contribution */
async function repoMeta(repo) {
  const r = await gh(`/repos/${repo}`);
  if (!r) return { stars: null, forks: null };
  return { stars: r.stargazers_count, forks: r.forks_count };
}

/** returns null when the repository is gone, so one deletion cannot break the sheet */
async function prCounts(repo) {
  const q = (extra) =>
    `/search/issues?q=author:${USER}+repo:${repo}+type:pr${extra}&per_page=1`;
  const total = await gh(q(''));
  if (total === null) return null;
  const merged = await gh(q('+is:merged'));
  return { total: total.total_count, merged: merged ? merged.total_count : 0 };
}

export async function collect() {
  if (!TOKEN) throw new Error('GITHUB_TOKEN is required');

  const record = [];
  for (const u of UPSTREAM) {
    const counts = await prCounts(u.repo);
    if (!counts || counts.total === 0) {
      console.warn(`skip ${u.repo}: no pull requests or repository unavailable`);
      continue;
    }
    const meta = await repoMeta(u.repo);
    record.push({ repo: u.repo, note: u.note, ...counts, ...meta });
  }
  if (!record.length) throw new Error('no upstream pull requests found; refusing to render an empty record');

  const now = new Date();
  const revised = `${now.getUTCDate()} ${MONTHS[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  return {
    name: 'YANGLE MA',
    role: 'Applied AI/ML · multimodal learning · industrial AI',
    company: 'Mettler Toledo',
    location: 'Jiangsu, CN',
    revised,

    record,
    tooling: ['Python', 'PyTorch', 'Hugging Face', 'WavLM', 'MacBERT', 'DINOv2', 'Whisper', 'pytest'],

    /**
     * Kaggle serves a JavaScript shell to non-browser clients, so its rank and
     * medals cannot be read at build time without scraping something brittle.
     * The identity is stated and the profile link makes it checkable.
     */
    credentials: [
      { role: 'Data Scientist', tier: 'Kaggle Expert', url: 'kaggle.com/yanglema' },
    ],
  };
}
