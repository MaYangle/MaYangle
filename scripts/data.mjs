import { execFileSync } from 'node:child_process';

export function validateConfig(config) {
  if (!/^[a-z\d-]+$/i.test(config.username ?? '')) throw new Error('Invalid GitHub username');
  if (!config.name || !config.tagline || !config.bio) throw new Error('Name, tagline and bio are required');
  if (!Number.isInteger(config.projects?.maxVisible) || config.projects.maxVisible < 1 || config.projects.maxVisible > 8) throw new Error('maxVisible must be between 1 and 8');
  for (const item of config.projects.include ?? []) {
    if (!/^[\w.-]+\/[\w.-]+$/.test(item.repo) || item.repo.split('/')[0].toLowerCase() !== config.username.toLowerCase()) throw new Error('Included projects must belong to the configured user');
  }
  for (const url of Object.values(config.links ?? {})) {
    if (!/^(https:\/\/|mailto:)/.test(url)) throw new Error('Contact links must use HTTPS or mailto');
  }
}

export function createApi({ token = process.env.GITHUB_TOKEN, useGh = false } = {}) {
  return async endpoint => {
    if (useGh) {
      return JSON.parse(execFileSync('gh', ['api', endpoint], {encoding:'utf8', timeout:30000, maxBuffer:12 * 1024 * 1024, windowsHide:true}));
    }
    const headers = {Accept:'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28', 'User-Agent':'MaYangle-profile'};
    if (token) headers.Authorization = `Bearer ${token}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetch(`https://api.github.com/${endpoint}`, {headers, signal:AbortSignal.timeout(20000)});
      if (response.ok) return response.json();
      if (response.status >= 500 && attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      throw new Error(`GitHub API returned ${response.status} for ${endpoint.split('?')[0]}; keeping the previous profile`);
    }
  };
}

export function selectProjects(repos, config) {
  const owner = config.username.toLowerCase();
  const included = new Map((config.projects.include ?? []).map(item => [item.repo.toLowerCase(), item]));
  const excluded = new Set((config.projects.exclude ?? []).map(name => name.toLowerCase()));
  return repos.filter(repo => {
    const name = repo.full_name.toLowerCase();
    return name.split('/')[0] === owner && name !== `${owner}/${owner}` && !repo.private && !repo.archived && !repo.disabled && repo.size > 0 && !excluded.has(name) && (included.has(name) || (config.projects.discover && !repo.fork));
  }).sort((a, b) => {
    const pa = included.has(a.full_name.toLowerCase());
    const pb = included.has(b.full_name.toLowerCase());
    return Number(pb) - Number(pa) || String(b.pushed_at).localeCompare(String(a.pushed_at)) || a.full_name.localeCompare(b.full_name);
  }).map(repo => {
    const custom = included.get(repo.full_name.toLowerCase());
    return {
      repo:repo.full_name,
      name:custom?.name || repo.name.replaceAll('-', ' '),
      description:custom?.description || repo.description || (repo.language ? `${repo.language} project` : 'Public project'),
      url:`https://github.com/${repo.full_name}`,
      stars:repo.stargazers_count,
      language:repo.language || null,
      fork:repo.fork,
      role:custom?.role || (repo.fork ? 'Working fork' : 'Independent project'),
      stack:custom?.stack || (repo.language ? [repo.language] : []),
      inputs:custom?.inputs || [],
      output:custom?.output || ''
    };
  });
}

function issueRepo(issue) {
  const match = /^https:\/\/api\.github\.com\/repos\/([\w.-]+\/[\w.-]+)$/.exec(issue.repository_url);
  if (!match) throw new Error('Unexpected repository URL in GitHub search');
  return match[1];
}

export function normalizePullRequests(merged, open) {
  const byUrl = new Map();
  for (const [response, status] of [[open, 'open'], [merged, 'merged']]) {
    for (const item of response.items) {
      const actualStatus = item.pull_request?.merged_at ? 'merged' : status;
      if (actualStatus === 'open' && item.state !== 'open') continue;
      byUrl.set(item.html_url, {
        repo:issueRepo(item), number:item.number, title:item.title,
        url:item.html_url, status:actualStatus, updatedAt:item.updated_at
      });
    }
  }
  return [...byUrl.values()];
}

