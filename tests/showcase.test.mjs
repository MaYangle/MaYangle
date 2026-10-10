import test from 'node:test';
import assert from 'node:assert/strict';
import {collectShowcase,renderShowcase,validateShowcase} from '../scripts/showcase.mjs';
import {collectProfile} from '../scripts/data.mjs';
import {renderHero} from '../scripts/render.mjs';

const section=(id,title,extra={})=>({id,title,description:'Public work in this area.',items:[],...extra});
const setup=()=>({title:'RESEARCH & OUTPUTS',maxVisible:2,sections:[
  section('research','Research & experiments',{autoTopics:['paper-reproduction']}),
  section('models','Models & datasets',{autoTopics:['dataset','model-release']}),
  section('writing','Writing & talks'),
  section('releases','Demos & releases',{autoReleases:true})
]});
const config=()=>({username:'MaYangle',name:'Yangle Ma',tagline:'AI engineer',bio:'',links:{},projects:{discover:true,maxVisible:3,exclude:[],include:[]},showcase:setup()});
const project=(name,topics=[])=>({repo:`MaYangle/${name}`,name,url:`https://github.com/MaYangle/${name}`,description:'Public project.',topics,fork:false});

test('four empty areas are honest placeholders with no fabricated entries',async()=>{
  const result=await collectShowcase(config(),[],async()=>{throw new Error('No API calls expected')});
  assert.equal(result.sections.length,4);
  assert.ok(result.sections.every(s=>s.items.length===0));
  const svg=renderShowcase(result,56,100,1088,false).svg;
  assert.equal((svg.match(/No public entry yet/g)||[]).length,4);
  assert.ok(!svg.includes('Coming soon'));
});

test('a curated item replaces its empty state while the other areas remain ready',async()=>{
  const c=config();c.showcase.sections[2].items=[{title:'A published technical note',url:'https://example.org/note',kind:'Article',date:'2026-10-10',summary:'A short explanation.'}];
  const result=await collectShowcase(c,[],async()=>[]);
  const svg=renderShowcase(result,30,50,540,true).svg;
  assert.equal((svg.match(/No public entry yet/g)||[]).length,3);
  assert.ok(svg.includes('A published technical note'));
  assert.equal(result.sections[2].items[0].source,'curated');
});

test('explicit topics classify repositories without inventing research or model claims',async()=>{
  const result=await collectShowcase(config(),[project('reproduction',['paper-reproduction']),project('training-data',['dataset']),project('generic-ai',['machine-learning'])],async()=>[]);
  assert.deepEqual(result.sections[0].items.map(i=>i.title),['reproduction']);
  assert.deepEqual(result.sections[1].items.map(i=>i.title),['training-data']);
  assert.equal(result.sections[0].items[0].kind,'Repository');
  assert.equal(result.sections[0].items[0].date,null);
});

test('public releases populate automatically and drafts stay out',async()=>{
  const result=await collectShowcase(config(),[project('tool')],async()=>[
    {name:'v2',html_url:'https://github.com/MaYangle/tool/releases/tag/v2',draft:true,published_at:'2026-10-10T00:00:00Z'},
    {name:'v1',html_url:'https://github.com/MaYangle/tool/releases/tag/v1',draft:false,prerelease:false,published_at:'2026-10-09T00:00:00Z'},
    {name:'v1.1rc',html_url:'https://github.com/MaYangle/tool/releases/tag/v1.1rc',draft:false,prerelease:true,published_at:'2026-10-10T00:00:00Z'}
  ]);
  const entries=result.sections[3].items;
  assert.equal(entries.length,2);
  assert.equal(entries[0].kind,'Pre-release');
  assert.ok(entries.every(i=>!i.url.endsWith('/v2')));
});

test('the full collector discovers future artifacts without changing the layout code',async()=>{
  const c=config();
  const api=async endpoint=>{
    if(endpoint.startsWith('users/'))return [{full_name:'MaYangle/new-data',name:'new-data',private:false,fork:false,archived:false,size:10,stargazers_count:0,language:'Python',topics:['dataset']}];
    if(endpoint.startsWith('search/'))return {items:[],total_count:0,incomplete_results:false};
    if(endpoint.includes('/releases'))return [];
    throw new Error('Unexpected endpoint');
  };
  const data=await collectProfile(c,api);
  assert.equal(data.showcase.sections[1].items[0].title,'new data');
  assert.ok(renderHero(data,c).includes('Models &amp; datasets'));
});

test('URLs are deduplicated and item text is escaped',async()=>{
  const c=config();c.showcase.sections[0].items=[{title:'<script> & study',url:'https://github.com/MaYangle/study'}];
  const result=await collectShowcase(c,[project('study',['paper-reproduction'])],async()=>[]);
  assert.equal(result.sections[0].items.length,1);
  const svg=renderShowcase(result,56,100,1088,false).svg;
  assert.ok(svg.includes('&lt;script&gt; &amp; study'));
  assert.ok(!svg.includes('<script>'));
  c.showcase.sections[0].items[0].url='javascript:alert(1)';
  assert.throws(()=>validateShowcase(c.showcase),/HTTPS/);
});

test('profiles without showcase configuration remain compatible',async()=>{
  const c=config();delete c.showcase;
  assert.equal(await collectShowcase(c,[],async()=>{throw new Error('No request')}),null);
  assert.equal(renderShowcase(null,56,100,1088,false).svg,'');
});
