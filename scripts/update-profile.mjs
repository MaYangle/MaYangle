import {readFile, writeFile, rename, mkdir, unlink} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {renderReadme, renderTextVersion} from './readme.mjs';
import {renderProfile} from './canvas.mjs';
import {collectActivity, createApi} from './data.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function optionalJson(path) {
  try {return JSON.parse(await readFile(path, 'utf8'));}
  catch (error) {if (error.code !== 'ENOENT') throw error; return null;}
}
function coverMime(path) {return path.endsWith('.png') ? 'image/png' : 'image/jpeg';}
function validateCover(path, base64) {
  if (typeof base64 !== 'string') return null;
  const normalized = base64.replace(/\s/g, '');
  if (normalized.length > 260_000 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(normalized)) return null;
  const bytes = Buffer.from(normalized, 'base64');
  const valid = path.endsWith('.png')
    ? bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return valid ? bytes : null;
}
async function loadProjectCovers(activity, api, directory, offline, previous) {
  const covers = {};
  const records = [];
  const limited = activity.projects.filter(project => project.coverPath);
  if (!limited.length) return {covers, records};
  if (offline) {
    const manifest = await optionalJson(join(directory, 'assets/generated/manifest.json')) ?? {current: [], previous: []};
    for (const file of [...manifest.current, ...manifest.previous]) {
      if (!/^assets\/generated\/profile(?:-mobile)?(?:-still)?\.[a-f0-9]{12}\.svg$/.test(file)) continue;
      const svg = await readFile(join(directory, file), 'utf8').catch(() => '');
      const pattern = /<image data-cover-repo="([\w.-]+\/[\w.-]+)" data-cover-path="([^"<>]+)" data-cover-sha="([a-f0-9]{64})" href="data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)"\s*\/>/g;
      for (const match of svg.matchAll(pattern)) {
        const [, repo, path, sha, mime, encoded] = match;
        const bytes = validateCover(path, encoded);
        if (bytes && mime === coverMime(path) && createHash('sha256').update(bytes).digest('hex') === sha) covers[repo] ??= {path, sha, bytes};
      }
    }
    for (const project of limited) if (covers[project.repo]) records.push({repo: project.repo, path: covers[project.repo].path, sha: covers[project.repo].sha});
    return {covers, records};
  }
  let total = 0;
  for (const project of limited) {
    const path = project.coverPath;
    if (!['.github/profile-cover.png','.github/profile-cover.jpg','assets/profile-cover.png','assets/profile-cover.jpg'].includes(path)) throw new Error(`Unexpected project cover path for ${project.repo}`);
    const item = await api(`repos/${project.repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`);
    if (item?.type !== 'file' || item.encoding !== 'base64' || item.path !== path) throw new Error(`Invalid project cover response for ${project.repo}`);
    const bytes = validateCover(path, item.content);
    if (!bytes) continue;
    total += bytes.length;
    if (total > 600_000) continue;
    const sha = createHash('sha256').update(bytes).digest('hex');
    covers[project.repo] = {path, sha, bytes};
    records.push({repo: project.repo, path, sha});
  }
  return {covers, records};
}
export async function updateProfile({directory = root, api = createApi(), offline = false, now = () => new Date(), collect = collectActivity} = {}) {
  const config = JSON.parse(await readFile(join(directory, 'profile.config.json'), 'utf8'));
  const previous = await optionalJson(join(directory, 'data/activity.json'));
  let activity;
  let coverData;
  if (offline) {
    if (!previous) throw new Error('No saved activity snapshot. Run an online refresh first.');
    activity = previous;
    coverData = (await loadProjectCovers(activity, api, directory, true, previous)).covers;
  } else {
    const fresh = await collect(config, api);
    const loaded = await loadProjectCovers(fresh, api, directory, false, previous);
    coverData = loaded.covers;
    fresh.projectCovers = loaded.records;
    const {updatedAt, ...oldData} = previous ?? {};
    activity = {...fresh, updatedAt: isDeepStrictEqual(fresh, oldData) ? updatedAt : now().toISOString()};
  }
  renderTextVersion(config, activity);
  const files = new Map();
  const assets = {};
  for (const [key, animated, mobile] of [['desktop', true, false], ['still', false, false], ['mobile', true, true], ['mobileStill', false, true]]) {
    const covers = Object.fromEntries(Object.entries(coverData ?? {}).map(([repo, cover]) => [repo, {...cover, uri: `data:${coverMime(cover.path)};base64,${cover.bytes.toString('base64')}`} ]));
    const svg = renderProfile(activity, config, {animated, mobile, covers});
    const hash = createHash('sha256').update(svg).digest('hex').slice(0, 12);
    const file = `assets/generated/profile${mobile ? '-mobile' : ''}${animated ? '' : '-still'}.${hash}.svg`;
    assets[key] = file;
    files.set(file, svg);
  }
  // Complete collection and rendering before changing any published output.
  const content = renderReadme(config, activity, assets);
  const oldManifest = await optionalJson(join(directory, 'assets/generated/manifest.json')) ?? {current: [], previous: []};
  const current = Object.values(assets);
  const manifest = {current, previous: isDeepStrictEqual(current, oldManifest.current) ? oldManifest.previous : oldManifest.current};
  files.set('README.md', content);
  files.set('data/activity.json', JSON.stringify(activity, null, 2) + '\n');
  files.set('assets/generated/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
  for (const [file, value] of files) {
    await mkdir(dirname(join(directory, file)), {recursive: true});
    await writeFile(join(directory, file + '.tmp'), value);
  }
  // Keep the immediately preceding image pair for cached README copies.
  for (const file of files.keys()) await rename(join(directory, file + '.tmp'), join(directory, file));
  const retained = new Set([...manifest.current, ...manifest.previous]);
  for (const file of new Set([...oldManifest.current, ...oldManifest.previous])) {
    if (/^assets\/generated\/(?:profile|summary|research)(?:-mobile)?(?:-still)?\.[a-f0-9]{12}\.svg$/.test(file) && !retained.has(file)) {
      try {await unlink(join(directory, file));} catch (error) {if (error.code !== 'ENOENT') throw error;}
    }
  }
  return {activity, content, assets};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  updateProfile({offline: process.argv.includes('--offline')}).then(({activity}) => {
    console.log(`Updated profile: ${activity.counts.merged} merged, ${activity.counts.open} open upstream PRs.`);
  }).catch(error => {console.error(error.message); process.exitCode = 1;});
}
