import test from 'node:test';
import assert from 'node:assert/strict';
import {selectFeaturedProjects,validateProjectSelection} from '../scripts/projects.mjs';
import {buildPresentation} from '../scripts/modules.mjs';
import {renderReadme} from '../scripts/render.mjs';

const config={username:'MaYangle',name:'Yangle Ma',tagline:'AI engineer',bio:'',stack:[],links:{},projects:{maxVisible:2,mode:'auto',featured:['MaYangle/b'],showMore:true}};
const project=name=>({repo:`MaYangle/${name}`,name,url:`https://github.com/MaYangle/${name}`,description:'Public project',role:'Independent project',stack:[],inputs:[]});
const projects=['a','b','c'].map(project);
const data={username:'MaYangle',projects,mergedPullRequests:1,openPullRequests:1,spotlight:{repo:'upstream/one',repoName:'One',stars:5,forks:1,number:4,url:'https://github.com/upstream/one/pull/4',status:'merged',title:'Fix'},openSpotlight:{repo:'upstream/two',repoName:'Two',stars:100,forks:9,number:8,url:'https://github.com/upstream/two/pull/8',status:'open',title:'Proposal'},contributions:[{repo:'upstream/one',name:'One',count:1,pulls:[{number:4,title:'Fix'}]}],impact:{sampleSize:1,additions:10,deletions:2,fileChanges:1},activity:[],showcase:null};

test('auto mode honors pin order and fills remaining slots with discovered projects',()=>{
  assert.deepEqual(selectFeaturedProjects(projects,config).map(p=>p.name),['b','a']);
  const ordered={...config,projects:{...config.projects,featured:['MaYangle/c','MaYangle/b']}};
  assert.deepEqual(selectFeaturedProjects(projects,ordered).map(p=>p.name),['c','b']);
});

test('manual mode displays only selected eligible repositories',()=>{
  const manual={...config,projects:{...config.projects,mode:'manual',featured:['MaYangle/c','MaYangle/missing']}};
  assert.deepEqual(selectFeaturedProjects(projects,manual).map(p=>p.name),['c']);
  assert.throws(()=>validateProjectSelection({...config,projects:{...config.projects,featured:['other/repo']}}),/owned/);
});

test('repository and PR cards are native clickable links to their own destinations',()=>{
  const md=renderReadme(data,config);
  for(const url of ['https://github.com/MaYangle/a','https://github.com/MaYangle/b','https://github.com/upstream/one','https://github.com/upstream/one/pull/4','https://github.com/upstream/two/pull/8'])assert.ok(md.includes(`<a href="${url}">`));
  assert.ok(!md.includes('<script')&&!md.includes('onclick')&&!md.includes('<select'));
});

test('extra repositories are selectable in a native disclosure list',()=>{
  const md=renderReadme(data,config);
  assert.ok(md.includes('<summary>Other public repositories (1)</summary>'));
  assert.ok(md.includes('[c](https://github.com/MaYangle/c)'));
  assert.ok(!md.includes('Text version and project links'));
});

test('published showcase entries have their own links while empty areas remain compact',()=>{
  const sample={...data,showcase:{title:'RESEARCH & OUTPUTS',maxVisible:2,emptyMode:'compact',sections:[{id:'research',title:'Research',items:[{title:'Study',url:'https://example.org/study',kind:'Article',date:null,summary:'Results'}]},{id:'models',title:'Models & datasets',description:'Model artifacts',items:[]}]}};
  const blocks=buildPresentation(sample,config);
  assert.ok(blocks.some(b=>b.href==='https://example.org/study'));
  const compact=blocks.find(b=>b.id==='future-areas');
  assert.ok(compact);
  assert.ok(Number(/height="([\d.]+)"/.exec(compact.render())[1])<180);
  const hidden={...sample,showcase:{...sample.showcase,emptyMode:'hidden'}};
  assert.ok(!buildPresentation(hidden,config).some(b=>b.id==='future-areas'));
});
