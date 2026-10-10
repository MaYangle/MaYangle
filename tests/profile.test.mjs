import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectProfile, selectProjects, selectSpotlight, normalizePullRequests } from '../scripts/data.mjs';
import { renderHero, renderReadme, compact } from '../scripts/render.mjs';
import { buildModules, renderModule } from '../scripts/modules.mjs';
import { updateProfile } from '../scripts/update-profile.mjs';

const config={username:'MaYangle',name:'Yangle Ma',tagline:'AI engineering',bio:'Building reproducible AI systems.',links:{GitHub:'https://github.com/MaYangle'},projects:{discover:true,maxVisible:3,exclude:[],include:[{repo:'MaYangle/team-ml',name:'Team ML',description:'Team project, working fork'}]}};
const repository=(name,more={})=>({full_name:`MaYangle/${name}`,name,private:false,archived:false,disabled:false,fork:false,size:20,stargazers_count:2,forks_count:1,language:'Python',pushed_at:'2026-10-01T00:00:00Z',...more});
const issue=(number,status='open',repo='upstream/ai')=>({number,title:`Contribution ${number}`,html_url:`https://github.com/${repo}/pull/${number}`,repository_url:`https://api.github.com/repos/${repo}`,state:status==='open'?'open':'closed',updated_at:'2026-10-09T00:00:00Z',created_at:'2026-10-01T00:00:00Z',closed_at:status==='closed'?'2026-10-09T00:00:00Z':null,pull_request:{merged_at:status==='merged'?'2026-10-08T00:00:00Z':null}});
const response=items=>({items,total_count:items.length,incomplete_results:false});
const mockApi=({repos=[repository('team-ml',{fork:true})],merged=[issue(7,'merged')],open=[issue(527)],closed=[],stars=66000}={})=>async endpoint=>{
  if(endpoint.startsWith('users/')) return repos;
  if(endpoint.startsWith('search/')) {
    const query=decodeURIComponent(endpoint);
    let items=query.includes('is:closed')?closed:query.includes('is:merged')?merged:open;
    const scope=/repo:([\w.-]+\/[\w.-]+)/.exec(query)?.[1];
    if(scope)items=items.filter(item=>item.repository_url===`https://api.github.com/repos/${scope}`);
    return response(items);
  }
  if(endpoint.includes('/pulls/')) {
    const number=Number(endpoint.split('/').at(-1));
    const item=[...merged,...open,...closed].find(item=>item.number===number);
    return {state:item.state,merged:Boolean(item.pull_request.merged_at),additions:100,deletions:10,changed_files:2};
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
  assert.equal(after[1].role,'Original repository');
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
  assert.ok(renderHero(merged,config).includes('#527 · MERGED'));
  assert.doesNotMatch(renderReadme(merged,config),/\(open\)/);
  assert.equal(merged.mergedPullRequests,1);
});

test('a newly discovered project gets a full-width feature module',async()=>{
  const data=await collectProfile(config,mockApi({repos:[repository('team-ml',{fork:true}),repository('next-build')]}));
  const md=renderReadme(data,config);
  assert.ok(renderHero(data,config).includes('next build'));
  assert.ok(md.includes('Featured build: next build'));
  const feature=buildModules(data,config).find(module=>module.id==='project-2');
  assert.ok(renderModule(feature).includes('ORIGINAL REPOSITORY'));
  assert.doesNotMatch(md,/<table\b/);
});

test('a discovered API project gets no configured MSA flow while the curated project keeps its configured fusion',async()=>{
  const sourceConfig={...config,projects:{...config.projects,include:[{
    ...config.projects.include[0],
    stack:['Python','PyTorch'],
    inputs:['Text','Audio','Vision'],
    encoders:['Whisper / BERT','MFCC','MediaPipe'],
    fusion:'Cross-attention',
    output:'Sentiment'
  }]}};
  const data=await collectProfile(sourceConfig,mockApi({repos:[repository('team-ml',{fork:true}),repository('new-api-service')]}));
  assert.equal(data.projects[0].fusion,'Cross-attention');
  const modules=buildModules(data,sourceConfig);
  const curated=renderModule(modules.find(module=>module.id==='project-1'));
  const discovered=renderModule(modules.find(module=>module.id==='project-2'));
  assert.ok(curated.includes('CROSS-ATTENTION')&&curated.includes('SENTIMENT'));
  data.projects[0].fusion='';data.projects[0].output='';
  const genericPipeline=renderModule(modules.find(module=>module.id==='project-1'));
  assert.ok(genericPipeline.includes('PROCESSING')&&genericPipeline.includes('OUTPUT'));
  assert.ok(discovered.includes('new api service')&&discovered.includes('PYTHON'));
  assert.doesNotMatch(discovered,/INPUT MODALITIES|CROSS-ATTENTION|SENTIMENT|PREDICTION|PROCESSING|OUTPUT/);
});

