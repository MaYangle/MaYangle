const API_ROOT = 'https://api.github.com';
const SEARCH_PAGE_SIZE = 100;
const SEARCH_PAGE_LIMIT = 10;

export function createApi({ token = process.env.GITHUB_TOKEN } = {}) {
  return async endpoint => {
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'MaYangle-profile'
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      let response;
      try {
        response = await fetch(`${API_ROOT}/${endpoint}`, { headers, signal: AbortSignal.timeout(20000) });
      } catch (error) {
        if (attempt < 2) continue;
        throw new Error(`GitHub API request failed for ${endpoint.split('?')[0]}: ${error.message}`);
      }
      if (response.ok) return response.json();
      if (response.status >= 500 && attempt < 2) continue;
      const error = new Error(`GitHub API returned ${response.status} for ${endpoint.split('?')[0]}`);
      error.status = response.status;
      throw error;
    }
    throw new Error(`GitHub API request failed for ${endpoint.split('?')[0]}`);
  };
}

function requireString(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid GitHub ${label}`);
  return value;
}

function requireInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) throw new Error(`Invalid GitHub ${label}`);
  return value;
}

function isResponse(value) {
  return value && Array.isArray(value.items) && Number.isInteger(value.total_count) && value.total_count >= 0 && value.incomplete_results === false;
}

function validateSearchResponse(value) {
  if (!isResponse(value)) throw new Error('GitHub returned incomplete or invalid pull request search data');
}

async function searchAll(api, query) {
  const all = [];
  let total = null;
  for (let page = 1; page <= SEARCH_PAGE_LIMIT; page++) {
    const response = await api(`search/issues?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=${SEARCH_PAGE_SIZE}&page=${page}`);
    validateSearchResponse(response);
    if (total === null) total = response.total_count;
    else if (total !== response.total_count) throw new Error('GitHub search count changed during collection');
    if (total > SEARCH_PAGE_SIZE * SEARCH_PAGE_LIMIT) throw new Error('GitHub search exceeds the supported 1000-result limit');
    all.push(...response.items);
    if (all.length > total) throw new Error('GitHub search returned more records than its total');
    if (all.length === total) return { total, items: all };
    if (response.items.length < SEARCH_PAGE_SIZE) break;
  }
  if (all.length !== total) throw new Error('GitHub search exceeds the supported 1000-result limit or returned missing pages');
  return { total, items: all };
}

function parseRepoUrl(url) {
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('Configured project needs a GitHub repository URL'); }
  if (parsed.protocol !== 'https:' || parsed.hostname.toLowerCase() !== 'github.com' || parsed.username || parsed.password) throw new Error('Configured project needs a public GitHub HTTPS URL');
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length !== 2 || !parts.every(part => /^[\w.-]+$/.test(part))) throw new Error('Configured project needs a GitHub owner/repository URL');
  return `${parts[0]}/${parts[1]}`;
}

function validatePrItem(item, username) {
  if (!item || !Number.isInteger(item.number) || item.number < 1) throw new Error('Invalid GitHub pull request search item');
  const repo = item.repository_url?.match(/^https:\/\/api\.github\.com\/repos\/([\w.-]+\/[\w.-]+)$/)?.[1];
  if (!repo || !item.pull_request || !item.pull_request.url) throw new Error('Invalid GitHub pull request repository data');
  if (repo.split('/')[0].toLowerCase() === username.toLowerCase()) throw new Error('GitHub search included a pull request from the profile owner');
  requireString(item.title, 'pull request title');
  requireString(item.html_url, 'pull request URL');
  requireString(item.updated_at, 'pull request update time');
  if (item.html_url !== `https://github.com/${repo}/pull/${item.number}` || item.pull_request.url !== `https://api.github.com/repos/${repo}/pulls/${item.number}`) throw new Error('Unexpected GitHub pull request URL');
  return { repo, number: item.number, title: item.title, url: item.html_url, updatedAt: item.updated_at };
}

