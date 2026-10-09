import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectProfile, selectProjects, selectSpotlight, normalizePullRequests } from '../scripts/data.mjs';
import { renderHero, renderReadme, compact } from '../scripts/render.mjs';
import { updateProfile } from '../scripts/update-profile.mjs';

const config={username:'MaYangle',name:'Yangle Ma',tagline:'AI engineering',bio:'Building reproducible AI systems.',links:{GitHub:'https://github.com/MaYangle'},projects:{discover:true,maxVisible:3,exclude:[],include:[{repo:'MaYangle/team-ml',name:'Team ML',description:'Team project, working fork'}]}};
const repository=(name,more={})=>({full_name:`MaYangle/${name}`,name,private:false,archived:false,disabled:false,fork:false,size:20,stargazers_count:2,forks_count:1,language:'Python',pushed_at:'2026-10-01T00:00:00Z',...more});
const issue=(number,status='open',repo='upstream/ai')=>({number,title:`Contribution ${number}`,html_url:`https://github.com/${repo}/pull/${number}`,repository_url:`https://api.github.com/repos/${repo}`,state:status==='open'?'open':'closed',updated_at:'2026-10-09T00:00:00Z',pull_request:{merged_at:status==='merged'?'2026-10-08T00:00:00Z':null}});
const response=items=>({items,total_count:items.length,incomplete_results:false});
const mockApi=({repos=[repository('team-ml',{fork:true})],merged=[issue(7,'merged')],open=[issue(527)],stars=66000}={})=>async endpoint=>{
  if(endpoint.startsWith('users/')) return repos;
  if(endpoint.startsWith('search/')) return decodeURIComponent(endpoint).includes('is:merged')?response(merged):response(open);
  if(endpoint.includes('/pulls/')) {
    const number=Number(endpoint.split('/').at(-1));
    const item=[...merged,...open].find(item=>item.number===number);
    return {state:item.state,merged:Boolean(item.pull_request.merged_at)};
  }
  if(endpoint.startsWith('repos/')) return {name:endpoint.split('/').at(-1),stargazers_count:stars,forks_count:11000,private:false};
  throw new Error(`Unexpected fixture endpoint ${endpoint}`);
};

test('public project discovery grows with new original repos and includes the chosen team fork',()=>{
  const before=[repository('team-ml',{fork:true}),repository('MaYangle'),repository('empty',{size:0}),repository('private',{private:true}),repository('old',{archived:true}),repository('unrelated-fork',{fork:true})];
  assert.deepEqual(selectProjects(before,config).map(p=>p.repo),['MaYangle/team-ml']);
  const after=selectProjects([...before,repository('new-ai-system')],config);
  assert.equal(after.length,2);
  assert.equal(after[0].description,'Team project, working fork');
  assert.equal(after[1].repo,'MaYangle/new-ai-system');
});

test('closed unmerged proposals cannot appear as the spotlight',()=>{
  const map=new Map([['upstream/ai',{name:'ai',stargazers_count:66000,forks_count:11000}],['team/ml',{name:'ml',stargazers_count:7,forks_count:3}]]);
  const pulls=[{repo:'upstream/ai',number:531,status:'closed',updatedAt:'2026-10-09'}, {repo:'team/ml',number:7,status:'merged',title:'Fixes',url:'https://github.com/team/ml/pull/7',updatedAt:'2026-10-08'}];
  assert.equal(selectSpotlight(pulls,map,config).number,7);
  assert.equal(selectSpotlight([],map,config),null);
});

