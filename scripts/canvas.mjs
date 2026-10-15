const esc = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const ink = '#26313d', muted = '#788795', pale = '#e7edf2', blue = '#788fae', violet = '#aca8c6';
const text = (x, y, value, size = 17, color = ink, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${esc(value)}</text>`;
const rule = (x, y, x2, y2, color = pale, extra = '') => `<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${color}" ${extra}/>`;
const label = (x, y, value, size = 12) => text(x, y, value.toUpperCase(), size, muted, 'font-weight="600" letter-spacing="1.55"');

function wrapLines(value, maxWidth, size) {
  const words = String(value ?? '').split(/\s+/).filter(Boolean);
  const maxChars = Math.max(12, Math.floor(maxWidth / (size * 0.53)));
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function paragraph(x, y, value, width, size = 17, color = muted, leading = size * 1.5) {
  const lines = wrapLines(value, width, size);
  return { svg: lines.map((line, i) => text(x, y + i * leading, line, size, color)).join(''), bottom: y + Math.max(0, lines.length - 1) * leading, lines };
}

function dateUtc(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'DATE UNAVAILABLE';
  return new Date(value).toISOString().slice(0, 10) + ' UTC';
}

function orbit(x, y, width, animated) {
  const d = `M${x} ${y + 10} C${x + width * .23} ${y - 22} ${x + width * .47} ${y + 27} ${x + width * .7} ${y + 4} S${x + width * .9} ${y - 13} ${x + width} ${y + 8}`;
  let svg = `<path d="${d}" fill="none" stroke="${blue}" stroke-opacity=".12" stroke-width="1.2"/><path d="${d}" fill="none" stroke="${violet}" stroke-opacity=".52" stroke-width="1" stroke-dasharray="1 13" stroke-linecap="round" ${animated ? 'class="drift"' : ''}/>`;
  for (let i = 0; i < 34; i++) {
    const px = x + width * i / 33;
    const py = y + 6 + Math.sin(i * .31) * 12;
    svg += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${i % 7 === 0 ? 1.5 : .8}" fill="${i % 2 ? blue : violet}" opacity="${i % 3 ? '.24' : '.42'}"/>`;
  }
  return svg;
}

function contributionGauge(x, y, count, radius, mobile, animated) {
  const r = radius;
  const number = String(count).padStart(2, '0');
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fbfcff" fill-opacity=".6" stroke="#e8edf3" stroke-width="1"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${blue}" stroke-opacity=".52" stroke-width="1.4" stroke-dasharray="${r * 4.85} ${r * 1.5}" transform="rotate(130 ${x} ${y})"/>${animated ? `<circle cx="${x}" cy="${y}" r="${r + 8}" fill="none" stroke="${violet}" stroke-opacity=".3" stroke-width="1" stroke-dasharray="2 17" class="orbit"/>` : ''}${text(x, y + (mobile ? 23 : 29), number, mobile ? 88 : 116, blue, 'text-anchor="middle" font-weight="400" letter-spacing="-5"')}${text(x, y + (mobile ? 49 : 70), 'MERGED UPSTREAM PRS', mobile ? 11 : 12, muted, 'text-anchor="middle" letter-spacing="1.1"')}`;
}

function externalLink(x, y, title, href, size, maxWidth, color = ink, weight = '400') {
  const safe = /^https:\/\//.test(href ?? '') ? esc(href) : '#';
  const p = paragraph(x, y, title, maxWidth, size, color);
  const lines = p.lines.map((line, i) => `<text x="${x}" y="${y + i * size * 1.5}" font-size="${size}" fill="${color}" font-weight="${weight}"><a href="${safe}">${esc(line)}</a></text>`).join('');
  return { svg: lines, bottom: p.bottom };
}

function recentStatus(status) {
  return status === 'merged' ? 'MERGED' : status === 'open' ? 'OPEN' : 'CLOSED WITHOUT MERGE';
}

function projectSection(config, data, x, y, width, mobile, animated) {
  const project = config.projects?.[0];
  let svg = label(x, y, 'Selected research');
  if (!project) return { svg: svg + text(x, y + 38, 'No project configured.', mobile ? 19 : 17, muted), bottom: y + 50 };
  const title = externalLink(x, y + 44, project.name, project.url, mobile ? 25 : 23, width, ink, '600');
  svg += title.svg;
  const desc = paragraph(x, title.bottom + 35, project.description, width, mobile ? 19 : 17, muted, mobile ? 29 : 26);
  svg += desc.svg;
  let cursor = desc.bottom + 43;
  const flowY = cursor;
  svg += label(x, flowY, 'Research flow');
  cursor += 28;
  const flowSize = mobile ? 19 : 17;
  const jointX = x + width * .59, jointY = cursor + 30, endX = x + width - 4;
  ['TEXT', 'AUDIO', 'VISION'].forEach((name, i) => {
    const py = cursor + i * 30;
    svg += text(x, py, name, flowSize - 2, muted, 'letter-spacing=".8"');
    svg += '<path d="M' + (x + 87) + ' ' + (py - 5) + 'C' + (jointX - 75) + ' ' + (py - 5) + ' ' + (jointX - 45) + ' ' + jointY + ' ' + jointX + ' ' + jointY + '" fill="none" stroke="' + blue + '" stroke-opacity=".32"/>';
  });
  svg += '<circle cx="' + jointX + '" cy="' + jointY + '" r="4" fill="' + blue + '"/>';
  svg += text(jointX, jointY + 34, 'FUSION', flowSize - 2, blue, 'text-anchor="middle"');
  svg += '<path d="M' + (jointX + 9) + ' ' + jointY + 'H' + endX + '" fill="none" stroke="' + blue + '" stroke-opacity=".4" ' + (animated ? 'stroke-dasharray="2 11" class="drift"' : '') + '/>';
  svg += text(endX, jointY - 16, 'SENTIMENT', flowSize - 2, muted, 'text-anchor="end"');
  cursor += 105;
  const snapshot = config.research?.snapshot;
  if (snapshot) {
    cursor += 6;
    svg += rule(x, cursor, x + width, cursor); cursor += 34;
    svg += label(x, cursor, `VALID study · ${dateUtc(snapshot.asOf)}`); cursor += 31;
    const summary = paragraph(x, cursor, snapshot.summary, width, mobile ? 19 : 17, ink, mobile ? 29 : 26);
    svg += summary.svg; cursor = summary.bottom + 34;
    for (const metric of snapshot.metrics ?? []) {
      const row = paragraph(x, cursor, metric.name, width, mobile ? 19 : 17, muted, mobile ? 28 : 25);
      svg += row.svg;
      svg += text(x, row.bottom + 34, metric.score, mobile ? 28 : 26, blue, 'font-weight="400" letter-spacing=".2"');
      cursor = row.bottom + 74;
    }
    cursor += 13;
    const protocol = paragraph(x, cursor, snapshot.protocol, width, mobile ? 18 : 16, muted, mobile ? 27 : 24);
    svg += protocol.svg; cursor = protocol.bottom + 32;
    const conclusion = paragraph(x, cursor, snapshot.conclusion, width, mobile ? 18 : 16, ink, mobile ? 27 : 24);
    svg += conclusion.svg; cursor = conclusion.bottom + 30;
    const pending = paragraph(x, cursor, snapshot.pending, width, mobile ? 16 : 14, muted, mobile ? 23 : 20);
    svg += pending.svg; cursor = pending.bottom + 10;
  }
  return { svg, bottom: cursor };
}

function contributionSection(config, data, x, y, width, mobile) {
  let svg = label(x, y, 'Upstream contributions');
  let cursor = y + 43;
  for (const contribution of config.contributions ?? []) {
    const repo = data.repositories?.find(item => item.repo.toLowerCase() === contribution.url.replace('https://github.com/', '').toLowerCase());
    const title = externalLink(x, cursor, contribution.repo, contribution.url, mobile ? 23 : 21, width, ink, '600');
    svg += title.svg; cursor = title.bottom + 32;
    if (!repo || !['merged', 'open', 'closed'].every(key => Number.isSafeInteger(repo[key]) && repo[key] >= 0)) throw new Error(`Missing verified pull request counts for ${contribution.repo}`);
    svg += text(x, cursor, `${repo.merged} merged · ${repo.open} open · ${repo.closed} closed without merge`, mobile ? 18 : 16, blue, 'font-weight="600"'); cursor += 29;
    const summary = paragraph(x, cursor, contribution.summary, width, mobile ? 19 : 17, muted, mobile ? 28 : 25);
    svg += summary.svg; cursor = summary.bottom + 31;
    for (const pr of contribution.prs ?? []) {
      const record = data.pullRequests?.find(item => item.url === pr.url);
      if (!record || record.status !== 'merged') throw new Error(`Selected contribution is not verified merged: ${pr.url}`);
      const linked = externalLink(x + 18, cursor, `${pr.label} · ${dateUtc(record.eventAt)}`, pr.url, mobile ? 18 : 16, width - 18, ink);
      svg += `<circle cx="${x + 3}" cy="${cursor - 5}" r="2.5" fill="${blue}"/>${linked.svg}`;
      cursor = linked.bottom + (mobile ? 32 : 28);
    }
  }
  const selected = new Set((config.contributions ?? []).map(item => item.url.toLowerCase()));
  for (const repo of data.repositories ?? []) {
    if (selected.has(repo.url.toLowerCase())) continue;
    cursor += 30;
    const name = config.activity?.repositoryLabels?.[repo.repo] ?? repo.repo;
    const title = externalLink(x, cursor, name, repo.url, mobile ? 23 : 21, width, ink, '600');
    svg += title.svg;
    const states = paragraph(x, title.bottom + 32, `${repo.merged} merged · ${repo.open} open · ${repo.closed} closed without merge`, width, mobile ? 18 : 16, blue);
    svg += states.svg;
    cursor = states.bottom + 24;
  }
  const recent = (data.pullRequests ?? []).slice(0, 3);
  if (recent.length) {
    cursor += 15; svg += rule(x, cursor, x + width, cursor); cursor += 34;
    svg += label(x, cursor, 'Recent upstream activity'); cursor += 33;
    for (const pr of recent) {
      const repoName = config.activity?.repositoryLabels?.[pr.repo] ?? pr.repo;
      svg += text(x, cursor, `${dateUtc(pr.updatedAt)}  ·  ${recentStatus(pr.status)}`, mobile ? 13 : 12, muted, 'letter-spacing=".35"'); cursor += mobile ? 27 : 23;
      const item = externalLink(x, cursor, `${repoName} #${pr.number} — ${pr.title}`, pr.url, mobile ? 19 : 17, width, ink);
      svg += item.svg; cursor = item.bottom + (mobile ? 25 : 20);
    }
  }
  return { svg, bottom: cursor };
}

function statsStrip(data, x, y, width, mobile) {
  const stats = [
    ['Open upstream PRs', data.counts.open],
    ['Merged repositories', data.counts.mergedRepositories],
    ['Public projects', data.counts.publicProjects],
  ];
  let svg = rule(x, y, x + width, y);
  const slot = width / stats.length;
  stats.forEach(([name, value], i) => {
    const px = x + i * slot + (mobile ? 0 : 8);
    svg += text(px, y + (mobile ? 44 : 47), String(value), mobile ? 31 : 34, ink, 'font-weight="400"');
    svg += text(px, y + (mobile ? 69 : 74), name, mobile ? 14 : 14, muted);
    if (i) svg += rule(x + i * slot - 20, y + 17, x + i * slot - 20, y + 83, pale);
  });
  svg += rule(x, y + 98, x + width, y + 98);
  return { svg, bottom: y + 98 };
}

function spaceField(width, heroTop, animated) {
  const cx = width * .79, cy = heroTop + 87;
  let result = `<ellipse cx="${cx}" cy="${cy}" rx="${width * .55}" ry="220" fill="url(#mist)" opacity=".44"/>`;
  result += `<g transform="translate(${cx} ${cy}) rotate(-18)" fill="none" stroke="#c3d0df" stroke-width=".8" opacity=".18">`;
  for (let i = 0; i < 4; i++) result += `<ellipse rx="${width * (.26 + i * .035)}" ry="${70 + i * 17}"/>`;
  result += '</g>';
  for (let i = 0; i < 37; i++) {
    const x = 24 + (i * 137.51) % (width - 48);
    const y = 26 + (i * i * 31.7) % (heroTop + 268);
    result += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 8 === 0 ? 1.5 : .8}" fill="#9daec5" opacity=".2"/>`;
  }
  result += `<path d="M${width * .04} ${heroTop + 310}Q${width * .5} ${heroTop + 260} ${width * .96} ${heroTop + 310}" fill="none" stroke="#ccd7e6" stroke-opacity=".23" ${animated ? 'class="drift" stroke-dasharray="1 19"' : ''}/>`;
  return result;
}

export function renderProfile(activity, config, { mobile = false, animated = true } = {}) {
  if (!activity || !config || !activity.counts || !Array.isArray(config.projects) || !Array.isArray(config.contributions)) throw new TypeError('activity and profile config are required');
  for (const key of ['merged', 'open', 'closed', 'mergedRepositories', 'publicProjects']) {
    if (!Number.isSafeInteger(activity.counts[key]) || activity.counts[key] < 0) throw new TypeError(`Invalid activity.counts.${key}`);
  }
  const width = mobile ? 600 : 1200;
  const margin = mobile ? 30 : 56;
  const inner = width - margin * 2;
  const updated = dateUtc(activity.updatedAt);
  let svg = `<rect width="${width}" height="1" fill="#fff"/>`;
  svg += label(margin, 48, 'Public builder profile') + text(width - margin, 48, `@${activity.username}`, 12, muted, 'text-anchor="end" letter-spacing=".8"');
  svg += text(margin, mobile ? 119 : 126, config.name.toUpperCase(), mobile ? 49 : 64, ink, 'font-weight="600" letter-spacing="-1.8"');
  svg += text(margin, mobile ? 158 : 168, '', mobile ? 20 : 22, blue);
  const tagline = paragraph(margin, mobile ? 158 : 168, config.tagline, inner, mobile ? 21 : 22, blue, mobile ? 30 : 32);
  svg += tagline.svg;
  const bio = paragraph(margin, tagline.bottom + 42, config.bio, inner, mobile ? 19 : 17, muted, mobile ? 28 : 25);
  svg += bio.svg;
  let y = bio.bottom + (mobile ? 46 : 52);
  svg += rule(margin, y, width - margin, y);
  const heroTop = y + 43;
  svg += label(margin, heroTop, 'Contribution record');
  let afterHero;
  if (mobile) {
    const gaugeX = width / 2;
    const gaugeY = heroTop + 139;
    svg += contributionGauge(gaugeX, gaugeY, activity.counts.merged, 81, true, animated);
    svg += orbit(margin, heroTop + 239, inner, animated);
    let dy = heroTop + 330;
    svg += label(margin, dy, 'Current research directions'); dy += 37;
    for (const direction of config.research?.directions ?? []) {
      const heading = externalLink(margin, dy, direction.name, direction.url, 20, inner, ink, '600');
      svg += heading.svg;
      const body = paragraph(margin, heading.bottom + 27, direction.summary, inner, 19, muted, 28);
      svg += body.svg; dy = body.bottom + 34;
    }
    const stat = statsStrip(activity, margin, dy + 10, inner, true); svg += stat.svg;
    afterHero = stat.bottom + 48;
  } else {
    const gaugeX = margin + 166;
    const gaugeY = heroTop + 166;
    svg += contributionGauge(gaugeX, gaugeY, activity.counts.merged, 106, false, animated);
    svg += orbit(margin, heroTop + 293, 520, animated);
    const dx = 660;
    let dy = heroTop + 3;
    svg += label(dx, dy, 'Current research directions'); dy += 43;
    for (const direction of config.research?.directions ?? []) {
      const heading = externalLink(dx, dy, direction.name, direction.url, 18, 475, ink, '600');
      svg += heading.svg;
      const body = paragraph(dx, heading.bottom + 28, direction.summary, 475, 17, muted, 25);
      svg += body.svg; dy = body.bottom + 31;
    }
    const stripY = Math.max(heroTop + 337, dy + 10);
    const stat = statsStrip(activity, margin, stripY, inner, false); svg += stat.svg;
    afterHero = stat.bottom + 52;
  }

  let left, right, bottom;
  if (mobile) {
    left = projectSection(config, activity, margin, afterHero, inner, true, animated);
    let next = left.bottom + 50;
    svg += rule(margin, next - 22, width - margin, next - 22);
    right = contributionSection(config, activity, margin, next, inner, true);
    bottom = right.bottom;
  } else {
    const gap = 84;
    const col = (inner - gap) / 2;
    left = projectSection(config, activity, margin, afterHero, col, false, animated);
    svg += rule(margin + col + gap / 2, afterHero, margin + col + gap / 2, Math.max(left.bottom, afterHero + 500), '#edf0f4');
    right = contributionSection(config, activity, margin + col + gap, afterHero, col, false);
    bottom = Math.max(left.bottom, right.bottom);
  }
  svg += left.svg + right.svg;

  let footerY = bottom + (mobile ? 46 : 52);
  if (activity.projects?.length) {
    svg += rule(margin, footerY - 22, width - margin, footerY - 22);
    svg += label(margin, footerY, 'Latest project commit');
    let cy = footerY + 32;
    for (const project of activity.projects) {
      if (!project.latestCommit) continue;
      const repoLabel = project.repo;
      const commitLine = `${dateUtc(project.latestCommit.date)} · ${repoLabel} · ${project.latestCommit.message}`;
      const link = externalLink(margin, cy, commitLine, project.latestCommit.url, mobile ? 16 : 14, inner, muted);
      svg += link.svg; cy = link.bottom + (mobile ? 24 : 20);
    }
    footerY = cy + 12;
  }
  const height = footerY + (mobile ? 126 : 88);
  svg += '<path d="M' + margin + ' ' + footerY + 'Q' + (width / 2) + ' ' + (footerY - 28) + ' ' + (width - margin) + ' ' + footerY + '" fill="none" stroke="#dfe7ee"/>';
  svg += text(margin, footerY + 30, 'PUBLIC GITHUB DATA / REFRESHED EVERY 6 HOURS', mobile ? 12 : 11, muted, 'letter-spacing=".55"');
  svg += text(mobile ? margin : width - margin, footerY + (mobile ? 55 : 30), 'UPDATED ' + updated, mobile ? 12 : 11, muted, mobile ? '' : 'text-anchor="end"');
  svg += text(margin, footerY + (mobile ? 81 : 56), 'VALID is development-only; final TEST remains independent.', mobile ? 13 : 12, muted);
  svg += text(margin, footerY + (mobile ? 104 : 76), 'Upstream excludes own repositories. Motion is illustrative.', mobile ? 12 : 11, muted);

  const css = animated ? '<style>text{font-family:Inter,Arial,Helvetica,sans-serif}.drift,.orbit{animation:drift 28s linear infinite}@keyframes drift{to{stroke-dashoffset:-80}}@media(prefers-reduced-motion:reduce){.drift,.orbit{animation:none}}</style>' : '<style>text{font-family:Inter,Arial,Helvetica,sans-serif}</style>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="profile-title profile-desc"><title id="profile-title">${esc(config.name)} — multimodal research and public work</title><desc id="profile-desc">${esc(config.bio)} ${activity.counts.merged} merged upstream pull requests, ${activity.counts.open} open upstream pull requests, ${activity.counts.mergedRepositories} repositories with merged contributions, and ${activity.counts.publicProjects} public projects.</desc>${css}<defs><linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".54" stop-color="#fcfdff"/><stop offset="1" stop-color="#fff"/></linearGradient><radialGradient id="mist"><stop stop-color="#eef1f9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="${width}" height="${height}" fill="url(#paper)"/>${spaceField(width, heroTop, animated)}${svg}</svg>\n`;
}
