import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderParticleArtwork, particleRegionStats} from '../scripts/particle-art.mjs';
const data = JSON.parse(await readFile(new URL('../assets/art/cosmic-particles.json', import.meta.url), 'utf8'));
function patchColour(name, x, y, radius = 3) {
  const r=data.regions[name], indices=Buffer.from(r.indices,'base64');
  const cx=Math.round(x/r.bounds.width*(r.columns-1)), cy=Math.round(y/r.bounds.height*(r.rows-1));
  let total=[0,0,0],count=0;
  for(let row=Math.max(0,cy-radius);row<=Math.min(r.rows-1,cy+radius);row++)for(let column=Math.max(0,cx-radius);column<=Math.min(r.columns-1,cx+radius);column++){
    const color=r.palette[indices[row*r.columns+column]];
    for(let k=0;k<3;k++)total[k]+=parseInt(color.slice(k*2,k*2+2),16);
    count++;
  }
  return total.map(value=>value/count);
}
test('reference anatomy retains the luminous left sky and dark blue planet',()=>{
  const sky=patchColour('hero',80,130), planet=patchColour('hero',940,220);
  assert.ok(Math.min(...sky)>230,'Sky should remain white and open for typography');
  assert.ok(planet[0]<140 && planet[2]>planet[0]+10,'Planet should retain its dark cool depth');
  const rim=patchColour('hero',805,105);
  assert.ok(Math.min(...rim)>200,'The gravitational rim should remain luminous');
  assert.match(data.source.sha256,/^[a-f0-9]{64}$/);
});
test('all scenes reconstruct from self-contained vector particles',()=>{
  for(const name of ['hero','fusion','landscape','orbital']){
    const svg=renderParticleArtwork(name,0,0,600,350,{animated:true});
    assert.match(svg,/<path fill="none" stroke="#[a-f0-9]{6}"/);
    assert.doesNotMatch(svg,/<image|data:image|<script|foreignObject|https?:\/\//);
    assert.ok(particleRegionStats(name).particles>3000);
  }
});
test('static art does not introduce a live stream or a second visual source',()=>{
  const still=renderParticleArtwork('hero',0,0,600,350,{animated:false});
  assert.doesNotMatch(still,/photo-stream|photo-cloud-stream|<animate|animation:/);
  assert.match(still,/sample-phase/);
  assert.throws(()=>renderParticleArtwork('missing',0,0,600,350),/Unknown particle region/);
});
