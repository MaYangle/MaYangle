import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {renderReadme} from '../scripts/readme.mjs';
import {updateProfile} from '../scripts/update-profile.mjs';
const config = JSON.parse(await readFile(new URL('../profile.config.json', import.meta.url), 'utf8'));

test('curated profile has direct evidence links and no dashboard or placeholders', () => {
  const output = renderReadme(config);
  assert.match(output, /^# Yangle Ma$/m);
  assert.match(output, /## Selected work/);
  assert.match(output, /## Open source/);
  for (const project of config.projects) {
    assert.ok(output.includes(project.url));
    for (const item of project.links) assert.ok(output.includes(item.url));
  }
  for (const contribution of config.contributions) for (const pr of contribution.prs) assert.ok(output.includes(pr.url));
  assert.doesNotMatch(output, /<img|<picture|\.svg|No public entry|undefined|Merged PR Diffs/);
  assert.equal(output, renderReadme(config));
});
test('rejects invalid content and unsafe destinations', () => {
  assert.throws(() => renderReadme({...config, name: undefined}), /name/);
  assert.throws(() => renderReadme({...config, links: {Email: 'javascript:alert(1)'}}), /contact/);
  const changed = structuredClone(config);
  changed.projects[0].url = 'http://example.com';
  assert.throws(() => renderReadme(changed), /project/);
});
test('valid generation updates README, invalid configuration preserves it', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'profile-test-'));
  try {
    await writeFile(join(directory, 'profile.config.json'), JSON.stringify(config));
    const expected = renderReadme(config);
    await updateProfile({directory});
    assert.equal(await readFile(join(directory, 'README.md'), 'utf8'), expected);
    await writeFile(join(directory, 'profile.config.json'), JSON.stringify({...config, name: null}));
    await assert.rejects(updateProfile({directory}), /name/);
    assert.equal(await readFile(join(directory, 'README.md'), 'utf8'), expected);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
