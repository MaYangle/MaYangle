import { execFileSync } from 'node:child_process';

export function validateConfig(config) {
  if (!/^[a-z\d-]+$/i.test(config.username ?? '')) throw new Error('Invalid GitHub username');
  if (!config.name || !config.tagline) throw new Error('Name and tagline are required');
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
      encoders:custom?.encoders || [],
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
        url:item.html_url, status:actualStatus, updatedAt:item.updated_at,
        createdAt:item.created_at, mergedAt:item.pull_request?.merged_at || null
      });
    }
  }
  return [...byUrl.values()];
}

export function selectSpotlight(pulls, repositoryMap, config) {
  const eligible = pulls.filter(pr => ['merged','open'].includes(pr.status) && !repositoryMap.get(pr.repo)?.private);
  const eventDate = pr => pr.status === 'merged' ? (pr.mergedAt || pr.updatedAt || '') : (pr.createdAt || pr.updatedAt || '');
  eligible.sort((a,b) => Number(b.status === 'merged') - Number(a.status === 'merged') || eventDate(b).localeCompare(eventDate(a)) || repositoryMap.get(b.repo).stargazers_count - repositoryMap.get(a.repo).stargazers_count || a.number - b.number);
  if (!eligible.length) return null;
  const pr = eligible[0];
  const repo = repositoryMap.get(pr.repo);
  return {
    repo:pr.repo, repoName:config.repositoryLabels?.[pr.repo] || repo.name.replaceAll('-', ' '), repoUrl:`https://github.com/${pr.repo}`,
    stars:repo.stargazers_count, forks:repo.forks_count,
    number:pr.number, title:config.pullRequestLabels?.[`${pr.repo}#${pr.number}`] || pr.title,
    url:pr.url, status:pr.status, date:eventDate(pr)
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
  const detailCache = new Map();
  const loadPull = pr => {
    const key = `${pr.repo}#${pr.number}`;
    if (!detailCache.has(key)) detailCache.set(key, api(`repos/${pr.repo}/pulls/${pr.number}`));
    return detailCache.get(key);
  };
  const resolveSpotlight = async (candidates,openOnly=false) => {
    const pending = [...candidates];
    for (let attempt=0;pending.length && attempt<20;attempt++) {
      const candidate=selectSpotlight(pending,repositoryMap,config);
      const current=await loadPull(candidate);
      if (!['open','closed'].includes(current.state) || typeof current.merged!=='boolean') throw new Error('Missing current pull request status');
      if ((!openOnly && current.merged) || (!current.merged && current.state==='open')) {
        return {...candidate,status:current.merged?'merged':'open',date:current.merged?(current.merged_at || candidate.date):(current.created_at || candidate.date)};
      }
      pending.splice(pending.findIndex(pr=>pr.url===candidate.url),1);
    }
    if(pending.length)throw new Error('Too many stale pull request search results');
    return null;
  };
  const spotlight=await resolveSpotlight(publicPulls);
  const openSpotlight=spotlight?.status==='merged'?await resolveSpotlight(publicPulls.filter(pr=>pr.status==='open'),true):null;
  const mergedRepos = new Map();
  const latestMerge = new Map();
  for (const pr of publicPulls.filter(pr => pr.status === 'merged')) {
    mergedRepos.set(pr.repo,(mergedRepos.get(pr.repo)||0)+1);
    const date=pr.mergedAt || pr.updatedAt || '';
    if(date>(latestMerge.get(pr.repo)||''))latestMerge.set(pr.repo,date);
  }
  const contributions = await Promise.all([...mergedRepos].sort((a,b) => latestMerge.get(b[0]).localeCompare(latestMerge.get(a[0])) || b[1]-a[1] || a[0].localeCompare(b[0])).slice(0,3).map(async ([repo]) => {
    const result=await api(`search/issues?q=${encodeURIComponent(`${query} is:merged repo:${repo}`)}&sort=updated&order=desc&per_page=100`);
    validateSearch(result);
    return {
      repo, name:config.repositoryLabels?.[repo] || repositoryMap.get(repo).name.replaceAll('-',' '),
      count:result.total_count,
      summary:config.contributionSummaries?.[repo] || repo.split('/')[1].replaceAll('-',' '),
      pulls:result.items.filter(pr=>pr.pull_request?.merged_at).sort((a,b)=>b.pull_request.merged_at.localeCompare(a.pull_request.merged_at)).slice(0,6).map(pr=>({number:pr.number,url:pr.html_url,title:config.pullRequestLabels?.[`${repo}#${pr.number}`] || pr.title}))
    };
  }));
  const sampled = publicPulls.filter(pr => pr.status === 'merged').sort((a,b) => String(b.mergedAt).localeCompare(String(a.mergedAt))).slice(0,30);
  const impact = {sampleSize:sampled.length, additions:0, deletions:0, fileChanges:0};
  for (let i=0;i<sampled.length;i+=4) {
    const batch=await Promise.all(sampled.slice(i,i+4).map(loadPull));
    for (const pr of batch) {
      if (!pr.merged || !['additions','deletions','changed_files'].every(key=>Number.isInteger(pr[key]) && pr[key]>=0)) throw new Error('Missing merged contribution diff metrics');
      impact.additions+=pr.additions;impact.deletions+=pr.deletions;impact.fileChanges+=pr.changed_files;
    }
  }
  const activity=publicPulls.map(pr=>({
    repo:pr.repo,repoName:config.repositoryLabels?.[pr.repo] || repositoryMap.get(pr.repo).name.replaceAll('-',' '),
    number:pr.number,url:pr.url,status:pr.status,
    title:config.pullRequestLabels?.[`${pr.repo}#${pr.number}`] || pr.title,
    date:pr.status==='merged'?pr.mergedAt:pr.createdAt
  })).filter(pr=>pr.date && Number.isFinite(Date.parse(pr.date))).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  return {
    schemaVersion:3, username:config.username,
    mergedPullRequests:merged.total_count, openPullRequests:open.total_count,
    spotlight, openSpotlight,
    projects:selectProjects(repos, config), contributions, impact, activity
  };
}
