function text(value, field) {
  if (typeof value !== 'string' || !value.trim() || /[\r\n]/.test(value)) throw new Error(`Invalid ${field}`);
  return value.replace(/[&<>]/g, match => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[match]))
    .replace(/([\\`*_[\]#|])/g, match => String.fromCharCode(92) + match);
}
function url(value, field, contact = false) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`Invalid ${field}`); }
  if (!['https:', ...(contact ? ['mailto:'] : [])].includes(parsed.protocol)) throw new Error(`Invalid ${field}`);
  if (parsed.username || parsed.password) throw new Error(`Invalid ${field}`);
  if (/\s|[<>]/.test(value)) throw new Error(`Invalid ${field}`);
  return value.replace(/\(/g, '%28').replace(/\)/g, '%29');
}
function link(label, target, field, contact = false) {
  return `[${text(label, field)}](${url(target, field, contact)})`;
}
function links(items, field) {
  if (!Array.isArray(items) || !items.length) throw new Error(`Invalid ${field}`);
  return items.map(item => link(item.label, item.url, field)).join(' · ');
}
function date(value) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new Error('Invalid activity date');
  return new Date(value).toISOString().slice(0, 10);
}
const shortened = (value, length = 85) => value.length > length ? value.slice(0, length - 1) + '…' : value;
function queryLink(query) {
  return `https://github.com/search?q=${encodeURIComponent(query)}&type=pullrequests`;
}
export function renderTextVersion(config, activity) {
  if (!config || typeof config !== 'object') throw new Error('Invalid profile');
  const name = text(config.name, 'name');
  const lines = [`# ${name}`];
  if (!Array.isArray(config.projects) || !config.projects.length || !Array.isArray(activity.projects)) throw new Error('Invalid projects');
  if (!config.links || typeof config.links !== 'object' || Array.isArray(config.links) || !Object.keys(config.links).length) throw new Error('Invalid contact links');
  if (!activity || activity.username !== config.username) throw new Error('Activity snapshot does not match profile');
  const {counts} = activity;
  for (const key of ['merged', 'open', 'closed', 'mergedRepositories', 'publicProjects']) {
    if (!Number.isInteger(counts?.[key]) || counts[key] < 0) throw new Error(`Invalid activity count ${key}`);
  }
  lines.push('',
    `**${text(config.tagline, 'tagline')}**`, '', text(config.bio, 'bio'), '',
    Object.entries(config.links).map(([label, target]) => link(label, target, 'contact', true)).join(' · '));
  lines.push('', '## Public activity', '',
    `${link(`${counts.merged} merged upstream PRs`, queryLink(activity.queries.merged), 'merged query')} · ${counts.open} open PRs · ${counts.closed} closed without merge · ${counts.mergedRepositories} upstream repositories with merges · ${counts.publicProjects} public projects.`);
  lines.push('', '## Research & engineering');
  for (const project of activity.projects) {
    lines.push('', `### ${link(project.name || project.repo, project.url, 'project')}`, '', text(project.description || 'Public repository.', 'description'));
    const meta = [project.language, project.defaultBranch && `default branch: ${project.defaultBranch}`, project.pushedAt && `updated: ${date(project.pushedAt)}`].filter(Boolean);
    if (meta.length) lines.push('', `*${text(meta.join(' · '), 'project details')}*`);
    const featured = config.projects.find(item => item.url.toLowerCase() === project.url.toLowerCase());
    if (featured) lines.push('', links(featured.links, 'project links'));
    if (project.coverPath) lines.push('', link(`Project artwork (${project.coverPath})`, `${project.url}/blob/${encodeURIComponent(project.defaultBranch)}/${project.coverPath.split('/').map(encodeURIComponent).join('/')}`, 'project artwork'));
  }
  const research = config.research;
  if (!Array.isArray(research?.directions) || !research.directions.length) throw new Error('Invalid research directions');
  lines.push('', '| Direction | What I work on |', '| --- | --- |');
  for (const direction of research.directions) {
    lines.push(`| ${link(direction.name, direction.url, 'direction')} | ${text(direction.summary, 'direction summary')} |`);
  }
  const snapshot = research.snapshot;
  if (!snapshot || !Array.isArray(snapshot.metrics) || !snapshot.metrics.length) throw new Error('Invalid research snapshot');
  lines.push('', `**Experiment snapshot · ${date(snapshot.asOf)}**`, '', text(snapshot.summary, 'study summary'), '',
    '| CH-SIMS v2.0 arm | VALID MAE ↓ |', '| --- | --- |');
  for (const metric of snapshot.metrics) lines.push(`| ${text(metric.name, 'arm')} | ${text(metric.score, 'score')} |`);
  lines.push('', text(snapshot.protocol, 'protocol'), '', `${text(snapshot.conclusion, 'conclusion')} ${link('Full results & controls', snapshot.url, 'results')}.`, '', text(snapshot.pending, 'open research gates'));
  if (!Array.isArray(config.contributions)) throw new Error('Invalid contributions');
  if (config.contributions.length) {
    lines.push('', '## Open-source contributions');
    if (!Array.isArray(activity.repositories)) throw new Error('Invalid contribution repositories');
    lines.push('', '| Upstream repository | Merged | Open | Closed without merge |', '| --- | ---: | ---: | ---: |');
    for (const repo of activity.repositories) {
      const label = config.activity?.repositoryLabels?.[repo.repo] ?? repo.repo;
      const base = `author:${config.username} repo:${repo.repo} is:pr is:public`;
      lines.push(`| ${link(label, repo.url, 'upstream repository')} | ${link(String(repo.merged), queryLink(`${base} is:merged`), 'merged PRs')} | ${link(String(repo.open), queryLink(`${base} is:open`), 'open PRs')} | ${link(String(repo.closed), queryLink(`${base} is:closed -is:merged`), 'closed PRs')} |`);
    }
    for (const contribution of config.contributions) {
      const verified = contribution.prs.map(pr => {
        const record = activity.pullRequests.find(item => item.url === pr.url);
        if (!record || record.status !== 'merged') throw new Error(`Selected contribution is no longer verified merged: ${pr.url}`);
        return pr;
      });
      lines.push('', `${text(contribution.summary, 'summary')} ${links(verified, 'pull requests')}.`);
    }
  }
  const limit = config.activity?.recentLimit;
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) throw new Error('Invalid recent activity limit');
  lines.push('', '### Upstream PR records', '', '| Updated (UTC) | Pull request | Status |', '| --- | --- | --- |');
  for (const pr of activity.pullRequests) {
    if (!['merged', 'open', 'closed'].includes(pr.status)) throw new Error('Invalid PR state');
    const title = config.activity?.pullRequestLabels?.[`${pr.repo}#${pr.number}`] ?? pr.title;
    const state = {merged: 'Merged', open: 'Open', closed: 'Closed without merge'}[pr.status];
    lines.push(`| ${date(pr.updatedAt)} | ${link(`${pr.repo} #${pr.number} — ${shortened(title)}`, pr.url, 'recent PR')} | ${state} |`);
  }
  if (!activity.pullRequests.length) lines.push('| — | No public upstream PRs yet | — |');
  lines.push('', '### Latest project update', '');
  for (const project of activity.projects) {
    const commit = project.latestCommit;
    if (commit) lines.push(`- ${date(commit.date)} · ${link(project.repo, project.url, 'project')} · ${link(shortened(commit.message), commit.url, 'commit')}`);
  }
  const refreshed = new Date(activity.updatedAt).toISOString().replace('T', ' ').replace(/:\d{2}\.\d{3}Z$/, ' UTC');
  lines.push('', `*GitHub data refreshed: ${refreshed}. Checked every 6 hours; the date changes when public data changes.*`, '',
    '*Upstream PRs exclude my own repositories. Public projects exclude forks, empty/archived repositories and this profile. Particle and orbit motion illustrate the research workflow; they are not live activity signals.*');
  return lines.join('\n') + '\n';
}

export function renderReadme(config, activity, assets) {
  if (!activity || activity.username !== config.username) throw new Error('Activity snapshot does not match profile');
  const username = config.username;
  const badges = [
    `<a href="${queryLink(`author:${username} is:pr is:public -user:${username} is:merged`)}"><img src="https://img.shields.io/badge/upstream%20merged-${activity.counts.merged}-2ea44f?style=flat-square&logo=github" alt="${activity.counts.merged} merged upstream pull requests"/></a>`,
    `<a href="${queryLink(`author:${username} is:pr is:public -user:${username} is:open`)}"><img src="https://img.shields.io/badge/open%20PRs-${activity.counts.open}-5479bd?style=flat-square&logo=github" alt="${activity.counts.open} open pull requests"/></a>`,
    `<a href="${activity.projects[0]?.url ?? `https://github.com/${username}?tab=repositories`}"><img src="https://img.shields.io/badge/public%20projects-${activity.counts.publicProjects}-8997a5?style=flat-square&logo=github" alt="${activity.counts.publicProjects} public projects"/></a>`
  ].join('&nbsp; ');
  const nav = Object.entries(config.links).map(([label,target])=>`<a href="${url(target,'contact',true)}">${text(label,'contact label')}</a>`).join(' · ');
  const out = [
    '<p align="center"><img src="assets/profile-particles.svg" width="100%" alt="Animated interstellar particle banner"/></p>',
    `<h1 align="center">${text(config.name,'name')}</h1>`,
    '<p align="center"><b>Multimodal AI · Open Source · Reproducible Research</b></p>',
    `<p align="center">${badges}</p>`,
    `<p align="center">${nav}</p>`,
    '',
    'I build multimodal learning systems and study how text, audio, and vision combine under careful, reproducible evaluation. I value controlled comparisons, honest results, and practical reliability fixes in the open-source projects I use.',
    '',
    '---',
    '',
    '## Featured research',
    ''
  ];
  const featuredUrl=config.projects[0].url;
  const featuredActivity=activity.projects.find(project=>project.url.toLowerCase()===featuredUrl.toLowerCase());
  out.push(`### ${link(config.projects[0].name,featuredUrl,'featured project')}`,'',
    text(featuredActivity?.description ?? config.projects[0].description,'project description'),'');
  out.push('Text · Audio · Vision  →  **Multimodal fusion**  →  Sentiment prediction','',
    links(config.projects[0].links,'research links'),'',
    '<sub>New public, non-fork repositories with content are discovered automatically on the next six-hour refresh.</sub>','');
  for(const project of activity.projects){
    if(config.projects.some(item=>item.url.toLowerCase()===project.url.toLowerCase()))continue;
    const meta=[project.language,project.pushedAt&&`updated ${date(project.pushedAt)}`,Number.isInteger(project.stars)&&`${project.stars} stars`].filter(Boolean).join(' · ');
    out.push(`### ${link(project.name||project.repo,project.url,'public project')}`,'',
      text(project.description||'Public repository.','project description'),meta?`\n*${text(meta,'project details')}*`:'','');
  }
  const snapshot=config.research.snapshot;
  out.push('## Research snapshot','',
    `**${date(snapshot.asOf)} · CH-SIMS v2.0 · ${/(\d+)\/\d+ fits/.exec(snapshot.summary)?.[1]??'—'} completed fits · 3 seeds**`,'',
    text(snapshot.summary,'research snapshot'),'',
    '| Validation arm | VALID MAE ↓ |','| --- | ---: |');
  for(const metric of snapshot.metrics)out.push(`| ${text(metric.name,'arm')} | ${text(metric.score,'score')} |`);
  out.push('',text(snapshot.protocol,'evaluation protocol'),'',
    `${text(snapshot.conclusion,'research conclusion')} ${link('Methods and full results',snapshot.url,'results')}.`,'',
    `**Next:** ${text(snapshot.pending,'next research steps')}`,'');
  out.push('## What I work on','',
    '| Area | Current focus |','| --- | --- |');
  for(const direction of config.research.directions)out.push(`| ${link(direction.name,direction.url,'research direction')} | ${text(direction.summary,'research summary')} |`);
  out.push('', '## Open-source contributions','');
  for(const contribution of config.contributions){
    const verified=contribution.prs.map(pr=>{
      const record=activity.pullRequests.find(item=>item.url===pr.url);
      if(!record||record.status!=='merged')throw new Error(`Selected contribution is no longer verified merged: ${pr.url}`);
      return pr;
    });
    out.push(`**${link(contribution.repo,contribution.url,'upstream project')}** — ${text(contribution.summary,'contribution summary')}`,
      '',links(verified,'merged pull requests'),'');
  }
  const recent=activity.pullRequests.slice(0,6);
  out.push('### Recent pull requests','',
    '| Updated | Pull request | Status |','| --- | --- | --- |');
  for(const pr of recent){
    const label=config.activity?.pullRequestLabels?.[`${pr.repo}#${pr.number}`]??pr.title;
    const state={merged:'Merged',open:'Open',closed:'Closed without merge'}[pr.status];
    out.push(`| ${date(pr.updatedAt)} | ${link(`${pr.repo} #${pr.number} — ${shortened(label,72)}`,pr.url,'pull request')} | ${state} |`);
  }
  if(!recent.length)out.push('| — | No public upstream pull requests yet | — |');
  out.push('', '## Latest project activity','');
  for(const project of activity.projects){
    const commit=project.latestCommit;
    if(commit)out.push(`- ${date(commit.date)} · ${link(project.repo,project.url,'project')} · ${link(shortened(commit.message),commit.url,'latest commit')}`);
  }
  out.push('', '## Contribution graph','',
    '<picture>',
    '  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/MaYangle/MaYangle/output/contribution-snake-dark.svg"/>',
    '  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/MaYangle/MaYangle/output/contribution-snake.svg"/>',
    '  <img alt="Animated GitHub contribution graph" src="https://raw.githubusercontent.com/MaYangle/MaYangle/output/contribution-snake.svg" width="100%"/>',
    '</picture>','',
    '<sub>Public GitHub activity is collected every six hours. The contribution animation is rebuilt daily.</sub>','');
  const refreshed=new Date(activity.updatedAt).toISOString().replace('T',' ').replace(/:\d{2}\.\d{3}Z$/,' UTC');
  out.push(`*Profile data last changed ${refreshed}. Upstream PR counts exclude repositories owned by ${username}.*`,'');
  return out.join('\n').trimEnd()+'\n';
}
