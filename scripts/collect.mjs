/**
 * Collects everything the sheet prints.
 *
 * GitHub's `is:merged` only counts pull requests closed by the merge button.
 * When a maintainer rebuilds a contribution in their own pull request and
 * credits it, the contributor's PR reads as "closed, not merged" while the
 * work sits on the default branch. That distinction is recorded explicitly
 * below, because it cannot be derived without reading prose.
 */

const API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
const USER = 'MaYangle';

const UPSTREAM = [
  {
    repo: 'rohitg00/ai-engineering-from-scratch',
    note: '12-locale README translations · i18n audit · lesson quizzes · research links',
    // #531 was closed and rebuilt by the maintainer as #558, which credits it:
    // "builds on Yangle Ma's original complete translations in #531".
    absorbed: 1,
    absorbedIn: 558,
  },
  {
    repo: '19376357/Bilingual-Multimodal-Sentiment-Analysis',
    note: 'training and inference reliability · bilingual docs · licensing',
    absorbed: 0,
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
  const open = await gh(q('+is:open'));
  return {
    total: total.total_count,
    merged: merged ? merged.total_count : 0,
    open: open ? open.total_count : 0,
  };
}

/** the sentence that sits under the ticks */
function outcomeLabel(r) {
  if (r.absorbed > 0 && r.absorbedIn) {
    return `${r.absorbed} landed via #${r.absorbedIn} · ${r.open} open`;
  }
  return `${r.merged} of ${r.total} merged`;
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
    record.push({
      repo: u.repo,
      note: u.note,
      absorbed: u.absorbed || 0,
      absorbedIn: u.absorbedIn || null,
      ...counts,
      ...meta,
    });
  }
  if (!record.length) throw new Error('no upstream pull requests found; refusing to render an empty record');

  // the largest project leads; the rest follow in descending order
  record.sort((a, b) => (b.stars ?? -1) - (a.stars ?? -1));
  for (const r of record) r.label = outcomeLabel(r);

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
