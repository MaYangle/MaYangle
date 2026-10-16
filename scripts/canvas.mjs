import {renderParticleArtwork, particleMotion} from './particle-art.mjs';
const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const ink = '#172c40';
const mid = '#637d95';

function wrap(value, width, size, limit = 4) {
  const words = String(value ?? '').trim().split(/\s+/).filter(Boolean);
  const capacity = Math.max(10, Math.floor(width / (size * .51)));
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > capacity && line) { lines.push(line); line = word; }
    else line = candidate;
  }
  if (line) lines.push(line);
  if (lines.length > limit) {
    const visible = lines.slice(0, limit);
    visible[limit - 1] = `${visible[limit - 1].slice(0, Math.max(1, capacity - 1))}…`;
    return visible;
  }
  return lines;
}
function text(x, y, value, size = 18, color = ink, options = {}) {
  const {weight = 400, anchor = 'start', spacing = 0, className = '', href = ''} = options;
  const node = `<text x="${x}" y="${y}" font-family="Inter,Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${spacing}" fill="${color}"${className ? ` class="${className}"` : ''}>${esc(value)}</text>`;
  return href ? `<a href="${esc(href)}" target="_top">${node}</a>` : node;
}
function paragraph(x, y, value, width, size, color = mid, leading = size * 1.46, maxLines = 4) {
  const lines = wrap(value, width, size, maxLines);
  return {svg: lines.map((line, i) => text(x, y + i * leading, line, size, color)).join(''), bottom: y + Math.max(0, lines.length - 1) * leading, lines};
}
function link(x, y, label, url, size = 17, color = mid, options = {}) {
  return text(x, y, label, size, color, {...options, href: url});
}
function flowingLink(x, y, value, href, width, size, color = ink, leading = size * 1.38, maxLines = 3) {
  const lines = wrap(value, width, size, maxLines);
  const safeHref = esc(href);
  const tspans = lines.map((line, index) => `<tspan x="${x}" dy="${index ? leading : 0}">${esc(line)}</tspan>`).join('');
  return `<a href="${safeHref}" target="_top"><text x="${x}" y="${y}" font-family="Inter,Arial,Helvetica,sans-serif" font-size="${size}" fill="${color}">${tspans}</text></a>`;
}
function safeDate(value) {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return 'DATE UNAVAILABLE';
  return new Date(value).toISOString().slice(0, 10);
}
function label(x, y, value, mobile = false) {
  return text(x, y, String(value).toUpperCase(), mobile ? 12 : 11, mid, {weight: 600, spacing: mobile ? 2 : 2.4});
}
function researchFlow(mobile, y, animated) {
  const x = mobile ? 38 : 620, width = mobile ? 524 : 520;
  const height = width * 350 / 494;
  const top = mobile ? y : y - 18;
  let svg = renderParticleArtwork('fusion', x, top, width, height, {animated, fit: 'xMidYMid meet'});
  const positions = [['Text', 45], ['Audio', 134], ['Vision', 223]];
  for (const [name, py] of positions) svg += text(x + width * .215, top + py * height / 350, name, mobile ? 14 : 14, '#6d8297');
  return svg;
}
function coverImage(cover, project, x, y, width, height) {
  if (!cover?.uri) return '';
  return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice"><image data-cover-repo="${esc(project.repo)}" data-cover-path="${esc(cover.path)}" data-cover-sha="${esc(cover.sha)}" href="${cover.uri}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/></svg>`;
}
function miniOrbit(x, y, width, mobile, index, animated) {
  return renderParticleArtwork(index % 2 ? 'orbital' : 'landscape', x, y, width, mobile ? 96 : 111, {animated,fit:'xMidYMid slice'});
}
function featureSection(config, activity, mobile, animated) {
  const width = mobile ? 600 : 1200;
  const left = mobile ? 38 : 60;
  const right = mobile ? 562 : 1140;
  let y = mobile ? 705 : 705;
  let out = label(left, y, '01 / SELECTED RESEARCH', mobile);
  out += `<path d="M${mobile ? 38 : 293} ${y - (mobile ? 4 : 5)}H${right}" fill="none" stroke="#d8e2eb" stroke-width="1"/>`;
  y += mobile ? 57 : 71;
  const titleSize = mobile ? 32 : 40;
  out += text(left, y, config.projects[0]?.name ?? 'Multimodal Sentiment Fusion', titleSize, ink, {weight: 600, spacing: -1.6});
  const titleBottom = y;
  const description = 'Text, audio and vision. Controlled experiments, native evaluation and reproducible training.';
  const descriptionWidth = mobile ? 520 : 500;
  const desc = paragraph(left, y + (mobile ? 43 : 48), description, descriptionWidth, mobile ? 20 : 19, mid, mobile ? 29 : 29, 3);
  out += desc.svg;
  const flowY = mobile ? desc.bottom + 58 : y + 45;
  const flowX = mobile ? left : 620;
  const flowGraphic = researchFlow(mobile, flowY, animated);
  if (mobile) out += flowGraphic;
  else out += flowGraphic;
  const metricsY = mobile ? flowY + 397 : flowY + 186;
  const metricGap = mobile ? 159 : 180;
  const features = [
    ['27', 'COMPLETED FITS'],
    ['3', 'SEEDS'],
    ['VALID', 'DEVELOPMENT SPLIT']
  ];
  for (let i = 0; i < features.length; i++) {
    const x = left + i * metricGap;
    out += text(x, metricsY, features[i][0], mobile ? 30 : 33, i === 2 ? '#527ca7' : ink, {weight: 400, spacing: -.7});
    out += text(x, metricsY + (mobile ? 21 : 23), features[i][1], mobile ? 9 : 10, mid, {spacing: 1.1});
  }
  const noteY = metricsY + (mobile ? 51 : 53);
  out += text(left, noteY, 'Routing gain not established against matched controls.', mobile ? 15 : 14, mid);
  out += text(left, noteY + (mobile ? 24 : 23), 'CH-SIMS v2.0 · 14 Oct 2026 · Final TEST remains independent.', mobile ? 13 : 12, '#8797a7');
  const metrics = config.research.snapshot.metrics.map(metric => `${metric.name}: MAE ${metric.score}`);
  let metricsBottom = noteY + (mobile ? 48 : 47);
  for (const item of metrics) {
    const row = paragraph(left, metricsBottom, item, mobile ? 520 : 500, 12, '#627e96', 17, 2);
    out += row.svg;
    metricsBottom = row.bottom + 18;
  }
  const linksY = Math.max(noteY + (mobile ? 61 : 56), metricsBottom + 2);
  const project = config.projects[0];
  const codeLink = link(left, linksY, 'CODE', project.url, mobile ? 13 : 12, '#5688b7', {spacing: 1.1});
  const architecture = link(left + (mobile ? 97 : 88), linksY, 'ARCHITECTURE', project.links[0].url, mobile ? 13 : 12, '#5688b7', {spacing: 1.1});
  const experiment = link(left + (mobile ? 250 : 228), linksY, 'EXPERIMENTS', project.links[1].url, mobile ? 13 : 12, '#5688b7', {spacing: 1.1});
  out += codeLink + architecture + experiment;
  const bottom = linksY + (mobile ? 42 : 34);
  out += `<path d="M${left} ${bottom}H${right}" fill="none" stroke="#e5ebf1" stroke-width="1"/>`;
  return {svg: out, bottom, firstY: titleBottom, flowX};
}
function renderProjectRows(activity, config, y0, mobile, covers = {}, animated = true) {
  const projects = activity.projects.filter(item => !config.projects.some(project => project.url.toLowerCase() === item.url.toLowerCase()));
  if (!projects.length) return {svg: '', height: 0};
  const w = mobile ? 600 : 1200;
  const x = mobile ? 38 : 60;
  const right = mobile ? 562 : 1140;
  const rowHeight = mobile ? 205 : 164;
  let svg = '';
  svg += label(x, y0 + 4, '02 / MORE PUBLIC PROJECTS', mobile);
  let y = y0 + 32;
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const rowTop = y + i * rowHeight;
    const imageW = mobile ? 522 : 338;
    const imageH = mobile ? 96 : 111;
    const art = covers[project.repo] ? coverImage(covers[project.repo], project, x, rowTop + 12, imageW, imageH) : '';
    svg += art || miniOrbit(x, rowTop + 20, imageW, mobile, i, animated);
    const tx = mobile ? x : x + imageW + 32;
    const tw = mobile ? 520 : 700;
    const titleY = mobile ? rowTop + imageH + 36 : rowTop + 43;
    const name = project.name || project.repo.split('/')[1].replaceAll('-', ' ');
    const target = project.url;
    svg += link(tx, titleY, name, target, mobile ? 21 : 22, ink, {weight: 550, spacing: -.45});
    const description = project.description || 'Public repository.';
    const desc = paragraph(tx, titleY + (mobile ? 25 : 31), description, tw, mobile ? 16 : 15, mid, mobile ? 22 : 21, mobile ? 2 : 2);
    svg += desc.svg;
    const metaY = Math.max(desc.bottom + 24, mobile ? rowTop + rowHeight - 18 : rowTop + 119);
    const meta = [project.language, `${safeDate(project.pushedAt)} · UPDATED`].filter(Boolean).join('   ·   ');
    svg += text(tx, metaY, meta, mobile ? 12 : 11, '#8798a8', {spacing: .5});
    if (i < projects.length - 1) svg += `<path d="M${x} ${rowTop + rowHeight - 1}H${right}" stroke="#e8edf2" fill="none"/>`;
  }
  const height = 32 + projects.length * rowHeight;
  svg += `<path d="M${x} ${y0 + height}H${right}" stroke="#e5ebf1" fill="none"/>`;
  return {svg, height};
}
function renderOpenSource(activity, config, y0, mobile, animated) {
  const x=mobile?38:60, right=mobile?562:1140;
  const repositories=activity.repositories??[];
  const hasAdditionalProjects=activity.projects.some(item=>!config.projects.some(p=>p.url.toLowerCase()===item.url.toLowerCase()));
  const rowHeight=mobile?238:145;
  let svg=label(x,y0+4,(hasAdditionalProjects?'03':'02')+' / UPSTREAM CONTRIBUTIONS',mobile);
  let y=y0+35;
  for(let index=0;index<repositories.length;index++){
    const repo=repositories[index];
    const name=config.activity?.repositoryLabels?.[repo.repo]??repo.repo.split('/')[1].replaceAll('-',' ');
    const imageWidth=mobile?524:374, imageHeight=mobile?140:100;
    svg+=renderParticleArtwork(index%2?'orbital':'landscape',x,y+10,imageWidth,imageHeight,{animated,fit:'xMidYMid slice'});
    const tx=mobile?x:463, titleY=mobile?y+imageHeight+38:y+37;
    svg+=link(tx,titleY,name,repo.url,mobile?18:22,ink,{weight:500,spacing:-.3});
    const countText=repo.merged+' merged · '+repo.open+' open · '+repo.closed+' closed without merge';
    svg+=text(tx,titleY+(mobile?24:31),countText,mobile?12:15,'#6d8297');
    const note=config.contributions.find(item=>item.url.toLowerCase()===repo.url.toLowerCase())?.summary;
    if(note&&!mobile)svg+=paragraph(tx,titleY+57,note,670,14,'#8494a3',20,2).svg;
    y+=rowHeight;
    if(index<repositories.length-1)svg+='<path d="M'+x+' '+(y-10)+'H'+right+'" stroke="#e8edf2" fill="none"/>';
  }
  const activityY=y+20;
  svg+=text(x,activityY,'RECENT ACTIVITY',11,'#8393a2',{spacing:1.3});
  let ax=x+(mobile?137:182);
  const recent=activity.pullRequests.filter(p=>p.status==='open').slice(0,1).concat(activity.pullRequests.filter(p=>p.status==='merged').slice(0,1));
  for(const pr of recent){
    const state=pr.status==='merged'?'MERGED':'OPEN', color=pr.status==='merged'?'#5984ad':'#648f7c';
    svg+='<circle cx="'+ax+'" cy="'+(activityY-4)+'" r="3" fill="'+color+'"/>';
    svg+=link(ax+11,activityY,'PR #'+pr.number+' · '+state,pr.url,12,color);
    ax+=mobile?151:187;
  }
  return {svg,height:activityY-y0+35};
}
function verifyActivity(activity, config) {
  if (!activity || !config || activity.username !== config.username || !activity.counts) throw new TypeError('Activity and profile config are required');
  for (const key of ['merged', 'open', 'closed', 'mergedRepositories', 'publicProjects']) {
    if (!Number.isSafeInteger(activity.counts[key]) || activity.counts[key] < 0) throw new TypeError(`Invalid activity.counts.${key}`);
  }
  if (!Array.isArray(activity.projects) || !Array.isArray(activity.repositories) || !Array.isArray(activity.pullRequests)) throw new TypeError('Incomplete activity snapshot');
  for (const pr of activity.pullRequests) if (!['merged', 'open', 'closed'].includes(pr.status)) throw new TypeError('Invalid upstream PR state');
  for (const repo of activity.repositories) for (const key of ['merged', 'open', 'closed']) if (!Number.isSafeInteger(repo[key]) || repo[key] < 0) throw new TypeError(`Invalid ${key} repository PR count`);
  if (!config.research?.snapshot || !Array.isArray(config.research.directions)) throw new TypeError('Research snapshot is required');
}
export function renderProfile(activity, config, {mobile = false, animated = true, covers = {}} = {}) {
  verifyActivity(activity, config);
  if (!config.projects?.length) throw new TypeError('Select at least one featured project');
  const width = mobile ? 600 : 1200;
  const margin = mobile ? 38 : 60;
  const right = width - margin;
  let y = mobile ? 617 : 670;
  const heroHeight = mobile ? 640 : 690;
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+heroHeight+'" viewBox="0 0 '+width+' '+heroHeight+'"><rect width="'+width+'" height="'+heroHeight+'" fill="#fff"/>';
  svg += renderParticleArtwork('hero',0,0,width,mobile?480:heroHeight,{animated,fadeBottom:true,fit:'xMidYMid slice'});
  const mast = label(margin, mobile ? 48 : 48, 'AI ENGINEERING / MULTIMODAL LEARNING', mobile);
  svg += mast + text(right, mobile ? 48 : 48, `@${activity.username}`, mobile ? 13 : 13, '#d8e8f3', {anchor: 'end'});
  const title = mobile ? 60 : 96;
  svg += text(margin, mobile ? 137 : 205, config.name, title, ink, {weight: 600, spacing: mobile ? -3.2 : -5.2});
  svg += text(margin + 2, mobile ? 184 : 265, 'Multimodal learning.', mobile ? 23 : 30, '#627e96', {weight: 300, spacing: -.7});
  svg += text(margin + 2, mobile ? 216 : 302, 'Reproducible systems.', mobile ? 23 : 30, '#627e96', {weight: 300, spacing: -.7});
  const statY = mobile ? 495 : 606;
  const stats = [
    [String(activity.counts.merged), 'Merged upstream PRs'],
    [String(activity.counts.open), 'Open upstream PRs'],
    [String(activity.counts.publicProjects), 'Public projects']
  ];
  const gap = mobile ? 178 : 232;
  for (let i = 0; i < stats.length; i++) {
    const x = margin + i * gap;
    svg += text(x, statY, stats[i][0], mobile ? 36 : 46, ink, {weight: 400, spacing: -1.3});
    svg += text(x, statY + (mobile ? 24 : 27), stats[i][1], mobile ? 12 : 13, '#62778b');
    if (i > 0) svg += `<path d="M${x - 18} ${statY - 31}V${statY + (mobile ? 38 : 41)}" fill="none" stroke="#d8e2eb" stroke-width="1"/>`;
  }
  const stripBottom = mobile ? 540 : 653;
  svg += `<path d="M${margin} ${stripBottom}H${right}" fill="none" stroke="#edf1f5"/>`;
  svg += '</svg>';
  const research = featureSection(config, activity, mobile, animated);
  const projectStart = research.bottom + (mobile ? 47 : 42);
  const projects = renderProjectRows(activity, config, projectStart, mobile, covers, animated);
  const openStart = projectStart + projects.height + (projects.height ? (mobile ? 26 : 24) : 0);
  const open = renderOpenSource(activity, config, openStart, mobile, animated);
  const commitY = openStart + open.height + (mobile ? 61 : 50);
  const x = margin;
  const ruleTo = right;
  let foot = `<path d="M${x} ${commitY - 30}H${ruleTo}" fill="none" stroke="#e6ecf2"/>`;
  foot += label(x, commitY, 'Latest project activity', mobile);
  const commit = activity.projects.find(p => p.latestCommit)?.latestCommit;
  let bottom = commitY + 43;
  if (commit) {
    const project = activity.projects.find(p => p.latestCommit)?.name ?? 'Recent project update';
    const commitLines = wrap(`${safeDate(commit.date)} · ${project} · ${commit.message}`, width - margin * 2, mobile ? 13 : 14, 2);
    foot += flowingLink(x, bottom, `${safeDate(commit.date)} · ${project} · ${commit.message}`, commit.url, width - margin * 2, mobile ? 13 : 14, mid, mobile ? 19 : 20, 2);
    bottom += commitLines.length * (mobile ? 19 : 20) + (mobile ? 24 : 20);
  }
  const updated = safeDate(activity.updatedAt);
  bottom += mobile ? 18 : 13;
  foot += `<path d="M${x} ${bottom} Q${width / 2} ${bottom - 25} ${right} ${bottom}" fill="none" stroke="#dce6ef"/><path d="M${x} ${bottom} Q${width / 2} ${bottom - 25} ${right} ${bottom}" fill="none" stroke="#a7bed4" stroke-dasharray="1 14" class="flow"/>`;
  foot += text(x, bottom + 31, `GITHUB PUBLIC DATA · REFRESHED EVERY 6 HOURS · ${updated}`, mobile ? 10 : 11, '#8697a7', {spacing: .55});
  foot += text(x, bottom + 53, 'Development VALID only · Final TEST remains independent', mobile ? 11 : 12, '#8b9baa');
  const height = bottom + (mobile ? 75 : 70);
  const art = svg;
  const motion = animated ? `<style>${particleMotion}
@keyframes orbit-flow{to{stroke-dashoffset:-190}}
.flow{animation:orbit-flow 32s linear infinite;stroke-linecap:round}
@media(prefers-reduced-motion:reduce){.flow{animation:none!important}}
</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="profile-title profile-desc">
<title id="profile-title">${esc(config.name)} — multimodal learning and reproducible systems</title>
<desc id="profile-desc">${esc(config.bio)} ${activity.counts.merged} merged upstream pull requests and ${activity.counts.open} open. Research studies multimodal fusion on CH-SIMS v2.0. The full text version below includes live links and experiment limits.</desc>
<defs><linearGradient id="paper" x1="0" y1="0" x2=".92" y2="1"><stop stop-color="#f9fbfe"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#fbfdff"/></linearGradient><radialGradient id="nebula"><stop stop-color="#dceaf7" stop-opacity=".53"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
${motion}<rect width="${width}" height="${height}" fill="url(#paper)"/><ellipse cx="${width * .66}" cy="${mobile ? 1170 : 1110}" rx="${width * .54}" ry="270" fill="url(#nebula)" opacity=".2"/>
${art}<g>${research.svg}</g>${projects.svg}<g>${open.svg}</g><g>${foot}</g></svg>\n`;
}
