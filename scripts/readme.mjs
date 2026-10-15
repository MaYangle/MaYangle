function text(value, field) {
  if (typeof value !== 'string' || !value.trim() || /[\r\n<>]/.test(value)) throw new Error(`Invalid ${field}`);
  return value.replace(/([\\`*_[\]#])/g, match => String.fromCharCode(92) + match);
}
function url(value, field, contact = false) {
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`Invalid ${field}`); }
  if (!['https:', ...(contact ? ['mailto:'] : [])].includes(parsed.protocol)) throw new Error(`Invalid ${field}`);
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
export function renderReadme(config) {
  if (!config || typeof config !== 'object') throw new Error('Invalid profile');
  const lines = ['<!-- Generated from profile.config.json by scripts/update-profile.mjs. -->', '',
    `# ${text(config.name, 'name')}`, '', text(config.tagline, 'tagline'), '', text(config.bio, 'bio')];
  if (!Array.isArray(config.projects) || !config.projects.length) throw new Error('Invalid projects');
  lines.push('', '## Selected work');
  for (const project of config.projects) {
    lines.push('', `### ${link(project.name, project.url, 'project')}`, '', text(project.description, 'description'), '', links(project.links, 'project links'));
  }
  if (!Array.isArray(config.contributions)) throw new Error('Invalid contributions');
  if (config.contributions.length) {
    lines.push('', '## Open source');
    for (const contribution of config.contributions) {
      lines.push('', `${link(contribution.repo, contribution.url, 'contribution')} — ${text(contribution.summary, 'summary')}`, '', links(contribution.prs, 'pull requests'));
    }
  }
  if (!config.links || typeof config.links !== 'object' || Array.isArray(config.links) || !Object.keys(config.links).length) throw new Error('Invalid contact links');
  lines.push('', Object.entries(config.links).map(([label, target]) => link(label, target, 'contact', true)).join(' · '));
  return lines.join('\n') + '\n';
}
