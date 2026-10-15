import {readFile, writeFile, rename} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderReadme} from './readme.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export async function updateProfile({directory = root} = {}) {
  const config = JSON.parse(await readFile(join(directory, 'profile.config.json'), 'utf8'));
  const content = renderReadme(config);
  const target = join(directory, 'README.md');
  await writeFile(target + '.tmp', content);
  await rename(target + '.tmp', target);
  return content;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  updateProfile().then(() => console.log('Updated Markdown profile.')).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
