import { readFile, writeFile, mkdir, rename, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { collectProfile, createApi } from './data.mjs';
import { renderReadme } from './render.mjs';
import { buildPresentation } from './modules.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');

export async function updateProfile({directory=root,api=createApi(),now=()=>new Date()}={}) {
  const config=JSON.parse(await readFile(join(directory,'profile.config.json'),'utf8'));
  const profile=await collectProfile(config,api);
  let previous;
  try { previous=JSON.parse(await readFile(join(directory,'data/profile.json'),'utf8')); } catch (error) { if(error.code!=='ENOENT') throw error; }
  const {updatedAt:oldDate,...oldData}=previous||{};
  const snapshot={...profile,updatedAt:isDeepStrictEqual(oldData,profile)?oldDate:now().toISOString()};
  const files=new Map(), assets={};
  for (const block of buildPresentation(snapshot,config).filter(block=>block.kind==='asset')) {
    assets[block.id]={};
    for(const [key,suffix,options] of [
      ['desktop','',{}],['mobile','-mobile',{mobile:true}],
      ['still','-still',{animated:false}],['mobileStill','-mobile-still',{mobile:true,animated:false}]
    ]){
      const content=block.render(options);
      const hash=createHash('sha256').update(content).digest('hex').slice(0,12);
      const file=`assets/generated/${block.id}${suffix}.${hash}.svg`;
      assets[block.id][key]=file;files.set(file,content);
    }
  }
  let oldManifest={current:[],previous:[]};
  try { oldManifest=JSON.parse(await readFile(join(directory,'assets/generated/manifest.json'),'utf8')); } catch(error) { if(error.code!=='ENOENT') throw error; }
  const current=Object.values(assets).flatMap(variants=>Object.values(variants));
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
  for (const file of new Set([...oldManifest.current,...oldManifest.previous])) {
    if (/^assets\/generated\/[a-z0-9-]+\.[a-f0-9]{12}\.svg$/.test(file) && !retained.has(file)) {
      try{await unlink(join(directory,file));}catch(error){if(error.code!=='ENOENT')throw error;}
    }
  }
  return snapshot;
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  updateProfile({api:createApi({useGh:process.argv.includes('--gh')})}).then(data=>console.log(`Updated profile: ${data.projects.length} projects, ${data.mergedPullRequests} merged upstream PRs, spotlight ${data.spotlight?.repo||'none'}`)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
