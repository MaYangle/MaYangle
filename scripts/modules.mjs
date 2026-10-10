import {xml,wrap,compact} from './format.mjs';
import {gauge,wave,projectCard} from './canvas.mjs';
import {renderImpact} from './sections.mjs';
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
function dimensions(mobile){return {width:mobile?600:1200,margin:mobile?30:56,inner:mobile?540:1088};}
function header(data,config,{mobile,animated}){
  const {width,margin,inner}=dimensions(mobile);
  let body=label(margin,35,'PROFILE')+text(mobile?width-margin:838,35,`@${config.username}`,12,muted,'text-anchor="end"');
  body+=text(margin,mobile?103:116,config.name.toUpperCase(),mobile?49:66,ink,'font-weight="600" letter-spacing="-1.8"')+text(margin,mobile?141:157,config.tagline,mobile?21:24,blue);
  if(mobile){
    body+=line(margin,175,width-margin,175)+gauge(155,315,data.mergedPullRequests,animated);
    body+=text(365,268,String(data.projects.length).padStart(2,'0'),47,ink)+label(365,295,'PUBLIC PROJECTS');
    body+=text(365,364,String(data.openPullRequests).padStart(2,'0'),47,ink)+label(365,391,'OPEN PRS');
    body+=wave(margin,452,inner,animated);
    return {body,width,height:492};
  }
  body+=gauge(1026,125,data.mergedPullRequests,animated)+line(margin,244,width-margin,244);
  body+=text(margin,307,String(data.projects.length).padStart(2,'0'),48,ink)+label(margin+90,299,'PUBLIC PROJECTS');
  body+=text(398,307,String(data.openPullRequests).padStart(2,'0'),48,ink)+label(488,299,'OPEN PRS');
  body+=label(748,280,'TOOLS IN USE')+text(748,307,(config.stack||[]).join(' / '),17,ink);
  body+=wave(margin,354,inner,animated);
  return {body,width,height:397};
}
function prCard(pr,role,{mobile}){
  const {width,margin,inner}=dimensions(mobile);
  let body=line(margin,1,width-margin,1)+label(margin,31,role)+text(width-margin,34,'↗',24,blue,'text-anchor="end"');
  const name=words(margin,76,pr.repoName,mobile?inner:inner-320,mobile?26:29,2,ink,'font-weight="600"');body+=name.svg;
  const statusY=name.bottom+31;
  body+=text(margin,statusY,`${pr.status.toUpperCase()} PR #${pr.number}`,13,blue,'font-weight="600" letter-spacing=".5"');
  const title=words(margin,statusY+31,pr.title,mobile?inner:inner-320,mobile?20:18,2,muted);body+=title.svg;
  if(mobile){body+=text(margin,title.bottom+32,`${compact(pr.stars)} repo stars · ${compact(pr.forks)} forks`,15,muted);return {body,width,height:title.bottom+59};}
  body+=text(width-margin,85,compact(pr.stars),39,ink,'text-anchor="end" letter-spacing="-1"')+text(width-margin,112,`REPOSITORY STARS · ${compact(pr.forks)} FORKS`,12,muted,'text-anchor="end" letter-spacing=".6"');
  return {body,width,height:Math.max(title.bottom+28,157)};
}
function projectAsset(p,index,options){
  const {width,margin,inner}=dimensions(options.mobile);
  let body=line(margin,1,width-margin,1)+label(margin,31,`FEATURED PROJECT / ${String(index+1).padStart(2,'0')}`)+text(width-margin,34,'↗',24,blue,'text-anchor="end"');
  const card=projectCard(p,margin,76,inner,options.mobile,options.animated);body+=card.svg;
  return {body,width,height:card.bottom+13};
}
function contributionAsset(c,{mobile}){
  const {width,margin,inner}=dimensions(mobile);
  let body=line(margin,1,width-margin,1)+label(margin,31,'MERGED CONTRIBUTIONS')+text(width-margin,34,'↗',24,blue,'text-anchor="end"');
  const name=words(margin,76,c.name,inner,mobile?26:28,2,ink,'font-weight="600"');body+=name.svg;
  body+=text(margin,name.bottom+34,`${c.count} merged pull requests`,20,blue);
  const columns=mobile?1:2,rows=Math.ceil(c.pulls.length/columns),cw=(inner-48*(columns-1))/columns,start=name.bottom+81;
  let bottom=start;
  for(let col=0;col<columns;col++){
    const x=margin+col*(cw+48);let y=start;
    for(const pr of c.pulls.slice(col*rows,(col+1)*rows)){
      body+=`<circle cx="${x+4}" cy="${y-6}" r="3" fill="${blue}"/>`+text(x+17,y,`#${pr.number}`,12,blue);
      const title=words(x+58,y,pr.title,cw-58,mobile?19:18,2,muted);body+=title.svg;y=title.bottom+37;
    }
    bottom=Math.max(bottom,y);
  }
  if(c.count>c.pulls.length){body+=text(margin,bottom,`+ ${c.count-c.pulls.length} more merged PRs`,13,muted);bottom+=25;}
  return {body,width,height:bottom+12};
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
  if(data.spotlight)asset('merged-pr',`View ${data.spotlight.status} PR #${data.spotlight.number} in ${data.spotlight.repo}`,options=>prCard(data.spotlight,data.spotlight.status==='merged'?'LATEST MERGED PR':'RECENT OPEN PR',options),data.spotlight.url);
  if(data.openSpotlight)asset('open-pr',`View open PR #${data.openSpotlight.number} in ${data.openSpotlight.repo}`,options=>prCard(data.openSpotlight,'OPEN PROPOSAL',options),data.openSpotlight.url);
  const featured=selectFeaturedProjects(data.projects,config);
  featured.forEach((project,index)=>asset(`project-${index+1}`,`Open ${project.repo} repository`,options=>projectAsset(project,index,options),project.url));
  const selected=new Set(featured.map(project=>project.repo));
  const others=data.projects.filter(project=>!selected.has(project.repo));
  if(others.length&&config.projects.showMore!==false)blocks.push({kind:'repositories',items:others});
  data.contributions.slice(0,3).forEach((contribution,index)=>asset(`contribution-${index+1}`,`Open ${contribution.repo} repository and its contributions`,options=>contributionAsset(contribution,options),`https://github.com/${contribution.repo}`));
  if(data.showcase){
    data.showcase.sections.forEach((section,i)=>section.items.slice(0,data.showcase.maxVisible).forEach((item,j)=>asset(`showcase-${i+1}-${j+1}`,`Open ${item.title}`,options=>entryCard(section,item,options),item.url)));
    const empty=data.showcase.sections.filter(section=>!section.items.length);
    if(empty.length&&data.showcase.emptyMode!=='hidden')asset('future-areas','Reserved areas for future public work',({mobile})=>{
      const {width,margin,inner}=dimensions(mobile);
      const result=renderShowcase({...data.showcase,sections:empty,emptyMode:'compact',title:'FUTURE AREAS'},margin,1,inner,mobile);
      return {body:result.svg,width,height:result.bottom+14};
    });
  }
  if(data.impact?.sampleSize)asset('impact',`Contribution impact across ${data.impact.sampleSize} merged PRs`,({mobile})=>{const {width,margin,inner}=dimensions(mobile);const result=renderImpact(data,margin,1,inner,mobile);return {body:result.svg,width,height:result.bottom};});
  (data.activity||[]).forEach((item,i)=>asset(`activity-${i+1}`,`Open PR #${item.number}: ${item.title}`,options=>activityCard(item,i,options),item.url));
  asset('footer','Public GitHub data refresh date',({mobile})=>{
    const {width,margin}=dimensions(mobile);const updated=data.updatedAt?`UPDATED ${date(data.updatedAt)}`:'AUTOMATIC UPDATES';
    return {body:line(margin,1,width-margin,1)+text(margin,31,'PUBLIC GITHUB DATA',10,muted,'letter-spacing="1"')+text(width-margin,31,updated,10,muted,'text-anchor="end"'),width,height:51};
  });
  return blocks;
}
