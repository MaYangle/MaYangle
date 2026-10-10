import { readFile, writeFile, mkdir, rename, readdir, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { collectProfile, createApi } from './data.mjs';
import { renderHero, renderReadme } from './render.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');

export async function updateProfile({directory=root,api=createApi(),now=()=>new Date()}={}) {
  const config=JSON.parse(await readFile(join(directory,'profile.config.json'),'utf8'));
  const profile=await collectProfile(config,api);
  let previous;
  try { previous=JSON.parse(await readFile(join(directory,'data/profile.json'),'utf8')); } catch (error) { if(error.code!=='ENOENT') throw error; }
  const {updatedAt:oldDate,...oldData}=previous||{};
  const snapshot={...profile,updatedAt:isDeepStrictEqual(oldData,profile)?oldDate:now().toISOString()};
  const files=new Map(), assets={};
  for (const [key,base,options] of [
    ['desktop','profile',{}],['mobile','profile-mobile',{mobile:true}],
    ['still','profile-still',{animated:false}],['mobileStill','profile-mobile-still',{mobile:true,animated:false}]
  ]) {
    const content=renderHero(snapshot,config,options);
    const hash=createHash('sha256').update(content).digest('hex').slice(0,12);
    assets[key]=`assets/generated/${base}.${hash}.svg`;
    files.set(assets[key],content);
  }
  let oldManifest={current:[],previous:[]};
  try { oldManifest=JSON.parse(await readFile(join(directory,'assets/generated/manifest.json'),'utf8')); } catch(error) { if(error.code!=='ENOENT') throw error; }
  const current=Object.values(assets);
  const manifest={current,previous:isDeepStrictEqual(current,oldManifest.current)?oldManifest.previous:oldManifest.current};
  files.set('README.md',renderReadme(snapshot,config,assets));
  files.set('data/profile.json',JSON.stringify(snapshot,null,2)+'\n');
  files.set('assets/generated/manifest.json',JSON.stringify(manifest,null,2)+'\n');
  for (const [file,content] of files) {
    await mkdir(dirname(join(directory,file)),{recursive:true});
    await writeFile(join(directory,file+'.tmp'),content);
  }
  for (const file of files.keys()) await rename(join(directory,file+'.tmp'),join(directory,file));
  const retained=new Set([...manifest.current,...manifest.previous]);
  for (const name of await readdir(join(directory,'assets/generated'))) {
    if (/^profile(?:-mobile)?(?:-still)?\.[a-f0-9]{12}\.svg$/.test(name) && !retained.has(`assets/generated/${name}`)) await unlink(join(directory,'assets/generated',name));
  }
  return snapshot;
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  updateProfile({api:createApi({useGh:process.argv.includes('--gh')})}).then(data=>console.log(`Updated profile: ${data.projects.length} projects, ${data.mergedPullRequests} merged upstream PRs, spotlight ${data.spotlight?.repo||'none'}`)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