export function selectSpotlight(pulls, repositoryMap, config) {
  const eligible = pulls.filter(pr => ['merged','open'].includes(pr.status) && !repositoryMap.get(pr.repo)?.private);
  eligible.sort((a,b) => repositoryMap.get(b.repo).stargazers_count - repositoryMap.get(a.repo).stargazers_count || Number(b.status === 'merged') - Number(a.status === 'merged') || String(b.updatedAt).localeCompare(String(a.updatedAt)) || a.number - b.number);
  if (!eligible.length) return null;
  const pr = eligible[0];
  const repo = repositoryMap.get(pr.repo);
  return {
    repo:pr.repo, repoName:config.repositoryLabels?.[pr.repo] || repo.name.replaceAll('-', ' '), repoUrl:`https://github.com/${pr.repo}`,
    stars:repo.stargazers_count, forks:repo.forks_count,
    number:pr.number, title:config.pullRequestLabels?.[`${pr.repo}#${pr.number}`] || pr.title,
    url:pr.url, status:pr.status
  };
}

function validateSearch(response) {
  if (!Array.isArray(response.items) || !Number.isInteger(response.total_count) || response.incomplete_results) throw new Error('GitHub returned incomplete search data; keeping the previous profile');
}

export async function collectProfile(config, api) {
  validateConfig(config);
  const query = `author:${config.username} is:pr is:public -user:${config.username}`;
  const search = state => api(`search/issues?q=${encodeURIComponent(`${query} is:${state}`)}&sort=updated&order=desc&per_page=100`);
  const listRepos = async () => {
    const repos = [];
    for (let page = 1; page <= 20; page++) {
      const batch = await api(`users/${config.username}/repos?type=owner&sort=pushed&per_page=100&page=${page}`);
      if (!Array.isArray(batch)) throw new Error('Invalid repository response');
      repos.push(...batch);
      if (batch.length < 100) return repos;
    }
    throw new Error('Repository pagination exceeded the supported limit');
  };
  const [repos, merged, open] = await Promise.all([listRepos(), search('merged'), search('open')]);
  validateSearch(merged); validateSearch(open);
  const pulls = normalizePullRequests(merged, open);
  const names = [...new Set(pulls.map(pr => pr.repo))].sort();
  const repositoryMap = new Map();
  for (let i = 0; i < names.length; i += 4) {
    const batch = await Promise.all(names.slice(i, i + 4).map(name => api(`repos/${name}`)));
    batch.forEach((repo, j) => {
      if (!Number.isInteger(repo.stargazers_count) || !Number.isInteger(repo.forks_count)) throw new Error('Missing repository metrics');
      repositoryMap.set(names[i + j], repo);
    });
  }
  const publicPulls = pulls.filter(pr => !repositoryMap.get(pr.repo).private);
  let spotlight = null;
  const pending = [...publicPulls];
  for (let attempt = 0; pending.length && attempt < 20; attempt++) {
    const candidate = selectSpotlight(pending, repositoryMap, config);
    const current = await api(`repos/${candidate.repo}/pulls/${candidate.number}`);
    if (!['open','closed'].includes(current.state) || typeof current.merged !== 'boolean') throw new Error('Missing current pull request status');
    if (current.merged || current.state === 'open') {
      spotlight = {...candidate, status:current.merged ? 'merged' : 'open'};
      break;
    }
    pending.splice(pending.findIndex(pr => pr.url === candidate.url),1);
  }
  if (!spotlight && pending.length) throw new Error('Too many stale pull request search results');
  const mergedRepos = new Map();
  for (const pr of publicPulls.filter(pr => pr.status === 'merged')) mergedRepos.set(pr.repo, (mergedRepos.get(pr.repo) || 0) + 1);
  const contributions = await Promise.all([...mergedRepos].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0,3).map(async ([repo]) => {
    const result=await api(`search/issues?q=${encodeURIComponent(`${query} is:merged repo:${repo}`)}&sort=updated&order=desc&per_page=3`);
    validateSearch(result);
    return {
      repo, name:config.repositoryLabels?.[repo] || repositoryMap.get(repo).name.replaceAll('-',' '),
      count:result.total_count,
      summary:config.contributionSummaries?.[repo] || repo.split('/')[1].replaceAll('-',' '),
      pulls:result.items.slice(0,3).map(pr=>({number:pr.number,url:pr.html_url,title:config.pullRequestLabels?.[`${repo}#${pr.number}`] || pr.title}))
    };
  }));
  return {
    schemaVersion:1, username:config.username,
    mergedPullRequests:merged.total_count, openPullRequests:open.total_count,
    spotlight,
    projects:selectProjects(repos, config), contributions
  };
}
