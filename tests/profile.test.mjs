import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {renderReadme} from '../scripts/readme.mjs';
import {renderProfile} from '../scripts/canvas.mjs';
import {updateProfile} from '../scripts/update-profile.mjs';
const config = JSON.parse(await readFile(new URL('../profile.config.json', import.meta.url), 'utf8'));
const assets = {
  desktop: 'assets/generated/profile.aaaaaaaaaaaa.svg',
  still: 'assets/generated/profile-still.aaaaaaaaaaaa.svg',
  mobile: 'assets/generated/profile-mobile.aaaaaaaaaaaa.svg',
  mobileStill: 'assets/generated/profile-mobile-still.aaaaaaaaaaaa.svg'
};
function fixture() {
  const repo = '19376357/Bilingual-Multimodal-Sentiment-Analysis';
  const pullRequests = config.contributions.flatMap(item => item.prs.map((pr, i) => ({repo, number: 7 - i * 2, title: 'Verified fix', url: pr.url, status: 'merged', updatedAt: '2025-08-31T12:00:00Z', eventAt: '2025-08-31T12:00:00Z'})));
  pullRequests.push({repo: 'another/project', number: 10, title: 'A closed PR | <not merged>', url: 'https://github.com/another/project/pull/10', status: 'closed', updatedAt: '2026-10-13T12:00:00Z', eventAt: '2026-10-13T12:00:00Z'});
  pullRequests.push({repo: 'another/project', number: 11, title: 'An open contribution', url: 'https://github.com/another/project/pull/11', status: 'open', updatedAt: '2026-10-14T12:00:00Z', eventAt: '2026-10-14T12:00:00Z'});
  return {username: config.username, counts: {merged: 2, open: 1, closed: 1, mergedRepositories: 1, publicProjects: 1},
    queries: {merged: 'author:MaYangle is:pr is:public -user:MaYangle is:merged'},
    repositories: [{repo, url: `https://github.com/${repo}`, merged: 2, open: 0, closed: 0}, {repo: 'another/project', url: 'https://github.com/another/project', merged: 0, open: 1, closed: 1}],
    pullRequests,
    projects: [{repo: 'MaYangle/Multimodal-Sentiment-Fusion', url: config.projects[0].url, latestCommit: {sha: 'a'.repeat(40), url: `${config.projects[0].url}/commit/${'a'.repeat(40)}`, message: 'Record controlled experiments', date: '2026-10-14T12:00:00Z'}}]};
}
const withDate = () => ({...fixture(), updatedAt: '2026-10-15T00:00:00.000Z'});

test('profile exposes research evidence, PR states, dates and accessible image alternatives', () => {
  const output = renderReadme(config, withDate(), assets);
  assert.equal((output.match(/<picture>/g) ?? []).length, 1);
  assert.equal((output.match(/<img /g) ?? []).length, 1);
  assert.ok(output.indexOf('<details>') < output.indexOf('## Research & engineering'));
  assert.match(output, /Research & engineering/);
  assert.match(output, /Text version, sources & contribution links/);
  assert.match(output, /27\/27 fits/);
  assert.match(output, /Development VALID only/);
  assert.match(output, /0\.378497/);
  assert.match(output, /Closed without merge/);
  assert.match(output, /&lt;not merged&gt;/);
  assert.match(output, /prefers-reduced-motion/);
  assert.match(output, /max-width: 600px/);
  assert.match(output, /2026-10-15 00:00 UTC/);
  for (const project of config.projects) for (const item of project.links) assert.ok(output.includes(item.url));
  assert.doesNotMatch(output, /No public entry|undefined|Merged PR Diffs/);
});
test('selected contribution must still be verified as merged', () => {
  const activity = withDate();
  activity.pullRequests[0].status = 'closed';
  assert.throws(() => renderReadme(config, activity, assets), /verified merged/);
});
test('rejects missing data and unsafe contact destinations', () => {
  assert.throws(() => renderReadme({...config, name: undefined}, withDate(), assets), /name/);
  assert.throws(() => renderReadme({...config, links: {Email: 'javascript:alert(1)'}}, withDate(), assets), /contact/);
  assert.throws(() => renderProfile({...withDate(), counts: {}}, config), /counts/);
  assert.throws(() => renderReadme(config, {...withDate(), username: 'someone-else'}, assets), /match profile/);
});
test('SVGs stay self-contained and reduced-motion variants remove animation', () => {
  for (const mobile of [false, true]) {
    const animated = renderProfile(withDate(), config, {mobile});
    const still = renderProfile(withDate(), config, {animated: false, mobile});
    assert.match(animated, /@keyframes/);
    assert.doesNotMatch(still, /@keyframes|animation:|<animate/);
    assert.doesNotMatch(animated, /<script|<foreignObject|<image|<filter/);
    assert.match(animated, /SELECTED RESEARCH/);
    assert.match(animated, /UPSTREAM CONTRIBUTIONS/);
    assert.match(animated, /0\.378497/);
    assert.match(animated, /closed without merge/i);
    assert.match(still, /width="(?:600|1200)"/);
  }
});
test('unchanged data creates no timestamp churn and can regenerate offline', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'profile-test-'));
  try {
    await writeFile(join(directory, 'profile.config.json'), JSON.stringify(config));
    const first = await updateProfile({directory, collect: async () => fixture(), now: () => new Date('2026-10-15T00:00:00Z')});
    const second = await updateProfile({directory, collect: async () => fixture(), now: () => new Date('2026-10-16T00:00:00Z')});
    assert.deepEqual(second, first);
    const offline = await updateProfile({directory, offline: true, collect: () => {throw new Error('Offline must not fetch');}});
    assert.deepEqual(offline, first);
    assert.equal(await readFile(join(directory, 'README.md'), 'utf8'), first.content);
  } finally {await rm(directory, {recursive: true, force: true});}
});
test('API failure and invalid config preserve all previously published output', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'profile-test-'));
  try {
    await writeFile(join(directory, 'profile.config.json'), JSON.stringify(config));
    const first = await updateProfile({directory, collect: async () => fixture()});
    const paths = ['README.md', 'data/activity.json', 'assets/generated/manifest.json', ...Object.values(first.assets)];
    const before = await Promise.all(paths.map(file => readFile(join(directory, file), 'utf8')));
    await assert.rejects(updateProfile({directory, collect: async () => {throw new Error('Incomplete GitHub data');}}), /Incomplete/);
    await writeFile(join(directory, 'profile.config.json'), JSON.stringify({...config, name: null}));
    await assert.rejects(updateProfile({directory, collect: async () => fixture()}), /name/);
    assert.deepEqual(await Promise.all(paths.map(file => readFile(join(directory, file), 'utf8'))), before);
  } finally {await rm(directory, {recursive: true, force: true});}
});