async function listPublicProjects(api, username, discovery = {}) {
  const repos = [];
  if (discovery.exclude !== undefined && (!Array.isArray(discovery.exclude) || discovery.exclude.some(item => typeof item !== 'string'))) throw new Error('Project discovery exclude must be an array of repository names');
  const excluded = new Set((discovery.exclude ?? []).map(value => String(value).toLowerCase()));
  for (let page = 1; page <= 20; page++) {
    const batch = await api(`users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&per_page=100&page=${page}`);
    if (!Array.isArray(batch)) throw new Error('Invalid GitHub repository list');
    for (const repo of batch) {
      if (!repo || typeof repo.private !== 'boolean' || typeof repo.fork !== 'boolean' || typeof repo.archived !== 'boolean' || typeof repo.disabled !== 'boolean') throw new Error('Invalid GitHub repository visibility data');
      requireString(repo.full_name, 'repository name');
      requireInteger(repo.size, 'repository size');
      if (repo.full_name.toLowerCase() === `${username}/${username}`.toLowerCase()) continue;
      if (repo.full_name.split('/')[0].toLowerCase() !== username.toLowerCase()) throw new Error('GitHub repository list included a non-owner repository');
      const shortName = repo.full_name.split('/')[1].toLowerCase();
      if (!repo.private && !repo.fork && !repo.archived && !repo.disabled && repo.size > 0 && !excluded.has(shortName) && !excluded.has(repo.full_name.toLowerCase())) {
        requireString(repo.pushed_at, 'repository update time');
        repos.push(repo);
      }
    }
    if (batch.length < 100) return repos;
  }
  throw new Error('GitHub repository pagination exceeded the supported limit');
}

const COVER_PATHS = ['.github/profile-cover.png', '.github/profile-cover.jpg', 'assets/profile-cover.png', 'assets/profile-cover.jpg'];

function isImageBase64(content, extension) {
  if (typeof content !== 'string' || !content.trim()) return false;
  const normalized = content.replace(/\s/g, '');
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(normalized)) return false;
  const bytes = Buffer.from(normalized, 'base64');
  if (bytes.toString('base64').replace(/=+$/, '') !== normalized.replace(/=+$/, '')) return false;
  if (extension === 'png') return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return extension === 'jpg' && bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

async function findCoverPath(api, repo) {
  for (const path of COVER_PATHS) {
    let item;
    try {
      item = await api(`repos/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`);
    } catch (error) {
      if (error?.status === 404) continue;
      throw error;
    }
    if (item?.type === 'file' && item.encoding === 'base64' && isImageBase64(item.content, path.endsWith('.png') ? 'png' : 'jpg')) return path;
  }
  return null;
}

function selectProjectRepos(config, ownedRepos) {
  const selected = new Map();
  for (const project of config.projects ?? []) {
    const repo = parseRepoUrl(project.url);
    const match = ownedRepos.find(item => item.full_name.toLowerCase() === repo.toLowerCase());
    selected.set(repo.toLowerCase(), match ?? { full_name: repo, pushed_at: null, curated: true });
  }
  if (config.discovery?.enabled === true) {
    const discovered = ownedRepos.filter(item => !selected.has(item.full_name.toLowerCase()))
      .sort((a, b) => b.pushed_at.localeCompare(a.pushed_at) || a.full_name.localeCompare(b.full_name));
    for (const repo of discovered) selected.set(repo.full_name.toLowerCase(), repo);
  }
  return [...selected.values()];
}

