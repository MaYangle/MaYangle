import {xml,wrap,compact} from './format.mjs';
import {wave,projectCard} from './canvas.mjs';
import {renderShowcase} from './showcase.mjs';
import {selectFeaturedProjects} from './projects.mjs';

const ink='#17232f',muted='#667583',blue='#4264e8',rule='#e1e7ed';
const text=(x,y,value,size=18,color=ink,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${xml(value)}</text>`;
const line=(x,y,x2,y2)=>`<path d="M${x} ${y}L${x2} ${y2}" stroke="${rule}" fill="none"/>`;
const label=(x,y,value)=>text(x,y,value,13,muted,'font-weight="600" letter-spacing="1.3"');
const date=value=>new Date(value).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Shanghai'}).toUpperCase();
function words(x,y,value,width,size=18,max=2,color=ink,extra=''){
  const lines=wrap(value,width,size,max),height=size*1.4;
  return {svg:lines.map((s,i)=>text(x,y+i*height,s,size,color,extra)).join(''),bottom:y+(lines.length-1)*height};
}
function frame(body,width,height,alt,animated){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${xml(alt)}</title><style>text{font-family:Arial,Helvetica,sans-serif}${animated?'.wave{animation:wave 12s ease-in-out infinite}.flow{animation:flow 12s linear infinite}@keyframes wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@keyframes flow{to{stroke-dashoffset:-100}}@media(prefers-reduced-motion:reduce){.wave,.flow{animation:none!important}}':''}</style><rect width="${width}" height="${height}" fill="#fff"/>${body}</svg>\n`;
}
function dimensions(mobile){return {width:mobile?600:1200,margin:8,inner:mobile?584:1184};}
function header(data,config,{mobile,animated}){
  const {width,margin,inner}=dimensions(mobile);
  let body=text(width-margin,28,`@${config.username}`,12,muted,'text-anchor="end"');
  body+=text(margin,92,config.name,mobile?45:57,ink,'font-weight="500" letter-spacing="-1.5"')+text(margin,132,config.tagline,22,muted);
  const metrics=[[data.projects.length,mobile?'Public projects':(data.projects.length===1?'public project':'public projects')],[data.mergedPullRequests,mobile?'Merged PRs':(data.mergedPullRequests===1?'merged upstream PR':'merged upstream PRs')],[data.openPullRequests,mobile?'Open PRs':(data.openPullRequests===1?'open proposal':'open proposals')]];
  metrics.forEach(([value,caption],i)=>{
    const x=margin+i*inner/3;
    body+=text(x,188,String(value),mobile?27:24,ink,'font-weight="500"');
    body+=text(mobile?x:x+43,mobile?212:187,caption,mobile?13:16,muted);
  });
  body+=wave(margin,mobile?244:224,inner,animated);
  return {body,width,height:mobile?275:254};
}
function prCard(pr,role,{mobile}){
  const {width,margin,inner}=dimensions(mobile);
  let body=line(margin,1,width-margin,1)+label(margin,31,role)+text(width-margin,34,'↗',24,blue,'text-anchor="end"');
  const name=words(margin,73,pr.repoName,inner-35,mobile?26:28,2,ink,'font-weight="500"');body+=name.svg;
  const statusY=name.bottom+31;
  body+=text(margin,statusY,`${pr.status.toUpperCase()} PR #${pr.number}`,13,blue,'font-weight="600" letter-spacing=".5"');
  const title=words(margin,statusY+30,pr.title,inner,mobile?20:18,2,muted);body+=title.svg;
  body+=text(margin,title.bottom+30,`${compact(pr.stars)} repository stars · ${compact(pr.forks)} forks`,14,muted);
  return {body,width,height:title.bottom+52};
}
function projectAsset(p,index,options){
  const {width,margin,inner}=dimensions(options.mobile);
  let body=line(margin,1,width-margin,1)+label(margin,31,'Selected work')+text(width-margin,34,'↗',22,muted,'text-anchor="end"');
  if(options.mobile){const card=projectCard(p,margin,77,inner,true,options.animated);return {body:body+card.svg,width,height:card.bottom+8};}
  const title=words(margin,80,p.name,710,31,2,ink,'font-weight="500" letter-spacing="-.5"');body+=title.svg;
  const desc=words(margin,title.bottom+34,p.description,665,18,2,muted);body+=desc.svg;
  const roleY=desc.bottom+32;body+=text(margin,roleY,p.role||'Independent project',13,muted);
  body+=text(margin,roleY+29,(p.stack||[]).join(' / '),15,blue);
  if(p.inputs?.length){
    const x=819,y=92;
    p.inputs.slice(0,3).forEach((name,i)=>{const py=y+i*29;body+=text(x,py,name,14,muted)+`<path d="M${x+57} ${py-5}C931 ${py-5} 932 ${y+24} 962 ${y+24}H985" fill="none" stroke="#cbd5e3"/>`;});
    body+=`<circle cx="994" cy="${y+24}" r="3" fill="${blue}"/><path d="M1002 ${y+24}H1180" stroke="#cbd5e3" fill="none"/><path ${options.animated?'class="flow"':''} d="M1002 ${y+24}H1180" pathLength="100" fill="none" stroke="${blue}" stroke-width="2" stroke-dasharray="2 98"/>`;
    body+=text(994,y+53,'Cross-attention',12,muted,'text-anchor="middle"')+text(1184,y+4,p.output||'Output',14,muted,'text-anchor="end"');
  }
  return {body,width,height:Math.max(roleY+55,215)};
}
function contributionAsset(c,{mobile}){
  const {width,margin,inner}=dimensions(mobile);
  let body=line(margin,1,width-margin,1)+label(margin,31,'Open-source contributions')+text(width-margin,34,'↗',22,muted,'text-anchor="end"');
  const name=words(margin,76,c.name,inner,mobile?26:28,2,ink,'font-weight="500"');body+=name.svg;
  body+=text(margin,name.bottom+34,`${c.count} merged pull requests`,17,blue);
  const summary=words(margin,name.bottom+66,c.summary||'',inner,mobile?18:17,2,muted);body+=summary.svg;
  return {body,width,height:summary.bottom+18};
}
function entryCard(section,item,{mobile}){
  const {width,margin,inner}=dimensions(mobile);
  let body=line(margin,1,width-margin,1)+label(margin,31,section.title.toUpperCase())+text(width-margin,34,'↗',24,blue,'text-anchor="end"');
  const title=words(margin,74,item.title,inner,mobile?26:28,2,ink,'font-weight="500"');body+=title.svg;
  let y=title.bottom+31;
  body+=text(margin,y,`${item.kind.toUpperCase()}${item.date?' · '+date(item.date):''}`,13,blue);
  if(item.summary){const summary=words(margin,y+31,item.summary,inner,mobile?20:18,2,muted);body+=summary.svg;y=summary.bottom;}
  return {body,width,height:y+29};
}
function activityCard(item,index,{mobile}){
  const {width,margin,inner}=dimensions(mobile);
  let body=line(margin,1,width-margin,1);
  if(index===0)body+=label(margin,31,'RECENT WORK');
  const y=index===0?68:35;
  body+=text(margin,y,`${date(item.date)} · ${item.status.toUpperCase()} #${item.number}`,12,blue,'letter-spacing=".4"')+text(width-margin,y,'↗',22,blue,'text-anchor="end"');
  const title=words(margin,y+33,item.title,inner-20,mobile?21:21,2,ink);body+=title.svg;
  const repo=words(margin,title.bottom+27,item.repoName,inner,mobile?16:15,1,muted);body+=repo.svg;
  return {body,width,height:repo.bottom+24};
}

