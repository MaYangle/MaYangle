import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { renderSheet } from './sheet.mjs';

const FIXTURE = process.argv.includes('--fixture')
  ? process.argv[process.argv.indexOf('--fixture') + 1]
  : null;

const data = FIXTURE
  ? JSON.parse(await readFile(FIXTURE, 'utf8'))
  : await (await import('./collect.mjs')).collect();

const { desktop, mobile } = renderSheet(data);

await mkdir('assets', { recursive: true });
await writeFile('assets/sheet.svg', desktop);
await writeFile('assets/sheet-mobile.svg', mobile);

const kb = (s) => (Buffer.byteLength(s) / 1024).toFixed(1);
console.log(
  `sheet.svg ${kb(desktop)} KB · sheet-mobile.svg ${kb(mobile)} KB · ` +
  `${data.arms.length} arms · gate ${data.gate}`
);