async function mapLimit(items, limit, mapper) {
  const result = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      result[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return result;
}

export async function collectActivity(config, api) {
  if (!config || !/^[a-z\d-]+$/i.test(config.username ?? '')) throw new Error('Invalid GitHub username');
  if (typeof api !== 'function') throw new Error('GitHub API client is required');
  const username = config.username;
  const baseQuery = `author:${username} is:pr is:public -user:${username}`;
  const queries = {
    merged: `${baseQuery} is:merged`,
    open: `${baseQuery} is:open`,
    closed: `${baseQuery} is:closed -is:merged`
  };
  const [buckets, ownedRepos] = await Promise.all([
    Promise.all(Object.entries(queries).map(async ([status, query]) => [status, await searchAll(api, query)])),
    listPublicProjects(api, username, config.discovery)
  ]);
  const results = Object.fromEntries(buckets);
  const records = new Map();
  const expectedCounts = { merged: results.merged.total, open: results.open.total, closed: results.closed.total };
  for (const status of ['merged', 'open', 'closed']) {
    for (const item of results[status].items) {
      const record = validatePrItem(item, username);
      const key = `${record.repo.toLowerCase()}#${record.number}`;
      if (records.has(key)) throw new Error('GitHub pull request appeared in multiple search results');
      records.set(key, { ...record, searchStatus: status });
    }
  }
  const verified = [];
  for (const record of records.values()) {
    const detail = await api(`repos/${record.repo}/pulls/${record.number}`);
    if (!detail || !['open', 'closed'].includes(detail.state) || typeof detail.merged !== 'boolean') throw new Error(`Invalid GitHub pull request status for ${record.repo}#${record.number}`);
    if (detail.base?.repo?.private === true) throw new Error('Search included a private contribution');
    const status = detail.merged ? 'merged' : detail.state;
    if (status !== record.searchStatus) throw new Error(`GitHub pull request search and current status disagree for ${record.repo}#${record.number}`);
    const eventAt = status === 'merged' ? detail.merged_at : status === 'closed' ? detail.closed_at : detail.updated_at;
    if (status !== 'open' && !eventAt) throw new Error(`Missing GitHub pull request event time for ${record.repo}#${record.number}`);
    verified.push({ repo: record.repo, number: record.number, title: detail.title ?? record.title, url: record.url, status, updatedAt: detail.updated_at ?? record.updatedAt, eventAt: eventAt || record.updatedAt });
  }
  const verifiedCounts = { merged: 0, open: 0, closed: 0 };
  for (const pr of verified) verifiedCounts[pr.status]++;
  if (Object.keys(expectedCounts).some(status => expectedCounts[status] !== verifiedCounts[status])) throw new Error('Verified GitHub pull request counts do not match search totals');
  verified.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.repo.localeCompare(b.repo) || b.number - a.number);

  const byRepo = new Map();
  for (const pr of verified) {
    if (!byRepo.has(pr.repo)) byRepo.set(pr.repo, { repo: pr.repo, url: `https://github.com/${pr.repo}`, merged: 0, open: 0, closed: 0 });
    byRepo.get(pr.repo)[pr.status]++;
  }
  const projectRepos = selectProjectRepos(config, ownedRepos);
  const projects = await mapLimit(projectRepos, 4, async listed => {
    const repo = listed.full_name;
    const [meta, commits] = await Promise.all([
      api(`repos/${repo}`),
      api(`repos/${repo}/commits?per_page=1`)
    ]);
    if (!meta || meta.private !== false || typeof meta.fork !== 'boolean') throw new Error(`Configured project is unavailable or private: ${repo}`);
    requireString(meta.pushed_at, 'project update time');
    requireInteger(meta.stargazers_count, 'project stars');
    requireInteger(meta.forks_count, 'project forks');
    const name = requireString(meta.name, 'project name');
    const description = typeof meta.description === 'string' && meta.description.trim() ? meta.description : 'Public repository.';
    const topics = meta.topics === undefined ? [] : meta.topics;
    if (!Array.isArray(topics) || topics.some(topic => typeof topic !== 'string')) throw new Error(`Invalid GitHub topics for ${repo}`);
    const defaultBranch = requireString(meta.default_branch, 'default branch');
    const pushedAt = meta.pushed_at || listed.pushed_at;
    requireString(pushedAt, 'project update time');
    if (!Array.isArray(commits)) throw new Error(`Invalid latest commit response for ${repo}`);
    let latestCommit = null;
    if (commits.length) {
      const commit = commits[0];
      const sha = requireString(commit.sha, 'commit SHA');
      const message = requireString(commit.commit?.message, 'commit message').split(/\r?\n/, 1)[0];
      const date = commit.commit?.committer?.date || commit.commit?.author?.date;
      requireString(date, 'commit date');
      latestCommit = { sha, url: `https://github.com/${repo}/commit/${sha}`, message, date };
    }
    const coverPath = await findCoverPath(api, repo);
    return { repo, name, description, url: `https://github.com/${repo}`, pushedAt, stars: meta.stargazers_count, forks: meta.forks_count, language: meta.language ?? null, topics, defaultBranch, coverPath, latestCommit };
  });

  return {
    username,
    counts: {
      merged: expectedCounts.merged,
      open: expectedCounts.open,
      closed: expectedCounts.closed,
      mergedRepositories: new Set(verified.filter(pr => pr.status === 'merged').map(pr => pr.repo)).size,
      publicProjects: ownedRepos.length
    },
    queries,
    pullRequests: verified,
    repositories: [...byRepo.values()].sort((a, b) => b.merged - a.merged || (b.open + b.closed) - (a.open + a.closed) || a.repo.localeCompare(b.repo)),
    projects
  };
}
