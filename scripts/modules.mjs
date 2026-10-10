import {xml,wrap,compact} from './format.mjs';
import {projectCard,contributionCard} from './canvas.mjs';
import {renderShowcaseModule} from './showcase.mjs';
import {renderImpact} from './sections.mjs';

const ink='#17232f',muted='#667583',blue='#4264e8',rule='#e1e7ed';
const text=(x,y,value,size=18,color=ink,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${xml(value)}</text>`;
const line=(x,y,x2,y2)=>`<path d="M${x} ${y}L${x2} ${y2}" stroke="${rule}" fill="none"/>`;
const label=(x,y,value)=>text(x,y,value,13,muted,'font-weight="600" letter-spacing="1.3"');
const date=value=>new Date(value).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Shanghai'}).toUpperCase();
const searchPulls=query=>`https://github.com/search?q=${encodeURIComponent(query)}&type=pullrequests`;
function repositorySignalName(name,width,size){
  const key=name.toLowerCase();
  if(key.includes('bilingual-multimodal-sentiment')||key.includes('bilingual multimodal sentiment'))return 'BILINGUAL MSA';
  if(key.includes('ai-engineering-from-scratch')||key.includes('ai engineering from scratch'))return 'AI ENGINEERING';
  return wrap(name.toUpperCase(),width,size,1)[0];
}

function frame(body,width,height,alt,animated){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title"><title id="title">${xml(alt)}</title><style>text{font-family:Arial,Helvetica,sans-serif}${animated?'.wave{animation:wave 12s ease-in-out infinite}.flow{animation:flow 12s linear infinite}@keyframes wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@keyframes flow{to{stroke-dashoffset:-100}}@media(prefers-reduced-motion:reduce){.wave,.flow{animation:none!important}}':''}</style><rect width="${width}" height="${height}" fill="#fff"/>${body}</svg>\n`;
}

function prModule(pr,role,mobile=false){
  const width=mobile?300:600,x=mobile?24:48,contentWidth=width-x*2;
  let body=line(x,1,width-x,1)+text(x,31,role,mobile?19:13,muted,'font-weight="600" letter-spacing="1.3"');
  if(!pr){
    body+=text(x,78,'Building in public',mobile?34:24,ink)+text(x,108,'New work will appear here automatically.',mobile?22:15,muted);
    return {body,width,height:144};
  }
  const proposal=role==='RECENTLY RESOLVED PR';
  const titleSize=mobile?(proposal?28:24):(proposal?27:24),titleGap=Math.round(titleSize*1.3);
  const title=wrap(pr.repoName,contentWidth,titleSize,mobile?3:2);
  title.forEach((part,i)=>body+=text(x,74+i*titleGap,part,titleSize,ink,'font-weight="600" letter-spacing="-.3"'));
  const bottom=74+(title.length-1)*titleGap;
  const statusSize=mobile?(proposal?19:17):(proposal?15:13),detailSize=mobile?(proposal?21:18):(proposal?19:17);
  body+=text(x,bottom+(proposal?37:32),`${pr.status.toUpperCase()} PR #${pr.number}`,statusSize,blue,'font-weight="600" letter-spacing=".6"');
  const detail=wrap(pr.title,contentWidth,detailSize,2);
  detail.forEach((part,i)=>body+=text(x,bottom+(proposal?72:62)+i*(proposal?detailSize*1.4:24),part,detailSize,muted));
  if(proposal){
    const statsY=bottom+72+(detail.length-1)*(proposal?detailSize*1.4:24)+54;
    const starSize=mobile?50:43,forkSize=mobile?32:27,captionSize=mobile?15:12;
    const forkX=x+(mobile?191:238),visibleForkSize=mobile?27:forkSize;
    body+=text(x,statsY,compact(pr.stars),starSize,blue,'font-weight="500" letter-spacing="-1.2"');
    body+=text(x,statsY+captionSize+5,'REPOSITORY STARS',captionSize,muted,'font-weight="600" letter-spacing="1.3"');
    body+=text(forkX,statsY-3,compact(pr.forks),visibleForkSize,ink,'font-weight="500" letter-spacing="-.6"');
    body+=text(forkX,statsY+captionSize+5,'FORKS',captionSize,muted,'font-weight="600" letter-spacing="1.3"');
    return {body,width,height:statsY+49};
  }
  const statsY=bottom+62+(detail.length-1)*(mobile?detailSize*1.4:24)+29;
  body+=text(x,statsY,`${compact(pr.stars)} repository stars  ·  ${compact(pr.forks)} forks`,mobile?19:13,muted);
  return {body,width,height:statsY+27};
}

function identity(data,config){
  const width=1200,margin=56;
  let body=label(margin,35,'PROFILE')+text(width-margin,35,`@${data.username||config.username}`,12,muted,'text-anchor="end"');
  body+=text(margin,116,config.name.toUpperCase(),66,ink,'font-weight="600" letter-spacing="-1.8"')+text(margin,157,config.tagline,24,blue,'letter-spacing="-.2"');
  return {body,width,height:181};
}

function contributionRecord(data,animated,mobile=false){
  const width=mobile?300:600,margin=mobile?18:56;
  const groups=(data.contributions||[]).slice(0,3);
  const mergedRepositories=groups.filter(group=>group.count>0).length;
  const closed=(data.contributions||[]).reduce((sum,group)=>sum+(group.closedCount||0),0);
  const repositories=groups.length;
  let body=text(margin,mobile?29:35,'CONTRIBUTION RECORDS',mobile?19:16,muted,'font-weight="600" letter-spacing="1.2"');
  body+=line(margin,mobile?45:53,width-margin,mobile?45:53);
  if(mobile){
    const metricY=110;
    body+=text(margin,metricY,String(data.mergedPullRequests).padStart(2,'0'),48,blue,'font-weight="400" letter-spacing="-1.2"');
    body+=text(159,metricY,String(closed).padStart(2,'0'),48,ink,'font-weight="400" letter-spacing="-1.2"');
    body+=text(margin,metricY+25,'MERGED',15,muted,'font-weight="600" letter-spacing=".8"')+text(159,metricY+25,'CLOSED',15,muted,'font-weight="600" letter-spacing=".8"');
    body+=text(margin,metricY+58,`${String(repositories).padStart(2,'0')} CONTRIBUTING REPOSITORIES`,14,muted,'letter-spacing=".4"');
    const sourceX=margin+7,hubX=margin+61,nodeX=margin+82,startY=252,gap=100;
    body+=`<rect x="${sourceX}" y="${startY-12}" width="42" height="36" fill="#fff" stroke="#b9c9f4"/>`+text(sourceX+7,startY+3,'PR',13,blue,'font-weight="600" letter-spacing=".6"');
    body+=`<path d="M${sourceX+42} ${startY+6}H${hubX}V${startY+6+(groups.length-1)*gap}" fill="none" stroke="#cbd7f2" stroke-width="1.5"/>`;
    groups.forEach((group,index)=>{
      const y=startY+6+index*gap,label=repositorySignalName(group.name,132,14);
      const path=`M${hubX} ${y}H${nodeX}`;
      body+=`<path d="${path}" fill="none" stroke="#cbd7f2" stroke-width="1.5"/><path ${animated?'class="flow"':''} d="${path}" pathLength="100" fill="none" stroke="${blue}" stroke-width="2" stroke-dasharray="2 98"/>`;
      body+=`<rect x="${nodeX-5}" y="${y-5}" width="10" height="10" fill="#fff" stroke="${blue}" stroke-width="1.5"/>`;
      body+=text(nodeX+12,y-1,label,14,ink,'font-weight="600" letter-spacing=".2"');
      body+=text(nodeX+12,y+18,`${group.count||0} MERGED`,13,muted,'letter-spacing=".25"')+text(nodeX+12,y+35,`${group.closedCount||0} CLOSED`,13,muted,'letter-spacing=".25"');
    });
    const signalY=Math.max(478,startY+groups.length*gap+13);
    body+=`<path d="M${margin} ${signalY}H${width-margin}" stroke="#dce5f5" fill="none"/><path ${animated?'class="flow"':''} d="M${margin} ${signalY}H${width-margin}" pathLength="100" fill="none" stroke="${blue}" stroke-opacity=".65" stroke-dasharray="2 98"/>`;
    return {body,width,height:signalY+22};
  }
  const graphLeft=margin,hubX=152,nodeX=184,startY=122,gap=91;
  body+=text(graphLeft,84,'PUBLIC REPOSITORY NETWORK',13,muted,'font-weight="600" letter-spacing=".8"');
  const sourceY=startY+Math.max(0,(groups.length-1)*gap/2);
  body+=`<rect x="${graphLeft}" y="${sourceY-22}" width="60" height="46" fill="#fff" stroke="#b9c9f4" stroke-width="1.2"/>`;
  body+=text(graphLeft+8,sourceY-2,'PR',15,blue,'font-weight="600" letter-spacing=".6"')+text(graphLeft+8,sourceY+14,'FLOW',11,muted,'font-weight="600" letter-spacing=".8"');
  body+=`<path d="M${graphLeft+60} ${sourceY+1}H${hubX}V${startY+(groups.length-1)*gap/2}" fill="none" stroke="#cbd7f2" stroke-width="1.5"/>`;
  groups.forEach((group,index)=>{
    const y=startY+index*gap,repoName=repositorySignalName(group.name,125,14);
    const path=`M${hubX} ${y}H${nodeX}`;
    body+=`<path d="${path}" fill="none" stroke="#cbd7f2" stroke-width="1.5"/><path ${animated?'class="flow"':''} d="${path}" pathLength="100" fill="none" stroke="${blue}" stroke-width="2" stroke-dasharray="2 98"/>`;
    body+=`<rect x="${nodeX-6}" y="${y-6}" width="12" height="12" fill="#fff" stroke="${blue}" stroke-width="1.5"/>`;
    body+=text(nodeX+19,y-1,repoName,14,ink,'font-weight="600" letter-spacing=".3"');
    body+=text(nodeX+19,y+19,`${String(group.count||0).padStart(2,'0')} MERGED`,13,muted,'letter-spacing=".2"')+text(nodeX+19,y+36,`${String(group.closedCount||0).padStart(2,'0')} CLOSED`,13,muted,'letter-spacing=".2"');
  });
  const junctionY=startY+(groups.length-1)*gap/2;
  body+=`<path d="M${nodeX+7} ${junctionY}H335" fill="none" stroke="#cbd7f2" stroke-width="1.5"/><path ${animated?'class="flow"':''} d="M${nodeX+7} ${junctionY}H335" pathLength="100" fill="none" stroke="${blue}" stroke-width="2" stroke-dasharray="2 98"/><path d="M335 75V304" stroke="${rule}" fill="none"/>`;
  const metricX=359;
  body+=text(metricX,138,String(data.mergedPullRequests).padStart(2,'0'),58,blue,'font-weight="400" letter-spacing="-1.6"')+text(metricX,164,'MERGED',15,muted,'font-weight="600" letter-spacing=".8"');
  body+=text(465,138,String(closed).padStart(2,'0'),58,ink,'font-weight="400" letter-spacing="-1.6"')+text(465,164,'CLOSED',15,muted,'font-weight="600" letter-spacing=".8"');
  body+=line(metricX,204,width-margin,204)+text(metricX,236,String(repositories).padStart(2,'0'),23,blue,'font-weight="500"')+text(metricX+38,236,'REPOSITORIES',13,muted,'font-weight="600" letter-spacing=".5"');
  body+=text(metricX,270,`${mergedRepositories} MERGED REPOS`,13,muted,'letter-spacing=".5"')+text(metricX,290,`${closed} CLOSED RECORDS`,13,muted,'letter-spacing=".5"');
  for(let i=0;i<20;i++)body+=`<rect class="${animated?'wave':''}" style="animation-delay:-${(i*.17).toFixed(2)}s" x="${margin+i*25}" y="363" width="${i%4===0?3:2}" height="3" fill="${blue}" opacity="${i%3===0?.55:.24}"/>`;
  body+=`<path d="M${margin} 384C180 367 294 399 402 376S500 377 544 370" fill="none" stroke="${blue}" stroke-opacity=".3"/><path ${animated?'class="flow"':''} d="M${margin} 384C180 367 294 399 402 376S500 377 544 370" pathLength="100" fill="none" stroke="${blue}" stroke-width="1.5" stroke-dasharray="1 99"/>`;
  return {body,width,height:418};
}

function metrics(data,config,mobile=false){
  if(mobile){
    const width=600,margin=30;
    let body=`<path d="M${margin} 1Q300 -31 ${width-margin} 1" stroke="${rule}" fill="none"/>`;
    body+=text(margin,61,String(data.projects.length).padStart(2,'0'),36,ink,'letter-spacing="-1.2"')+text(margin+78,53,'PUBLIC PROJECTS',16,muted,'font-weight="600" letter-spacing="1"');
    body+=text(330,61,String(data.openPullRequests).padStart(2,'0'),36,ink,'letter-spacing="-1.2"')+text(408,53,'OPEN PRS',16,muted,'font-weight="600" letter-spacing="1"');
    body+=text(margin,112,'TOOLS IN USE',16,muted,'font-weight="600" letter-spacing="1"')+text(margin,147,(config.stack||[]).join(' / '),19,ink);
    return {body,width,height:171};
  }
  const width=1200,margin=56,y=1;
  let body=`<path d="M${margin} ${y}Q600 ${y-42} ${width-margin} ${y}" stroke="${rule}" fill="none"/>`;
  body+=text(margin,y+61,String(data.projects.length).padStart(2,'0'),47,ink,'letter-spacing="-1.2"')+label(margin+91,y+53,'PUBLIC PROJECTS');
  body+=text(409,y+61,String(data.openPullRequests).padStart(2,'0'),47,ink,'letter-spacing="-1.2"')+label(500,y+53,'OPEN PRS');
  body+=label(786,y+34,'TOOLS IN USE')+text(786,y+62,(config.stack||[]).join(' / '),17,ink);
  body+=line(margin,y+96,width-margin,y+96);
  return {body,width,height:116};
}

function projectModule(project,index,first,mobile=false,animated=true){
  const width=mobile?300:600,x=mobile?28:56,contentWidth=width-x*2,y=mobile?55:78;
  let body='';
  if(first)body+=text(x,mobile?28:35,'SELECTED PROJECTS',mobile?19:13,muted,'font-weight="600" letter-spacing="1.3"');
  if(mobile){
    const name=wrap(project.name,contentWidth,22,3);
    name.forEach((part,i)=>body+=text(x,y+27+i*28,part,22,ink,'font-weight="600" letter-spacing="-.3"'));
    const nameBottom=y+27+(name.length-1)*28;
    const description=wrap(project.description,contentWidth,16,3);
    description.forEach((part,i)=>body+=text(x,nameBottom+55+i*21,part,16,muted));
    const detailY=nameBottom+55+(description.length-1)*21+32;
    body+=text(x,detailY,(project.role||(project.fork?'Working fork':'Independent project')).toUpperCase(),11,muted,'letter-spacing=".6"');
    let row=detailY+30;
    (project.inputs||[]).slice(0,3).forEach((input,i)=>{
      body+=text(x,row,input.toUpperCase(),13,muted,'letter-spacing=".5"');
      if(project.encoders?.[i])body+=text(x+83,row,project.encoders[i],13,muted);
      row+=25;
    });
    if(project.inputs?.length){body+=line(x,row-10,x+contentWidth,row-10,blue,'stroke-opacity=".3"')+text(x+contentWidth,row+14,(project.output||'OUTPUT').toUpperCase(),12,blue,'text-anchor="end" letter-spacing=".5"');row+=35;}
    if(project.stack?.length)wrap(project.stack.join(' / '),contentWidth,14,2).forEach((part,i)=>body+=text(x,row+i*18,part,14,blue));
    row+=project.stack?.length?30:8;
    body+=line(x,row-8,x+contentWidth,row-8)+text(x,row+15,`${compact(project.stars||0)} STARS  ·  ${compact(project.forks||0)} FORKS  ·  ${(project.language||'PUBLIC REPOSITORY').toUpperCase()}`,12,muted,'letter-spacing=".4"');
    return {body,width,height:Math.max(210,row+34)};
  }
  const card=projectCard(project,x,y,contentWidth,mobile,animated);body+=card.svg;
  const metaY=card.bottom+20;
  body+=line(x,metaY-8,x+contentWidth,metaY-8)+text(x,metaY+16,`${compact(project.stars||0)} STARS  ·  ${compact(project.forks||0)} FORKS  ·  ${(project.language||'PUBLIC REPOSITORY').toUpperCase()}`,13,muted,'letter-spacing=".4"');
  return {body,width,height:Math.max(metaY+33,first?150:0)};
}

function contributionModule(contributions,first,mobile=false){
  const width=mobile?300:600,x=mobile?24:48,contentWidth=width-x*2,y=mobile?55:78;
  let body='';
  if(first)body+=text(x,mobile?28:35,'CONTRIBUTION RECORDS',mobile?19:13,muted,'font-weight="600" letter-spacing="1.3"');
  const card=contributionCard({groups:contributions},x,y,contentWidth,mobile);body+=card.svg;
  return {body,width,height:Math.max(card.bottom+14,first?150:0)};
}

function emptyModule(title,message,mobile=false){
  const width=mobile?300:600,x=mobile?24:48;
  const body=text(x,mobile?28:35,title,mobile?19:13,muted,'font-weight="600" letter-spacing="1.3"')+text(x,mobile?66:82,message,mobile?25:18,muted);
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

function activityModule(item,index,mobile=false){
  const scale=mobile?1.6:1,width=mobile?300:400,x=mobile?16:20,contentWidth=width-x*2,y=1;
  const font=Math.round(17*scale);
  let body=line(x,y,width-x,y);
  if(index===0)body+=text(x,y+35,'RECENT WORK',Math.round(13*scale),muted,'font-weight="600" letter-spacing="1.3"');
  const top=Math.round(72*scale);
  body+=text(x,top,date(item.date),Math.round(12*scale),muted,'letter-spacing=".5"')+`<circle cx="${x+4}" cy="${top+25}" r="4" fill="#fff" stroke="${blue}"/>`;
  body+=text(x,top+57,`${item.status.toUpperCase()} · #${item.number}`,Math.round(12*scale),blue,'font-weight="600" letter-spacing=".5"');
  const title=wrap(item.title,contentWidth,font,2);
  title.forEach((part,i)=>body+=text(x,top+88+i*font*1.4,part,font,ink));
  const nameY=top+88+(title.length-1)*font*1.4+30;
  wrap(item.repoName,contentWidth,Math.round(13*scale),2).forEach((part,i)=>body+=text(x,nameY+i*19,part,Math.round(13*scale),muted));
  return {body,width,height:Math.max(160,nameY+45)};
}

function footer(data,mobile=false){
  const width=mobile?600:1200,margin=mobile?30:56;
  const updated=data.updatedAt?`UPDATED ${date(data.updatedAt)}`:'AUTOMATIC UPDATES';
  const font=mobile?16:10;
  return {body:line(margin,1,width-margin,1)+text(margin,31,'PUBLIC GITHUB DATA',font,muted,'letter-spacing="1"')+text(width-margin,31,updated,font,muted,'text-anchor="end" letter-spacing=".5"'),width,height:49};
}

export function buildModules(data,config){
  const owner=`https://github.com/${config.username}`;
  const mergedUrl=searchPulls(`author:${config.username} is:pr is:merged is:public -user:${config.username}`);
  const resolvedUrl=searchPulls(`author:${config.username} is:pr is:closed is:public -user:${config.username}`);
  const blocks=[];
  const add=(id,alt,href,draw)=>blocks.push({id,alt,href,draw});
  add('identity',`${config.name} — ${config.tagline}`,owner,()=>identity(data,config));
  add('contribution-record',`${data.mergedPullRequests} merged upstream pull requests`,mergedUrl,({animated=true,mobile=false}={})=>contributionRecord(data,animated,mobile));
  const displayedSpotlight=data.spotlight?.status==='open'?null:data.spotlight;
  add('spotlight',displayedSpotlight?`Latest resolved contribution: PR #${displayedSpotlight.number} in ${displayedSpotlight.repo}`:'No resolved upstream PR yet',displayedSpotlight?.url||owner,({mobile=false}={})=>prModule(displayedSpotlight,displayedSpotlight?.status==='merged'?'LATEST MERGED PR':displayedSpotlight?'LATEST CLOSED PR':'LATEST CONTRIBUTION',mobile));
  if(data.resolvedSpotlight)add('resolved-pr',`${data.resolvedSpotlight.status==='merged'?'Merged':'Closed'} PR #${data.resolvedSpotlight.number} in ${data.resolvedSpotlight.repo}`,data.resolvedSpotlight.url,({mobile=false}={})=>prModule(data.resolvedSpotlight,'RECENTLY RESOLVED PR',mobile));
  add('metrics',`${data.projects.length} public projects and ${data.openPullRequests} open pull requests`,`${owner}?tab=repositories`,({mobile=false}={})=>metrics(data,config,mobile));
  if(data.projects.length){
    data.projects.slice(0,config.projects.maxVisible).forEach((project,index)=>add(`project-${index+1}`,`Open ${project.repo}`,project.url,({mobile=false,animated=true}={})=>projectModule(project,index,index===0,mobile,animated)));
  }else add('project-empty','No public projects yet',`${owner}?tab=repositories`,({mobile=false}={})=>emptyModule('SELECTED PROJECTS','New public projects will appear here.',mobile));
  if(data.contributions.length){
    add('contribution-records',`Merged and closed pull requests across ${data.contributions.length} repositories`,resolvedUrl,({mobile=false}={})=>contributionModule(data.contributions,true,mobile));
  }else add('contribution-empty','No merged contributions yet',mergedUrl,({mobile=false}={})=>emptyModule('CONTRIBUTION RECORDS','Open-source work in progress.',mobile));
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
  (data.activity||[]).slice(0,3).forEach((item,index)=>add(`activity-${index+1}`,`Open PR #${item.number}: ${item.title}`,item.url,({mobile=false}={})=>activityModule(item,index,mobile)));
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
  alignRows(blocks.filter(module=>/^activity-\d+$/.test(module.id)),3,true);
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

