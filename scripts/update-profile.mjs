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
export async function updateProfile({directory = root, api = createApi(), offline = false, now = () => new Date(), collect = collectActivity} = {}) {
  const config = JSON.parse(await readFile(join(directory, 'profile.config.json'), 'utf8'));
  const previous = await optionalJson(join(directory, 'data/activity.json'));
  let activity;
  if (offline) {
    if (!previous) throw new Error('No saved activity snapshot. Run an online refresh first.');
    activity = previous;
  } else {
    const fresh = await collect(config, api);
    const {updatedAt, ...oldData} = previous ?? {};
    activity = {...fresh, updatedAt: isDeepStrictEqual(fresh, oldData) ? updatedAt : now().toISOString()};
  }
  renderTextVersion(config, activity);
  const files = new Map();
  const assets = {};
  for (const [key, animated, mobile] of [['desktop', true, false], ['still', false, false], ['mobile', true, true], ['mobileStill', false, true]]) {
    const svg = renderProfile(activity, config, {animated, mobile});
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
