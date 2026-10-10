import {xml,compact,wrap} from './format.mjs';
import {renderImpact} from './sections.mjs';
import {renderShowcase} from './showcase.mjs';

const ink='#17232f', muted='#667583', blue='#4264e8', rule='#e1e7ed';
const t=(x,y,value,size=18,color=ink,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${xml(value)}</text>`;
const line=(x,y,x2,y2,color=rule,extra='')=>`<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${color}" ${extra}/>`;
const label=(x,y,value)=>t(x,y,value,17,muted,'font-weight="600" letter-spacing="1.1"');
function block(x,y,value,width,size=18,color=ink,maxLines=3,lineHeight=size*1.4,extra='') {
  const lines=wrap(value,width,size,maxLines);
  return {svg:lines.map((s,i)=>t(x,y+i*lineHeight,s,size,color,extra)).join(''),bottom:y+(lines.length-1)*lineHeight};
}
export function wave(x,y,width,animated){
  const path=`M${x} ${y+10}C${x+width*.24} ${y+31} ${x+width*.48} ${y-21} ${x+width*.7} ${y+5}S${x+width*.9} ${y+26} ${x+width} ${y+17}`;
  let svg=`<path d="${path}" fill="none" stroke="${blue}" stroke-opacity=".1"/><path ${animated?'class="flow"':''} d="${path}" pathLength="100" fill="none" stroke="${blue}" stroke-opacity=".75" stroke-width="3" stroke-linecap="round" stroke-dasharray=".4 99.6"/>`;
  for(let row=0;row<3;row++)for(let i=0;i<38;i++){
    const px=x+i*width/37,py=y+row*8+Math.sin(i*.21+row*.35)*10;
    svg+=`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${i%5===0?1.5:1}" fill="${blue}" opacity="${row===1?.5:.26}" ${animated?`class="wave" style="animation-delay:-${(i*.22+row).toFixed(2)}s"`:''}/>`;
  }
  return svg;
}
export function gauge(x,y,count,animated,labelSize=15){
  const value=count<100?String(count).padStart(2,'0'):compact(count);
  const size=value.length>3?83:value.length>2?104:126;
  return `<circle cx="${x}" cy="${y}" r="106" fill="#fbfcff" stroke="#e7edfa"/>
  <circle cx="${x}" cy="${y}" r="106" fill="none" stroke="${blue}" stroke-opacity=".26" stroke-width="1.5" stroke-dasharray="510 156" transform="rotate(126 ${x} ${y})"/>
  ${t(x,y+27,value,size,blue,'text-anchor="middle" font-weight="400" letter-spacing="-5"')}
  ${t(x,y+65,'MERGED UPSTREAM PRS',labelSize,muted,'text-anchor="middle" letter-spacing=".8"')}`;
}
export function spotlight(data,x,y,width,mobile){
  const s=data.spotlight;
  let svg=label(x,y,s?.status==='merged'?'LATEST MERGED PR':'RECENT OPEN PR');
  if(!s)return {svg:svg+t(x,y+52,'Building in public',30),bottom:y+220};
  const title=block(x,y+43,s.repoName,width,mobile?27:26,ink,2,33,'font-weight="600" letter-spacing="-.4"');svg+=title.svg;
  const statusY=title.bottom+29;
  svg+=`<circle cx="${x+4}" cy="${statusY-4}" r="3" fill="${blue}"/>`+t(x+17,statusY,`${s.status.toUpperCase()} PR #${s.number}`,16,blue,'font-weight="600" letter-spacing=".5"');
  const desc=block(x,statusY+29,s.title,width,19,ink,2,27);svg+=desc.svg;
  let bottom=desc.bottom+25;
  svg+=t(x,bottom,`${compact(s.stars)} repository stars  ·  ${compact(s.forks)} forks`,16,muted);
  const open=data.openSpotlight;
  if(open){
    svg+=line(x,bottom+22,x+width,bottom+22)+label(x,bottom+47,'OPEN PROPOSAL');
    const name=block(x,bottom+77,open.repoName,width,mobile?23:22,ink,2,29,'font-weight="500"');svg+=name.svg;
    bottom=name.bottom+28;
    svg+=t(x,bottom,`OPEN PR #${open.number}  ·  ${compact(open.stars)} stars / ${compact(open.forks)} forks`,16,blue);
  }
  return {svg,bottom:bottom+12};
}
function pipeline(p,x,y,width,mobile,animated){
  if(!p.inputs?.length)return {svg:'',bottom:y};
  const end=x+width,join=x+width*.46,mid=x+width*.68;
  let svg='';
  p.inputs.slice(0,3).forEach((name,i)=>{
    const py=y+i*40;
    svg+=t(x,py,name.toUpperCase(),mobile?18:17,muted,'letter-spacing=".6"');
    if(p.encoders?.[i])svg+=t(x+96,py,p.encoders[i],mobile?17:16,muted);
    svg+=`<path d="M${x+169} ${py-5}C${join-30} ${py-5} ${join-26} ${y+35} ${join} ${y+35}L${mid-12} ${y+35}" stroke="#ccd8f3" fill="none"/>`;
  });
  svg+=`<circle cx="${mid}" cy="${y+35}" r="4" fill="${blue}"/>`+t(mid,y+64,'CROSS-ATTENTION',mobile?17:16,muted,'text-anchor="middle" letter-spacing=".2"');
  const path=`M${mid+8} ${y+35}H${end-12}`;
  svg+=`<path d="${path}" stroke="#ccd8f3" fill="none"/><path ${animated?'class="flow"':''} d="${path}" pathLength="100" stroke="${blue}" stroke-width="2" stroke-dasharray="3 97" fill="none"/>`;
  svg+=t(end,y+14,(p.output||'OUTPUT').toUpperCase(),mobile?17:16,muted,'text-anchor="end" letter-spacing=".4"');
  return {svg,bottom:y+104};
}
export function projectCard(p,x,y,width,mobile,animated){
  let svg='';const name=block(x,y,p.name,width,mobile?26:26,ink,2,34,'font-weight="600" letter-spacing="-.3"');svg+=name.svg;
  const desc=block(x,name.bottom+35,p.description,width,mobile?21:19,muted,3,mobile?30:28);svg+=desc.svg;
  svg+=t(x,desc.bottom+31,(p.role||(p.fork?'Working fork':'Independent project')).toUpperCase(),16,muted,'letter-spacing=".6"');
  let bottom=desc.bottom+55;
  const flow=pipeline(p,x,bottom,width,mobile,animated);svg+=flow.svg;bottom=flow.bottom;
  if(p.stack?.length){const stack=block(x,bottom+8,p.stack.join('  /  '),width,18,blue,2,25);svg+=stack.svg;bottom=stack.bottom+29;}
  else bottom+=18;
  return {svg,bottom};
}
export function contributionCard(c,x,y,width,mobile){
  const groups=c.groups||[c];let svg='',py=y;
  groups.forEach((group,index)=>{
    if(index)svg+=line(x,py-12,x+width,py-12);
    const headingSize=mobile?26:24;
    const heading=group.name||group.repo?.split('/')[1]?.replaceAll('-',' ')||'Open-source work';
    const headingBlock=block(x,py,heading,width,headingSize,ink,2,headingSize*1.25,'font-weight="600" letter-spacing="-.2"');
    svg+=headingBlock.svg;py=headingBlock.bottom+(mobile?27:24);
    const summary=[];
    if(group.count)summary.push(`${String(group.count).padStart(2,'0')} MERGED`);
    if(group.closedCount)summary.push(`${String(group.closedCount).padStart(2,'0')} CLOSED`);
    if(summary.length)svg+=t(x,py,summary.join('  /  ')+' PRs',mobile?19:18,blue,'letter-spacing=".4"');
    py+=mobile?33:29;
    const rows=[...(group.pulls||[]).map(pr=>({...pr,status:'merged'})),...(group.closed||[])].slice(0,10);
    const columns=mobile?1:2,gap=mobile?0:20,columnWidth=(width-gap*(columns-1))/columns,perColumn=Math.ceil(rows.length/columns);
    let groupBottom=py;
    for(let col=0;col<columns;col++){
      const cx=x+col*(columnWidth+gap),slice=rows.slice(col*perColumn,(col+1)*perColumn),trackX=cx+4;
      let rowY=py;
      for(const pr of slice){
        const meta=pr.status==='closed'?'CLOSED':'MERGED';
        svg+=`<circle cx="${trackX}" cy="${rowY-5}" r="3.5" fill="${pr.status==='merged'?blue:'#fff'}" stroke="${blue}"/>`;
        svg+=t(cx+18,rowY,`#${pr.number}`,mobile?18:17,blue,'font-weight="600" letter-spacing=".4"');
        svg+=t(cx+63,rowY,meta,mobile?18:17,pr.status==='merged'?blue:muted,'font-weight="600" letter-spacing=".3"');
        const title=block(cx+18,rowY+21,pr.title,columnWidth-20,mobile?21:19,ink,2,mobile?26:23);
        svg+=title.svg;rowY=title.bottom+(mobile?24:22);
      }
      if(slice.length>1)svg+=line(trackX,py-5,trackX,rowY-(mobile?28:26),'#d8e2f7');
      groupBottom=Math.max(groupBottom,rowY);
    }
    py=groupBottom;
    if(group.count>(group.pulls||[]).length){svg+=t(x,py,`+ ${group.count-group.pulls.length} merged PRs`,14,muted);py+=23;}
    if(group.closedCount>(group.closed||[]).length){svg+=t(x,py,`+ ${group.closedCount-(group.closed||[]).length} closed PRs`,14,muted);py+=23;}
    py+=index<groups.length-1?18:0;
  });
  return {svg,bottom:py+2};
}

export function renderHero(data,config,{mobile=false,animated=true}={}){
  const width=mobile?600:1200,margin=mobile?30:56,inner=width-margin*2;
  const updated=data.updatedAt?new Date(data.updatedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Shanghai'}).toUpperCase():'';
  let svg=label(margin,35,'PROFILE')+t(width-margin,35,`@${data.username||config.username}`,16,muted,'text-anchor="end"');
  svg+=t(margin,mobile?103:116,config.name.toUpperCase(),mobile?49:66,ink,'font-weight="600" letter-spacing="-1.8"');
  svg+=t(margin,mobile?141:157,config.tagline,mobile?21:24,blue,'letter-spacing="-.2"');
  const intro=config.bio?block(margin,mobile?183:200,config.bio,inner,mobile?20:18,muted,mobile?3:2,mobile?29:27):{svg:'',bottom:mobile?141:157};svg+=intro.svg;
  const headerBottom=intro.bottom+32;
  svg+=line(margin,headerBottom,width-margin,headerBottom);
  const heroY=headerBottom+39;
  svg+=label(margin,heroY,'CONTRIBUTION RECORDS');
  let worksY;
  if(mobile){
    svg+=gauge(155,heroY+150,data.mergedPullRequests,animated);
    svg+=t(365,heroY+97,String(data.projects.length).padStart(2,'0'),47,ink,'letter-spacing="-1"')+label(365,heroY+123,'PUBLIC PROJECTS');
    svg+=t(365,heroY+196,String(data.openPullRequests).padStart(2,'0'),47,ink,'letter-spacing="-1"')+label(365,heroY+222,'OPEN PRS');
    svg+=wave(margin,heroY+283,inner,animated);
    const spot=spotlight(data,margin,heroY+351,inner,true);svg+=spot.svg;
    const toolY=spot.bottom+41;svg+=line(margin,toolY-21,width-margin,toolY-21)+label(margin,toolY,'TOOLS IN USE');
    const tools=block(margin,toolY+32,(config.stack||[]).join('  /  '),inner,19,ink,2,27);svg+=tools.svg;worksY=tools.bottom+58;
  }else{
    svg+=gauge(226,heroY+158,data.mergedPullRequests,animated);
    svg+=wave(margin,heroY+290,532,animated);
    svg+=line(600,heroY+9,600,heroY+311);
    const spot=spotlight(data,648,heroY,496,false);svg+=spot.svg;
    const stripY=Math.max(heroY+358,spot.bottom+42);
    svg+=`<path d="M${margin} ${stripY}Q600 ${stripY-42} ${width-margin} ${stripY}" stroke="#e1e7ed" fill="none"/>`;
    svg+=t(margin,stripY+62,String(data.projects.length).padStart(2,'0'),47,ink,'letter-spacing="-1.2"')+label(margin+91,stripY+54,'PUBLIC PROJECTS');
    svg+=t(409,stripY+62,String(data.openPullRequests).padStart(2,'0'),47,ink,'letter-spacing="-1.2"')+label(500,stripY+54,'OPEN PRS');
    svg+=label(786,stripY+35,'TOOLS IN USE')+t(786,stripY+63,(config.stack||[]).join(' / '),17,ink);
    svg+=line(margin,stripY+96,width-margin,stripY+96);worksY=stripY+140;
  }
  const projects=data.projects.slice(0,config.projects.maxVisible),contributions=data.contributions.slice(0,3);
  let bottom;
  if(mobile){
    svg+=label(margin,worksY,'SELECTED PROJECTS');let py=worksY+47;
    for(const p of projects){const card=projectCard(p,margin,py,inner,true,animated);svg+=card.svg;py=card.bottom+32;if(p!==projects.at(-1))svg+=line(margin,py-17,width-margin,py-17);}
    if(!projects.length){svg+=t(margin,py,'New public projects will appear here.',19,muted);py+=50;}
    py+=20;svg+=line(margin,py-26,width-margin,py-26)+label(margin,py,'MERGED CONTRIBUTIONS');py+=47;
    for(const c of contributions){const card=contributionCard(c,margin,py,inner,true);svg+=card.svg;py=card.bottom+28;}
    if(!contributions.length){svg+=t(margin,py,'Open-source work in progress.',19,muted);py+=45;}
    bottom=py;
  }else{
    const colWidth=496,right=648;
    svg+=label(margin,worksY,'SELECTED PROJECTS')+label(right,worksY,'MERGED CONTRIBUTIONS');
    let py=worksY+49,cy=worksY+49;
    for(const p of projects){const card=projectCard(p,margin,py,colWidth,false,animated);svg+=card.svg;py=card.bottom+34;if(p!==projects.at(-1))svg+=line(margin,py-18,margin+colWidth,py-18);}
    for(const c of contributions){const card=contributionCard(c,right,cy,496,false);svg+=card.svg;cy=card.bottom+25;if(c!==contributions.at(-1))svg+=line(right,cy-17,width-margin,cy-17);}
    if(!projects.length){svg+=t(margin,py,'New public projects will appear here.',18,muted);py+=80;}
    if(!contributions.length){svg+=t(right,cy,'Open-source work in progress.',18,muted);cy+=80;}
    bottom=Math.max(py,cy);
  }
  const showcase=renderShowcase(data.showcase,margin,bottom+20,inner,mobile);svg+=showcase.svg;
  const impact=renderImpact(data,margin,showcase.bottom+20,inner,mobile);svg+=impact.svg;
  const footer=impact.bottom+22,height=footer+57;
  svg+=line(margin,footer-16,width-margin,footer-16)+t(margin,footer+14,'PUBLIC GITHUB DATA',14,muted,'letter-spacing=".7"')+t(width-margin,footer+14,updated?`UPDATED ${updated}`:'AUTOMATIC UPDATES',14,muted,'text-anchor="end" letter-spacing=".4"');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">${xml(config.name)} — public builder profile</title><desc id="desc">${data.mergedPullRequests} merged upstream pull requests, ${data.projects.length} public projects. ${data.spotlight?`${xml(data.spotlight.repo)}: ${data.spotlight.stars} repository stars; ${data.spotlight.status} PR ${data.spotlight.number}.`:''} Projects and contribution records update from GitHub.</desc>
<style>text{font-family:Arial,Helvetica,sans-serif} ${animated?`.wave{animation:wave 12s ease-in-out infinite}.flow{animation:flow 12s linear infinite}@keyframes wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@keyframes flow{to{stroke-dashoffset:-100}}@media(prefers-reduced-motion:reduce){.wave,.flow{animation:none!important}}`:''}</style>
<rect width="${width}" height="${height}" fill="#fff"/>${svg}</svg>\n`;
}