test('a PR merge changes both the displayed status and the data, with no hardcoded open label',async()=>{
  const opened=await collectProfile(config,mockApi({merged:[],open:[issue(527)]}));
  const merged=await collectProfile(config,mockApi({merged:[issue(527,'merged')],open:[]}));
  assert.equal(opened.spotlight.status,'open');
  assert.equal(merged.spotlight.status,'merged');
  assert.match(renderHero(merged,config),/MERGED PR #527/);
  assert.doesNotMatch(renderReadme(merged,config),/\(open\)/);
  assert.equal(merged.mergedPullRequests,1);
});

test('a newly discovered project appears in the rendered homepage and the instrument count',async()=>{
  const data=await collectProfile(config,mockApi({repos:[repository('team-ml',{fork:true}),repository('next-build')]}));
  const md=renderReadme(data,config);
  assert.match(md,/https:\/\/github.com\/MaYangle\/next-build/);
  assert.match(renderHero(data,config),/>02<\/text>/);
});

test('the compact layout limits visible projects while keeping the total and index link',async()=>{
  const data=await collectProfile(config,mockApi({repos:Array.from({length:7},(_,i)=>repository(`build-${i}`))}));
  const md=renderReadme(data,config);
  assert.equal((md.match(/\*\*Project\*\*/g)||[]).length,3);
  assert.match(md,/All 7 projects/);
  assert.match(renderHero(data,config),/>07<\/text>/);
});

test('API failure does not overwrite the last successful homepage',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'mayangle-profile-test-'));
  await writeFile(join(directory,'profile.config.json'),JSON.stringify(config));
  await writeFile(join(directory,'README.md'),'previous successful profile');
  await assert.rejects(updateProfile({directory,api:async()=>{throw new Error('rate limited')}}),/rate limited/);
  assert.equal(await readFile(join(directory,'README.md'),'utf8'),'previous successful profile');
});

test('unchanged public data preserves the snapshot timestamp instead of creating a new diff',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'mayangle-profile-test-'));
  await writeFile(join(directory,'profile.config.json'),JSON.stringify(config));
  await updateProfile({directory,api:mockApi(),now:()=>new Date('2026-10-09T00:00:00Z')});
  const second=await updateProfile({directory,api:mockApi(),now:()=>new Date('2026-10-10T00:00:00Z')});
  assert.equal(second.updatedAt,'2026-10-09T00:00:00.000Z');
});

test('changed data creates new image URLs and retains the prior generation for cached READMEs',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'mayangle-profile-test-'));
  await writeFile(join(directory,'profile.config.json'),JSON.stringify(config));
  await updateProfile({directory,api:mockApi({stars:66000})});
  const before=JSON.parse(await readFile(join(directory,'assets/generated/manifest.json'),'utf8'));
  await updateProfile({directory,api:mockApi({stars:67000})});
  const after=JSON.parse(await readFile(join(directory,'assets/generated/manifest.json'),'utf8'));
  assert.notDeepEqual(after.current,before.current);
  assert.deepEqual(after.previous,before.current);
  for(const file of before.current) assert.ok(await readFile(join(directory,file),'utf8'));
  assert.ok((await readFile(join(directory,'README.md'),'utf8')).includes(after.current[0]));
});

test('incomplete search data is rejected',async()=>{
  const api=mockApi();
  await assert.rejects(collectProfile(config,async endpoint=>endpoint.startsWith('search/')?{items:[],total_count:0,incomplete_results:true}:api(endpoint)),/incomplete search data/);
});

test('repository text is escaped and compact metrics remain numerical',async()=>{
  const data=await collectProfile(config,mockApi());
  data.spotlight.repoName='<script>&"';
  data.spotlight.title='[unsafe](javascript:alert(1)) <b>';
  assert.doesNotMatch(renderHero(data,config),/<script>/);
  assert.match(renderHero(data,config),/&lt;SCRIPT&gt;&amp;/);
  assert.doesNotMatch(renderReadme(data,config),/<b>/);
  assert.equal(compact(66062),'66.1K');
  assert.equal(compact(7),'7');
});

test('search races deduplicate a PR with merged status taking priority',()=>{
  const results=normalizePullRequests(response([issue(7,'merged')]),response([issue(7)]));
  assert.equal(results.length,1);
  assert.equal(results[0].status,'merged');
});

test('a stale search result is checked against the current PR before displaying it',async()=>{
  const api=mockApi({merged:[issue(7,'merged','team/ml')],open:[issue(527)]});
  const data=await collectProfile(config,async endpoint=>{
    if(endpoint==='repos/upstream/ai/pulls/527') return {state:'closed',merged:false};
    if(endpoint==='repos/team/ml') return {name:'ml',private:false,stargazers_count:7,forks_count:3};
    return api(endpoint);
  });
  assert.equal(data.spotlight.number,7);
  assert.equal(data.spotlight.status,'merged');
});

test('empty public work renders without fabricated metrics or invalid links',async()=>{
  const data=await collectProfile(config,mockApi({repos:[],merged:[],open:[]}));
  assert.equal(data.spotlight,null);
  assert.match(renderHero(data,config),/BUILDING/);
  assert.doesNotMatch(renderReadme(data,config),/undefined|null/);
});
