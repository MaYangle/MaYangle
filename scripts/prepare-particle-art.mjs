import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {dirname, resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';

// One-time build tool; regular GitHub refreshes use only the generated JSON.
export async function prepareParticleArt(source, output, sharp) {
  const original = await readFile(source);
  const meta = await sharp(original).metadata();
  if (meta.width !== 1024 || meta.height !== 1536) throw new Error('Expected the approved 1024 × 1536 reference composition.');
  const selections = {
    hero: {left: 0, top: 0, width: 1024, height: 660},
    fusion: {left: 530, top: 704, width: 494, height: 350},
    landscape: {left: 60, top: 1118, width: 374, height: 100},
    orbital: {left: 60, top: 1253, width: 374, height: 100}
  };
  const regions = {};
  for (const [name, bounds] of Object.entries(selections)) {
    const step = 2.5;
    const columns = Math.ceil(bounds.width / step), rows = Math.ceil(bounds.height / step);
    const quantized = await sharp(original).extract(bounds).resize(columns, rows, {fit: 'fill'})
      .png({palette: true, colours: 256, dither: .3, effort: 8}).toBuffer();
    const {data, info} = await sharp(quantized).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject: true});
    if (info.channels !== 3) throw new Error(`Unexpected RGB sampling for ${name}`);
    const palette = [], byColor = new Map(), indices = Buffer.alloc(columns * rows);
    for (let i = 0; i < columns * rows; i++) {
      const color = data.subarray(i * 3, i * 3 + 3).toString('hex');
      if (!byColor.has(color)) {byColor.set(color, palette.length); palette.push(color);}
      if (palette.length > 256) throw new Error('Palette exceeds the compact format.');
      indices[i] = byColor.get(color);
    }
    regions[name] = {bounds, sampleStep: step, columns, rows, palette, indices: indices.toString('base64')};
    console.log(`${name}: ${columns} × ${rows}, ${palette.length} sampled colours`);
  }
  const result = {schemaVersion: 1, source: {name: 'approved-cosmic-reference', sha256: createHash('sha256').update(original).digest('hex'), width: meta.width, height: meta.height}, regions};
  await mkdir(dirname(output), {recursive: true});
  await writeFile(output, JSON.stringify(result) + '\n');
  return result;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = process.argv[2], output = process.argv[3] || join(dirname(fileURLToPath(import.meta.url)), '../assets/art/cosmic-particles.json');
  if (!source) throw new Error('Usage: node scripts/prepare-particle-art.mjs REFERENCE.png [OUTPUT.json]');
  const moduleRoot = process.env.PROFILE_SHARP_ROOT;
  const require = createRequire(moduleRoot ? join(resolve(moduleRoot), 'particle-build.cjs') : import.meta.url);
  const sharp = require('sharp');
  await prepareParticleArt(source, output, sharp);
}
