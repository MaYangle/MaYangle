import {xml,compact,wrap} from './format.mjs';
import {renderImpact,renderActivity} from './sections.mjs';

const ink='#17232f', muted='#667583', blue='#4264e8', rule='#e1e7ed';
const t=(x,y,value,size=18,color=ink,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${xml(value)}</text>`;
const line=(x,y,x2,y2,color=rule,extra='')=>`<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${color}" ${extra}/>`;
const label=(x,y,value)=>t(x,y,value,13,muted,'font-weight="600" letter-spacing="1.3"');
function block(x,y,value,width,size=18,color=ink,maxLines=3,lineHeight=size*1.4,extra='') {
  const lines=wrap(value,width,size,maxLines);
  return {svg:lines.map((s,i)=>t(x,y+i*lineHeight,s,size,color,extra)).join(''),bottom:y+(lines.length-1)*lineHeight};
}
function wave(x,y,width,animated){
  const path=`M${x} ${y+10}C${x+width*.24} ${y+31} ${x+width*.48} ${y-21} ${x+width*.7} ${y+5}S${x+width*.9} ${y+26} ${x+width} ${y+17}`;
  let svg=`<path d="${path}" fill="none" stroke="${blue}" stroke-opacity=".1"/><path ${animated?'class="flow"':''} d="${path}" pathLength="100" fill="none" stroke="${blue}" stroke-opacity=".75" stroke-width="3" stroke-linecap="round" stroke-dasharray=".4 99.6"/>`;
  for(let row=0;row<3;row++)for(let i=0;i<38;i++){
    const px=x+i*width/37,py=y+row*8+Math.sin(i*.21+row*.35)*10;
    svg+=`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${i%5===0?1.5:1}" fill="${blue}" opacity="${row===1?.5:.26}" ${animated?`class="wave" style="animation-delay:-${(i*.22+row).toFixed(2)}s"`:''}/>`;
  }
  return svg;
}
function gauge(x,y,count,animated){
  const value=count<100?String(count).padStart(2,'0'):compact(count);
  const size=value.length>3?83:value.length>2?104:126;
  return `<circle cx="${x}" cy="${y}" r="106" fill="#fbfcff" stroke="#e7edfa"/>
  <circle cx="${x}" cy="${y}" r="106" fill="none" stroke="${blue}" stroke-opacity=".26" stroke-width="1.5" stroke-dasharray="510 156" transform="rotate(126 ${x} ${y})"/>
  ${t(x,y+27,value,size,blue,'text-anchor="middle" font-weight="400" letter-spacing="-5"')}
  ${t(x,y+65,'MERGED UPSTREAM PRS',12,muted,'text-anchor="middle" letter-spacing=".8"')}`;
}
function spotlight(data,x,y,width,mobile){
  const s=data.spotlight;
  let svg=label(x,y,'OPEN-SOURCE SPOTLIGHT');
  if(!s)return {svg:svg+t(x,y+52,'Building in public',30),bottom:y+220};
  const title=block(x,y+47,s.repoName,width,mobile?28:31,ink,2,38,'font-weight="600" letter-spacing="-.5"');svg+=title.svg;
  const metricsY=title.bottom+62;
  svg+=t(x,metricsY,compact(s.stars),46,ink,'letter-spacing="-1.4"')+label(x,metricsY+24,'REPOSITORY STARS');
  const fx=x+(mobile?width*.56:238);
  svg+=t(fx,metricsY,compact(s.forks),36,ink,'letter-spacing="-1"')+label(fx,metricsY+24,'FORKS');
  const statusY=metricsY+61;
  svg+=`<circle cx="${x+4}" cy="${statusY-4}" r="3" fill="${blue}"/>`+t(x+17,statusY,`${s.status.toUpperCase()} PR #${s.number}`,13,blue,'font-weight="600" letter-spacing=".6"');
  const desc=block(x,statusY+30,s.title,width,18,muted,2,25);svg+=desc.svg;
  return {svg,bottom:desc.bottom+10};
}
function pipeline(p,x,y,width,mobile,animated){
  if(!p.inputs?.length)return {svg:'',bottom:y};
  const end=x+width,join=x+width*.46,mid=x+width*.68;
  let svg='';
  p.inputs.slice(0,3).forEach((name,i)=>{
    const py=y+i*40;
    svg+=t(x,py,name.toUpperCase(),mobile?15:13,muted,'letter-spacing=".8"');
    if(p.encoders?.[i])svg+=t(x+62,py,p.encoders[i],mobile?14:13,muted);
    svg+=`<path d="M${x+169} ${py-5}C${join-30} ${py-5} ${join-26} ${y+35} ${join} ${y+35}L${mid-12} ${y+35}" stroke="#ccd8f3" fill="none"/>`;
  });
  svg+=`<circle cx="${mid}" cy="${y+35}" r="4" fill="${blue}"/>`+t(mid,y+64,'CROSS-ATTENTION',mobile?14:12,muted,'text-anchor="middle" letter-spacing=".2"');
  const path=`M${mid+8} ${y+35}H${end-12}`;
  svg+=`<path d="${path}" stroke="#ccd8f3" fill="none"/><path ${animated?'class="flow"':''} d="${path}" pathLength="100" stroke="${blue}" stroke-width="2" stroke-dasharray="3 97" fill="none"/>`;
  svg+=t(end,y+14,(p.output||'OUTPUT').toUpperCase(),mobile?14:12,muted,'text-anchor="end" letter-spacing=".5"');
  return {svg,bottom:y+104};
}
function projectCard(p,x,y,width,mobile,animated){
  let svg='';const name=block(x,y,p.name,width,mobile?26:26,ink,2,34,'font-weight="600" letter-spacing="-.3"');svg+=name.svg;
  const desc=block(x,name.bottom+35,p.description,width,mobile?20:18,muted,3,mobile?29:26);svg+=desc.svg;
  svg+=t(x,desc.bottom+31,(p.role||(p.fork?'Working fork':'Independent project')).toUpperCase(),11,muted,'letter-spacing=".8"');
  let bottom=desc.bottom+55;
  const flow=pipeline(p,x,bottom,width,mobile,animated);svg+=flow.svg;bottom=flow.bottom;
  if(p.stack?.length){const stack=block(x,bottom+8,p.stack.join('  /  '),width,14,blue,2,21);svg+=stack.svg;bottom=stack.bottom+27;}
  else bottom+=18;
  return {svg,bottom};
}
function contributionCard(c,x,y,width,mobile){
  let svg='';const title=block(x,y,c.name||c.repo.split('/')[1].replaceAll('-',' '),width,mobile?26:25,ink,3,32,'font-weight="600" letter-spacing="-.3"');svg+=title.svg;
  svg+=t(x,title.bottom+36,`${c.count} merged pull requests`,20,blue);
  let py=title.bottom+80;
  const pulls=c.pulls||[];
  const layouts=pulls.map(pr=>{
    const body=block(x+59,py,pr.title,width-59,mobile?19:17,muted,2,mobile?28:25);
    const item={pr,y:py,body};py=body.bottom+41;return item;
  });
  if(layouts.length>1)svg+=line(x+5,layouts[0].y-6,x+5,layouts.at(-1).y-6,'#d8e2f7');
  for(const {pr,y:iy,body} of layouts){svg+=`<circle cx="${x+5}" cy="${iy-6}" r="4" fill="#fff" stroke="${blue}"/>`+t(x+20,iy,`#${pr.number}`,12,blue)+body.svg;}
  if(!layouts.length){const summary=block(x,py,c.summary,width,18,muted);svg+=summary.svg;py=summary.bottom+25;}
  return {svg,bottom:py+2};
}

export function renderHero(data,config,{mobile=false,animated=true}={}){
  const width=mobile?600:1200,margin=mobile?30:56,inner=width-margin*2;
  const updated=data.updatedAt?new Date(data.updatedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Shanghai'}).toUpperCase():'';
  let svg=label(margin,35,'PROFILE')+t(width-margin,35,`@${data.username||config.username}`,12,muted,'text-anchor="end"');
  svg+=t(margin,mobile?103:116,config.name.toUpperCase(),mobile?49:66,ink,'font-weight="600" letter-spacing="-1.8"');
  svg+=t(margin,mobile?141:157,config.tagline,mobile?21:24,blue,'letter-spacing="-.2"');
  const intro=config.bio?block(margin,mobile?183:200,config.bio,inner,mobile?20:18,muted,mobile?3:2,mobile?29:27):{svg:'',bottom:mobile?141:157};svg+=intro.svg;
  const headerBottom=intro.bottom+32;
  svg+=line(margin,headerBottom,width-margin,headerBottom);
  const heroY=headerBottom+39;
  svg+=label(margin,heroY,'CONTRIBUTION RECORD');
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
    py+=20;svg+=line(margin,py-26,width-margin,py-26)+label(margin,py,'CONTRIBUTOR TO');py+=47;
    for(const c of contributions){const card=contributionCard(c,margin,py,inner,true);svg+=card.svg;py=card.bottom+28;}
    if(!contributions.length){svg+=t(margin,py,'Open-source work in progress.',19,muted);py+=45;}
    bottom=py;
  }else{
    const colWidth=496,right=648;
    svg+=label(margin,worksY,'SELECTED PROJECTS')+label(right,worksY,'CONTRIBUTOR TO');
    let py=worksY+49,cy=worksY+49;
    for(const p of projects){const card=projectCard(p,margin,py,colWidth,false,animated);svg+=card.svg;py=card.bottom+34;if(p!==projects.at(-1))svg+=line(margin,py-18,margin+colWidth,py-18);}
    for(const c of contributions){const card=contributionCard(c,right,cy,496,false);svg+=card.svg;cy=card.bottom+25;if(c!==contributions.at(-1))svg+=line(right,cy-17,width-margin,cy-17);}
    if(!projects.length){svg+=t(margin,py,'New public projects will appear here.',18,muted);py+=80;}
    if(!contributions.length){svg+=t(right,cy,'Open-source work in progress.',18,muted);cy+=80;}
    bottom=Math.max(py,cy);
  }
  const impact=renderImpact(data,margin,bottom+20,inner,mobile);svg+=impact.svg;
  const activity=renderActivity(data,margin,impact.bottom+24,inner,mobile);svg+=activity.svg;
  const footer=activity.bottom+22,height=footer+57;
  svg+=line(margin,footer-16,width-margin,footer-16)+t(margin,footer+14,'PUBLIC GITHUB DATA',10,muted,'letter-spacing="1"')+t(width-margin,footer+14,updated?`UPDATED ${updated}`:'AUTOMATIC UPDATES',10,muted,'text-anchor="end" letter-spacing=".5"');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
<title id="title">${xml(config.name)} — public builder profile</title><desc id="desc">${data.mergedPullRequests} merged upstream pull requests, ${data.projects.length} public projects. ${data.spotlight?`${xml(data.spotlight.repo)}: ${data.spotlight.stars} repository stars; ${data.spotlight.status} PR ${data.spotlight.number}.`:''} Projects and contribution records update from GitHub.</desc>
<style>text{font-family:Arial,Helvetica,sans-serif} ${animated?`.wave{animation:wave 12s ease-in-out infinite}.flow{animation:flow 12s linear infinite}@keyframes wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}@keyframes flow{to{stroke-dashoffset:-100}}@media(prefers-reduced-motion:reduce){.wave,.flow{animation:none!important}}`:''}</style>
<rect width="${width}" height="${height}" fill="#fff"/>${svg}</svg>\n`;
}
