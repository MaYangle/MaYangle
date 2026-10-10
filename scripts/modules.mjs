import {xml,wrap,compact} from './format.mjs';
import {projectCard,contributionCard} from './canvas.mjs';
import {renderShowcaseModule} from './showcase.mjs';
import {renderImpact} from './sections.mjs';
import {renderContributionTelemetry} from './neural-tide.mjs';

const ink='#17232f',muted='#667583',blue='#4264e8',rule='#e1e7ed';
const text=(x,y,value,size=18,color=ink,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${xml(value)}</text>`;
const line=(x,y,x2,y2)=>`<path d="M${x} ${y}L${x2} ${y2}" stroke="${rule}" fill="none"/>`;
const label=(x,y,value)=>text(x,y,value,17,muted,'font-weight="600" letter-spacing="1.1"');
const date=value=>new Date(value).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Shanghai'}).toUpperCase();
const searchPulls=query=>`https://github.com/search?q=${encodeURIComponent(query)}&type=pullrequests`;
function frame(body,width,height,alt,animated){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${xml(alt)}</title><style>text{font-family:Arial,Helvetica,sans-serif}${animated?'.wave{animation:wave 12s ease-in-out infinite}.flow{animation:flow 6s linear infinite}.core{transform-box:fill-box;transform-origin:center;animation:corePulse 3.2s ease-in-out infinite}@keyframes wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@keyframes flow{to{stroke-dashoffset:-100}}@keyframes corePulse{0%,100%{transform:scale(.94);opacity:.78}50%{transform:scale(1.08);opacity:1}}@media(prefers-reduced-motion:reduce){.wave,.flow,.core{animation:none!important}}':''}</style><rect width="${width}" height="${height}" fill="#fff"/>${body}</svg>\n`;
}

function prModule(pr,role,mobile=false){
  const width=mobile?300:600,x=mobile?24:48,contentWidth=width-x*2;
  const displayRole=mobile&&role==='RECENTLY RESOLVED PR'?'RESOLVED PR':role;
  let body=line(x,1,width-x,1)+text(x,31,displayRole,mobile?21:17,muted,'font-weight="600" letter-spacing="1.1"');
  if(!pr){
    body+=text(x,78,'Building in public',mobile?34:24,ink)+text(x,108,'New work will appear here automatically.',mobile?23:18,muted);
    return {body,width,height:144};
  }
  const proposal=role==='RECENTLY RESOLVED PR';
  const titleSize=mobile?(proposal?30:26):(proposal?28:26),titleGap=Math.round(titleSize*1.3);
  const title=wrap(pr.repoName,contentWidth,titleSize,mobile?3:2);
  title.forEach((part,i)=>body+=text(x,74+i*titleGap,part,titleSize,ink,'font-weight="600" letter-spacing="-.3"'));
  const bottom=74+(title.length-1)*titleGap;
  const statusSize=mobile?(proposal?22:20):(proposal?18:17),detailSize=mobile?(proposal?24:21):(proposal?21:20);
  body+=text(x,bottom+(proposal?37:32),`${pr.status.toUpperCase()} PR #${pr.number}`,statusSize,blue,'font-weight="600" letter-spacing=".6"');
  const detail=wrap(pr.title,contentWidth,detailSize,2);
  detail.forEach((part,i)=>body+=text(x,bottom+(proposal?72:62)+i*(proposal?detailSize*1.4:24),part,detailSize,muted));
  if(proposal){
    const statsY=bottom+72+(detail.length-1)*(proposal?detailSize*1.4:24)+54;
    const starSize=mobile?50:43,forkSize=mobile?32:27,captionSize=mobile?16:16;
    const forkX=x+(mobile?198:238),visibleForkSize=mobile?26:forkSize;
    body+=text(x,statsY,compact(pr.stars),starSize,blue,'font-weight="500" letter-spacing="-1.2"');
    body+=text(x,statsY+captionSize+5,'REPOSITORY STARS',captionSize,muted,'font-weight="600" letter-spacing="1.3"');
    body+=text(forkX,statsY-3,compact(pr.forks),visibleForkSize,ink,'font-weight="500" letter-spacing="-.6"');
    body+=text(forkX,statsY+captionSize+5,'FORKS',captionSize,muted,'font-weight="600" letter-spacing="1.3"');
    return {body,width,height:statsY+49};
  }
  const statsY=bottom+62+(detail.length-1)*(mobile?detailSize*1.4:24)+29;
  body+=text(x,statsY,`${compact(pr.stars)} repository stars  ·  ${compact(pr.forks)} forks`,mobile?21:17,muted);
  return {body,width,height:statsY+27};
}

function identity(data,config){
  const width=1200,margin=56;
  let body=label(margin,35,'PROFILE')+text(width-margin,35,`@${data.username||config.username}`,16,muted,'text-anchor="end"');
  body+=text(margin,116,config.name.toUpperCase(),66,ink,'font-weight="600" letter-spacing="-1.8"')+text(margin,157,config.tagline,24,blue,'letter-spacing="-.2"');
  return {body,width,height:181};
}

function contributionRecord(data,animated,mobile=false){
  return renderContributionTelemetry(data,{mobile,animated});
}

function metrics(data,config,mobile=false){
  if(mobile){
    const width=600,margin=30;
    let body=`<path d="M${margin} 1Q300 -31 ${width-margin} 1" stroke="${rule}" fill="none"/>`;
    body+=text(margin,61,String(data.projects.length).padStart(2,'0'),36,ink,'letter-spacing="-1.2"')+text(margin+78,53,'PUBLIC PROJECTS',18,muted,'font-weight="600" letter-spacing=".8"');
    body+=text(330,61,String(data.openPullRequests).padStart(2,'0'),36,ink,'letter-spacing="-1.2"')+text(408,53,'OPEN PRS',18,muted,'font-weight="600" letter-spacing=".8"');
    body+=text(margin,112,'TOOLS IN USE',18,muted,'font-weight="600" letter-spacing=".8"')+text(margin,147,(config.stack||[]).join(' / '),20,ink);
    return {body,width,height:171};
  }
  const width=1200,margin=56,y=1;
  let body=`<path d="M${margin} ${y}Q600 ${y-42} ${width-margin} ${y}" stroke="${rule}" fill="none"/>`;
  body+=text(margin,y+61,String(data.projects.length).padStart(2,'0'),47,ink,'letter-spacing="-1.2"')+text(margin+91,y+53,'PUBLIC PROJECTS',18,muted,'font-weight="600" letter-spacing=".8"');
  body+=text(409,y+61,String(data.openPullRequests).padStart(2,'0'),47,ink,'letter-spacing="-1.2"')+text(500,y+53,'OPEN PRS',18,muted,'font-weight="600" letter-spacing=".8"');
  body+=text(786,y+34,'TOOLS IN USE',18,muted,'font-weight="600" letter-spacing=".8"')+text(786,y+62,(config.stack||[]).join(' / '),18,ink);
  body+=line(margin,y+96,width-margin,y+96);
  return {body,width,height:116};
}

function projectModule(project,index,first,mobile=false,animated=true,wide=false){
  const width=wide?(mobile?600:1200):(mobile?300:600),x=wide?(mobile?56:112):(mobile?28:56),contentWidth=width-x*2,y=mobile?55:78;
  let body='';
  if(first)body+=text(x,mobile?28:35,'SELECTED PROJECTS',mobile?22:17,muted,'font-weight="600" letter-spacing="1.1"');
  if(mobile){
    const name=wrap(project.name,contentWidth,22,3);
    name.forEach((part,i)=>body+=text(x,y+27+i*28,part,22,ink,'font-weight="600" letter-spacing="-.3"'));
    const nameBottom=y+27+(name.length-1)*28;
    const description=wrap(project.description,contentWidth,19,3);
    description.forEach((part,i)=>body+=text(x,nameBottom+57+i*24,part,19,muted));
    const detailY=nameBottom+57+(description.length-1)*24+32;
    body+=text(x,detailY,(project.role||(project.fork?'Working fork':'Independent project')).toUpperCase(),15,muted,'letter-spacing=".6"');
    let row=detailY+30;
    (project.inputs||[]).slice(0,3).forEach((input,i)=>{
      body+=text(x,row,input.toUpperCase(),17,muted,'letter-spacing=".5"');
      if(project.encoders?.[i])body+=text(x+96,row,project.encoders[i],17,muted);
      row+=29;
    });
    if(project.inputs?.length){body+=line(x,row-10,x+contentWidth,row-10,blue,'stroke-opacity=".3"')+text(x+contentWidth,row+14,(project.output||'OUTPUT').toUpperCase(),15,blue,'text-anchor="end" letter-spacing=".5"');row+=35;}
    if(project.stack?.length)wrap(project.stack.join(' / '),contentWidth,18,2).forEach((part,i)=>body+=text(x,row+i*21,part,18,blue));
    row+=project.stack?.length?35:12;
    body+=line(x,row-8,x+contentWidth,row-8)+text(x,row+17,`${compact(project.stars||0)} STARS  ·  ${compact(project.forks||0)} FORKS  ·  ${(project.language||'PUBLIC REPOSITORY').toUpperCase()}`,16,muted,'letter-spacing=".3"');
    return {body,width,height:Math.max(210,row+34)};
  }
  const card=projectCard(project,x,y,contentWidth,mobile,animated);body+=card.svg;
  const metaY=card.bottom+20;
  body+=line(x,metaY-8,x+contentWidth,metaY-8)+text(x,metaY+16,`${compact(project.stars||0)} STARS  ·  ${compact(project.forks||0)} FORKS  ·  ${(project.language||'PUBLIC REPOSITORY').toUpperCase()}`,16,muted,'letter-spacing=".3"');
  return {body,width,height:Math.max(metaY+33,first?150:0)};
}

function contributionModule(contributions,first,mobile=false,wide=false){
  const width=wide?(mobile?600:1200):(mobile?300:600),x=wide?(mobile?48:96):(mobile?24:48),contentWidth=width-x*2,y=mobile?55:78;
  let body='';
  if(first)body+=text(x,mobile?28:35,mobile?'CONTRIBUTIONS':'CONTRIBUTION RECORDS',mobile?21:17,muted,'font-weight="600" letter-spacing="1.1"');
  const card=contributionCard({groups:contributions},x,y,contentWidth,mobile);body+=card.svg;
  return {body,width,height:Math.max(card.bottom+14,first?150:0)};
}

function emptyModule(title,message,mobile=false,wide=false){
  const width=wide?(mobile?600:1200):(mobile?300:600),x=wide?(mobile?48:96):(mobile?24:48);
  const body=text(x,mobile?28:35,title,mobile?21:17,muted,'font-weight="600" letter-spacing="1.1"')+text(x,mobile?66:82,message,mobile?27:22,muted);
  return {body,width,height:125};
}

function showcaseModule(section,index,data,config,mobile=false){
  const width=mobile?300:600;
  const result=renderShowcaseModule(section,width,mobile,data.showcase.maxVisible,index===0);
  const first=section.items?.[0];
  const topics=section.autoTopics||[];
  const query=topics.map(topic=>`topic:${topic}`).join(' ');
  const href=first?.url||(query?`https://github.com/search?q=${encodeURIComponent(`user:${config.username} ${query}`)}&type=repositories`:`https://github.com/${config.username}?tab=repositories`);
  return {id:`showcase-${index+1}`,alt:`${section.title}; ${first?first.title:'No public entry yet'}`,href,draw:()=>({body:result.svg,width,height:result.bottom+12})};
}

function impactModule(data,mobile=false){
  const width=mobile?600:1200,result=renderImpact(data,mobile?30:56,1,mobile?540:1088,mobile);
  return {body:result.svg,width,height:Math.max(170,result.bottom+14)};
}

function footer(data,mobile=false){
  const width=mobile?600:1200,margin=mobile?30:56;
  const updated=data.updatedAt?`UPDATED ${date(data.updatedAt)}`:'AUTOMATIC UPDATES';
  const font=mobile?18:14;
  return {body:line(margin,1,width-margin,1)+text(margin,31,'PUBLIC GITHUB DATA',font,muted,'letter-spacing="1"')+text(width-margin,31,updated,font,muted,'text-anchor="end" letter-spacing=".5"'),width,height:49};
}

export function buildModules(data,config){
  const owner=`https://github.com/${config.username}`;
  const mergedUrl=searchPulls(`author:${config.username} is:pr is:merged is:public -user:${config.username}`);
  const resolvedUrl=searchPulls(`author:${config.username} is:pr is:closed is:public -user:${config.username}`);
  const blocks=[];
  const add=(id,alt,href,draw)=>blocks.push({id,alt,href,draw});
  add('identity',`${config.name} — ${config.tagline}`,owner,()=>identity(data,config));
  const closedRecords=(data.contributions||[]).reduce((sum,group)=>sum+(group.closedCount||0),0);
  const resolvedRecords=data.mergedPullRequests+closedRecords;
  add('contribution-record',`${resolvedRecords} merged or closed upstream pull requests`,resolvedUrl,({animated=true,mobile=false}={})=>contributionRecord(data,animated,mobile));
  const displayedSpotlight=data.spotlight?.status==='open'?null:data.spotlight;
  add('spotlight',displayedSpotlight?`Latest resolved contribution: PR #${displayedSpotlight.number} in ${displayedSpotlight.repo}`:'No resolved upstream PR yet',displayedSpotlight?.url||owner,({mobile=false}={})=>prModule(displayedSpotlight,displayedSpotlight?.status==='merged'?'LATEST MERGED PR':displayedSpotlight?'LATEST CLOSED PR':'LATEST CONTRIBUTION',mobile));
  if(data.resolvedSpotlight)add('resolved-pr',`${data.resolvedSpotlight.status==='merged'?'Merged':'Closed'} PR #${data.resolvedSpotlight.number} in ${data.resolvedSpotlight.repo}`,data.resolvedSpotlight.url,({mobile=false}={})=>prModule(data.resolvedSpotlight,'RECENTLY RESOLVED PR',mobile));
  add('metrics',`${data.projects.length} public projects and ${data.openPullRequests} open pull requests`,`${owner}?tab=repositories`,({mobile=false}={})=>metrics(data,config,mobile));
  if(data.projects.length){
    data.projects.slice(0,config.projects.maxVisible).forEach((project,index)=>add(`project-${index+1}`,`Open ${project.repo}`,project.url,({mobile=false,animated=true}={})=>projectModule(project,index,index===0,mobile,animated,true)));
  }else add('project-empty','No public projects yet',`${owner}?tab=repositories`,({mobile=false}={})=>emptyModule('SELECTED PROJECTS','New public projects will appear here.',mobile,true));
  if(data.contributions.length){
    add('contribution-records',`Merged and closed pull requests across ${data.contributions.length} repositories`,resolvedUrl,({mobile=false}={})=>contributionModule(data.contributions,true,mobile,true));
  }else add('contribution-empty','No merged contributions yet',mergedUrl,({mobile=false}={})=>emptyModule('CONTRIBUTION RECORDS','Open-source work in progress.',mobile,true));
  (data.showcase?.sections||[]).forEach((section,index)=>{
    const module=showcaseModule(section,index,data,config);
    module.draw=({mobile=false}={})=>{
      const width=mobile?300:600;
      const result=renderShowcaseModule(section,width,mobile,data.showcase.maxVisible,index===0);
      return {body:result.svg,width,height:result.bottom+12};
    };
    add(module.id,module.alt,module.href,module.draw);
  });
  if(data.impact?.sampleSize)add('impact',`Diff impact across ${data.impact.sampleSize} merged pull requests`,mergedUrl,({mobile=false}={})=>impactModule(data,mobile));
  add('footer','Public GitHub data refresh date',owner,({mobile=false}={})=>footer(data,mobile));
  const alignRows=(items,columns,bottomRule=false)=>{
    for(let i=0;i<items.length;i+=columns){
      const row=items.slice(i,i+columns),heights={};
      for(const [key,options] of [['desktop',{mobile:false,animated:true}],['mobile',{mobile:true,animated:true}]]){
        heights[key]=Math.max(...row.map(module=>module.draw(options).height));
      }
      row.forEach(module=>{module.layoutHeights=heights;if(bottomRule)module.bottomRule=true;});
    }
  };
  alignRows(blocks.filter(module=>/^showcase-\d+$/.test(module.id)),2);
  for(const module of blocks){
    const url=new URL(module.href);
    if(url.protocol!=='https:'||url.username||url.password)throw new Error('Dashboard modules need public HTTPS links');
  }
  return blocks;
}

export function renderModule(module,options={}){
  const mobile=options.mobile===true,{body,width,height}=module.draw({mobile:false,animated:true,...options});
  const targetHeight=Math.max(height,module.layoutHeights?.[mobile?'mobile':'desktop']||height);
  const finalBody=module.bottomRule?body+line(mobile?16:20,targetHeight-1,width-(mobile?16:20),targetHeight-1):body;
  return frame(finalBody,width,targetHeight,module.alt,options.animated!==false);
}