export function buildPresentation(data,config){
  const blocks=[];
  const asset=(id,alt,draw,href=null)=>{
    if(href){const url=new URL(href);if(url.protocol!=='https:'||url.username||url.password)throw new Error('Card links must use public HTTPS URLs');}
    blocks.push({kind:'asset',id,alt,href,render(options={}){const {body,width,height}=draw({mobile:false,animated:true,...options});return frame(body,width,height,alt,options.animated!==false);}});
  };
  asset('profile',`${config.name} — ${config.tagline}; ${data.mergedPullRequests} merged upstream PRs`,options=>header(data,config,options));
  const featured=selectFeaturedProjects(data.projects,config);
  featured.forEach((project,index)=>asset(`project-${index+1}`,`Open ${project.repo} repository`,options=>projectAsset(project,index,options),project.url));
  const selected=new Set(featured.map(project=>project.repo));
  const others=data.projects.filter(project=>!selected.has(project.repo));
  if(others.length&&config.projects.showMore!==false)blocks.push({kind:'repositories',items:others});
  data.contributions.slice(0,3).forEach((contribution,index)=>{
    asset(`contribution-${index+1}`,`Open ${contribution.repo} repository and its contributions`,options=>contributionAsset(contribution,options),`https://github.com/${contribution.repo}`);
    if(contribution.pulls.length)blocks.push({kind:'contribution-links',contribution});
  });
  const proposal=data.openSpotlight||(data.spotlight?.status==='open'?data.spotlight:null);
  if(proposal)asset('open-pr',`View open PR #${proposal.number} in ${proposal.repo}`,options=>prCard(proposal,'Open proposal',options),proposal.url);
  if(data.showcase){
    data.showcase.sections.forEach((section,i)=>section.items.slice(0,data.showcase.maxVisible).forEach((item,j)=>asset(`showcase-${i+1}-${j+1}`,`Open ${item.title}`,options=>entryCard(section,item,options),item.url)));
    const empty=data.showcase.sections.filter(section=>!section.items.length);
    if(empty.length&&data.showcase.emptyMode!=='hidden')asset('future-areas','Reserved areas for future public work',({mobile})=>{
      const {width,margin,inner}=dimensions(mobile);
      const result=renderShowcase({...data.showcase,sections:empty,emptyMode:'compact',title:'FUTURE AREAS'},margin,1,inner,mobile);
      return {body:result.svg,width,height:result.bottom+14};
    });
  }
  if(data.impact?.sampleSize)asset('impact',`Contribution impact across ${data.impact.sampleSize} merged PRs`,({mobile})=>{
    const {width,margin}=dimensions(mobile),d=data.impact;
    const value=`+${d.additions.toLocaleString('en-US')} / −${d.deletions.toLocaleString('en-US')} lines · ${d.fileChanges} file changes`;
    const body=line(margin,1,width-margin,1)+label(margin,30,'Contribution footprint')+text(mobile?margin:width-margin,mobile?61:30,value,mobile?17:17,ink,mobile?'':'text-anchor="end"')+text(margin,mobile?88:59,`Cumulative diff across ${d.sampleSize} merged PRs`,12,muted);
    return {body,width,height:mobile?112:82};
  });
  const covered=new Set([...data.contributions.flatMap(c=>c.pulls.map(p=>p.url)),...(proposal?[proposal.url]:[])]);
  (data.activity||[]).filter(item=>!covered.has(item.url)).forEach((item,i)=>asset(`activity-${i+1}`,`Open PR #${item.number}: ${item.title}`,options=>activityCard(item,i,options),item.url));
  asset('footer','Public GitHub data refresh date',({mobile})=>{
    const {width,margin}=dimensions(mobile);const updated=data.updatedAt?`UPDATED ${date(data.updatedAt)}`:'AUTOMATIC UPDATES';
    return {body:line(margin,1,width-margin,1)+text(margin,31,'PUBLIC GITHUB DATA',10,muted,'letter-spacing="1"')+text(width-margin,31,updated,10,muted,'text-anchor="end"'),width,height:51};
  });
  return blocks;
}
