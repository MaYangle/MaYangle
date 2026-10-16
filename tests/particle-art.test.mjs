import test from 'node:test';
import assert from 'node:assert/strict';
import {renderParticleArtwork,particleRegionStats} from '../scripts/particle-art.mjs';
const names=['hero','fusion','landscape','orbital'];
test('scientific illustrations stay within a small vector and animation budget',()=>{
 let total=0;
 for(const name of names){
  const svg=renderParticleArtwork(name,0,0,600,350);
  assert.doesNotMatch(svg,/<image|data:image|<script|foreignObject|NaN|Infinity|href=/);
  const stats=particleRegionStats(name);total+=stats.particles;
  assert.ok(stats.bytes<110000,`${name} exceeds the scene size budget`);
  assert.ok(stats.particles>50&&stats.particles<1000);
  const motion=[...svg.matchAll(/<animateMotion[^>]*dur="([\d.]+)s"/g)];
  assert.ok(motion.length>10&&motion.length<100);
  assert.ok(motion.every(m=>Number(m[1])>=2&&Number(m[1])<=25));
 }
 assert.ok(total<1800,'Total scene complexity should stay much lower than the old photographic point cloud');
});
test('static illustrations retain geometry and remove every animation',()=>{
 for(const name of names){
  const still=renderParticleArtwork(name,0,0,600,350,{animated:false});
  assert.doesNotMatch(still,/<animate|animation:|sphere-turn|current-layer|core-orbit/);
  assert.match(still,/<circle/);
  assert.match(still,/<path/);
 }
 assert.throws(()=>renderParticleArtwork('missing',0,0,600,350),/Unknown particle region/);
});
test('procedural output is deterministic and each scene instance has unique definitions',()=>{
 const a=renderParticleArtwork('hero',0,0,600,350);
 assert.equal(a,renderParticleArtwork('hero',0,0,600,350));
 const b=renderParticleArtwork('hero',10,20,600,350);
 const ids=svg=>[...svg.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(ids(a).filter(id=>ids(b).includes(id)).length,0);
});
