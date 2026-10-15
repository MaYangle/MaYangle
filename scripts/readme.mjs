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
function picture(assets, prefix, alt, href) {
  const variants = Object.fromEntries(['animated', 'still', 'mobile', 'mobileStill'].map(key => {
    const path = assets?.[`${prefix}${key}`];
    if (!/^assets\/generated\/(?:summary|research)(?:-mobile)?(?:-still)?\.[a-f0-9]{12}\.svg$/.test(path ?? '')) throw new Error('Invalid profile image asset');
    return [key, path];
  }));
  const escapedHref = url(href, 'image link').replaceAll('&', '&amp;');
  return `<a href="${escapedHref}"><picture><source media="(prefers-reduced-motion: reduce) and (max-width: 600px)" srcset="${variants.mobileStill}"><source media="(prefers-reduced-motion: reduce)" srcset="${variants.still}"><source media="(max-width: 600px)" srcset="${variants.mobile}"><img src="${variants.animated}" width="100%" alt="${alt.replaceAll('"', '&quot;')}"></picture></a>`;
}
export function renderReadme(config, activity, assets) {
  if (!config || typeof config !== 'object') throw new Error('Invalid profile');
  const name = text(config.name, 'name');
  const lines = ['<!-- Generated from profile.config.json and public GitHub data. -->'];
  if (!Array.isArray(config.projects) || !config.projects.length) throw new Error('Invalid projects');
  if (!config.links || typeof config.links !== 'object' || Array.isArray(config.links) || !Object.keys(config.links).length) throw new Error('Invalid contact links');
  if (!activity || activity.username !== config.username) throw new Error('Activity snapshot does not match profile');
  const {counts} = activity;
  for (const key of ['merged', 'open', 'closed', 'mergedRepositories', 'publicProjects']) {
    if (!Number.isInteger(counts?.[key]) || counts[key] < 0) throw new Error(`Invalid activity count ${key}`);
  }
  const alt = `${name} — ${counts.merged} merged upstream PRs; ${counts.open} open; ${counts.mergedRepositories} repositories with merged contributions; ${counts.publicProjects} public projects.`;
  lines.push('', picture(assets, 'summary', alt, queryLink(activity.queries.merged)), '',
    `**${text(config.tagline, 'tagline')}**`, '', text(config.bio, 'bio'), '',
    Object.entries(config.links).map(([label, target]) => link(label, target, 'contact', true)).join(' · '));
  lines.push('', '## Research & engineering');
  for (const project of config.projects) {
    lines.push('', `### ${link(project.name, project.url, 'project')}`, '', text(project.description, 'description'), '', links(project.links, 'project links'));
  }
  const research = config.research;
  if (!Array.isArray(research?.directions) || !research.directions.length) throw new Error('Invalid research directions');
  lines.push('', picture(assets, 'research', 'Research model path: frozen multimodal features, masked branches, cross-attention, policy routing and scalar sentiment.', research.directions[0].url));
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
  lines.push('', '### Recent upstream activity', '', '| Updated (UTC) | Pull request | Status |', '| --- | --- | --- |');
  for (const pr of activity.pullRequests.slice(0, limit)) {
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
    '*Upstream PRs exclude my own repositories. Public projects exclude forks, empty/archived repositories and this profile. The moving signal illustrates the research workflow; it is not a live activity feed.*');
  return lines.join('\n') + '\n';
}