test('the compact layout limits visible project cards while retaining collected projects',async()=>{
  const data=await collectProfile(config,mockApi({repos:Array.from({length:7},(_,i)=>repository(`build-${i}`))}));
  const md=renderReadme(data,config);
  assert.equal((md.match(/alt="Featured build: build \d"/g)||[]).length,3);
  assert.equal(data.projects.length,7);
  assert.doesNotMatch(md,/<table\b/);
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
  data.projects[0].name='<script>&"';
  data.projects[0].description='[unsafe](javascript:alert(1)) <b>';
  assert.doesNotMatch(renderHero(data,config),/<script>/);
  assert.ok(/&lt;script&gt;&amp;/i.test(renderHero(data,config)), 'Repository text must be XML escaped');
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
  assert.equal(data.openSpotlight,null);
});

test('merged totals exclude closed proposals and each contribution group links to its repository',async()=>{
  const data=await collectProfile(config,mockApi({merged:[issue(7,'merged','upstream/ai')],closed:[issue(6,'closed','upstream/ai')],open:[]}));
  assert.equal(data.mergedPullRequests,1);
  assert.equal(data.closedPullRequests,1);
  const modules=buildModules(data,config);
  const gauge=modules.find(module=>module.id==='contribution-overview');
  assert.match(renderModule(gauge),/>01<\/text>/);
  assert.match(renderModule(gauge),/MERGED PRS/);
  assert.ok(renderModule(gauge).includes('>01</text>'));
  assert.match(renderModule(gauge),/CLOSED \/ NOT MERGED/);
  const contribution=modules.find(module=>module.id==='contribution-repo-1');
  assert.equal(data.contributions[0].stars,66000);
  assert.equal(data.contributions[0].forks,11000);
  assert.match(renderModule(contribution),/CLOSED \/ NOT MERGED/);
  assert.match(renderModule(contribution),/#6/);
  assert.equal(new URL(contribution.href).searchParams.get('q'),'author:MaYangle repo:upstream/ai is:pr is:closed is:public');
  const readme=renderReadme(data,config);
  assert.doesNotMatch(readme,/<table\b/);
});

test('configured engineering evidence passes through collection and appears inside its linked PR card',async()=>{
  const evidence={label:'PR #7 · Reliability fixes',points:['Regression/classification output dtypes','NaN/Inf prediction handling','Cross-platform results path'],url:'https://github.com/upstream/ai/pull/7'};
  const sourceConfig={...config,projects:{...config.projects,include:[{...config.projects.include[0],engineeringEvidence:[evidence]}]}};
  const data=await collectProfile(sourceConfig,mockApi());
  assert.deepEqual(data.projects[0].engineeringEvidence,[evidence]);
  const modules=buildModules(data,sourceConfig);
  const evidenceCard=modules.find(module=>module.id==='engineering-work-1-1');
  assert.equal(evidenceCard.href,evidence.url);
  const evidenceSvg=renderModule(evidenceCard);
  assert.match(evidenceSvg,/ENGINEERING EVIDENCE/);
  assert.ok(evidenceSvg.includes('Regression/classification')&&evidenceSvg.includes('Cross-platform results path'));
  const readme=renderReadme(data,sourceConfig);
  assert.ok(readme.includes('href="'+evidence.url+'"'));
  assert.doesNotMatch(readme,/<table\b|<br><a/);
});

test('merged work beats a popular open PR, and newer merges beat repository stars',()=>{
  const map=new Map([
    ['popular/ai',{name:'ai',stargazers_count:66000,forks_count:11000}],
    ['team/ml',{name:'ml',stargazers_count:7,forks_count:3}],
    ['other/tool',{name:'tool',stargazers_count:2,forks_count:0}]
  ]);
  const pulls=[
    {repo:'popular/ai',number:527,status:'open',title:'Proposal',createdAt:'2026-10-10T00:00:00Z'},
    {repo:'team/ml',number:7,status:'merged',title:'Fix',mergedAt:'2025-08-31T00:00:00Z'}
  ];
  assert.equal(selectSpotlight(pulls,map,config).number,7);
  pulls.push({repo:'other/tool',number:99,status:'merged',title:'New fix',mergedAt:'2026-10-09T00:00:00Z'});
  assert.equal(selectSpotlight(pulls,map,config).number,99);
});

test('all six merged PRs are visible and ordered by merge time, with open work separate',async()=>{
  const merged=[1,2,3,4,5,7].map(n=>{
    const item=issue(n,'merged');
    item.pull_request.merged_at=`2026-10-${String(n).padStart(2,'0')}T00:00:00Z`;
    item.updated_at=`2026-10-${String(10-n).padStart(2,'0')}T00:00:00Z`;
    return item;
  });
  const data=await collectProfile(config,mockApi({merged}));
  assert.equal(data.spotlight.number,7);
  assert.equal(data.openSpotlight.number,527);
  assert.deepEqual(data.contributions[0].pulls.map(p=>p.number),[7,5,4,3,2,1]);
  const svg=renderHero(data,config);
  for(const n of [1,2,3,4,5,7])assert.ok(svg.includes('#'+n));
  assert.ok(svg.includes('06')&&svg.includes('MERGED PRS')&&svg.includes('OPEN PRS'));
});

test('a new merge makes a newly contributed codebase visible ahead of older work',async()=>{
  const old=issue(7,'merged','team/ml');old.pull_request.merged_at='2025-08-31T00:00:00Z';
  const fresh=issue(99,'merged','other/tool');fresh.pull_request.merged_at='2026-10-09T00:00:00Z';
  const data=await collectProfile(config,mockApi({merged:[old,fresh]}));
  assert.equal(data.spotlight.repo,'other/tool');
  assert.equal(data.contributions[0].repo,'other/tool');
  assert.equal(data.contributions[0].count,1);
});

test('empty public work renders without fabricated metrics or invalid links',async()=>{
  const data=await collectProfile(config,mockApi({repos:[],merged:[],open:[]}));
  assert.equal(data.spotlight,null);
  assert.ok(!/NaN|undefined/.test(renderHero(data,config)), 'Empty data must render safely');
  assert.doesNotMatch(renderReadme(data,config),/undefined|null/);
});


test('the full-page canvas expands when another project is added',async()=>{
  const first=await collectProfile(config,mockApi());
  const next=await collectProfile(config,mockApi({repos:[repository('team-ml',{fork:true}),repository('second-project'),repository('third-project')]}));
  const height=svg=>Number(/viewBox="0 0 1200 ([\d.]+)"/.exec(svg)[1]);
  assert.ok(height(renderHero(next,config))>height(renderHero(first,config)));
  assert.ok(renderHero(next,config).includes('second project'));
});


test('merged impact sums real diff fields and reports its sample size',async()=>{
  const data=await collectProfile(config,mockApi({merged:[issue(7,'merged'),issue(5,'merged')]}));
  assert.deepEqual(data.impact,{sampleSize:2,additions:200,deletions:20,fileChanges:4});
  assert.match(renderHero(data,config),/MERGED PR DIFFS/);
  assert.doesNotMatch(renderHero(data,config),/RECENT WORK/);
  assert.equal('activity' in data,false);
  assert.doesNotMatch(renderReadme(data,config),/RECENT WORK/);
});

test('missing diff metrics abort the update instead of displaying zero',async()=>{
  const api=mockApi();
  await assert.rejects(collectProfile(config,async endpoint=>endpoint.includes('/pulls/7')?{state:'closed',merged:true}:api(endpoint)),/diff metrics/);
});

test('the concise profile has only the chosen subtitle and no expandable text copy',async()=>{
  const data=await collectProfile(config,mockApi());
  const minimal={...config,bio:'',tagline:'AI engineer'};
  const svg=renderHero(data,minimal),md=renderReadme(data,minimal);
  assert.ok(svg.includes('>AI engineer</text>'));
  assert.ok(!svg.includes(config.bio));
  assert.ok(!md.includes('<details>') && !md.includes('Text version'));
  assert.ok(!md.includes('[PR #') && !md.includes('All projects') && !md.includes('Merged contributions'));
  assert.ok(md.includes('href="https://github.com/MaYangle"'));
});
