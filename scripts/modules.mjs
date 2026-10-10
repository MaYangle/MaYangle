import {xml,wrap,compact} from './format.mjs';
import {renderShowcaseModule} from './showcase.mjs';
import {renderImpact} from './sections.mjs';
import {renderContributionTelemetry} from './neural-tide.mjs';

const ink='#17232f',muted='#667583',blue='#4264e8',rule='#e1e7ed';
const text=(x,y,value,size=18,color=ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+xml(value)+'</text>';
const line=(x,y,x2,y2,color=rule,extra='')=>'<path d="M'+x+' '+y+'L'+x2+' '+y2+'" fill="none" stroke="'+color+'" '+extra+'/>';
const label=(x,y,value,size=18)=>text(x,y,value,size,muted,'font-weight="600" letter-spacing="1.1"');
const searchPulls=query=>'https://github.com/search?q='+encodeURIComponent(query)+'&type=pullrequests';

function frame(body,width,height,alt,animated){
  const css=animated?'.flow{animation:flow 6s linear infinite}@keyframes flow{to{stroke-dashoffset:-100}}@media(prefers-reduced-motion:reduce){.flow{animation:none!important}}':'';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'" role="img" aria-labelledby="module-title"><title id="module-title">'+xml(alt)+'</title><style>text{font-family:Arial,Helvetica,sans-serif}'+css+'</style><rect width="'+width+'" height="'+height+'" fill="#fff"/>'+body+'</svg>\n';
}

function identity(data,config,mobile=false){
  const width=mobile?600:1200,margin=mobile?30:56;
  const headline=mobile?50:68,subhead=24,small=mobile?20:18;
  let body=line(margin,1,width-margin,1)+label(margin,35,'PROFILE',small)+text(width-margin,35,'@'+(data.username||config.username),small,muted,'text-anchor="end"');
  body+=text(margin,mobile?100:116,config.name.toUpperCase(),headline,ink,'font-weight="600" letter-spacing="-1.8"');
  body+=text(margin,mobile?139:157,config.tagline,subhead,blue,'letter-spacing="-.2"');
  return {body,width,height:mobile?165:181};
}

function featuredProject(project,mobile=false,first=true){
  const width=mobile?600:1200,margin=mobile?30:56,inner=width-margin*2;
  const titleSize=mobile?36:40,descriptionSize=mobile?26:24,bodySize=mobile?24:22;
  let body=line(margin,1,width-margin,1)+label(margin,36,first?'FEATURED BUILD':'SELECTED BUILD',mobile?20:18);
  const title=wrap(project.name,inner,titleSize,2),titleY=96,titleGap=mobile?43:49;
  title.forEach((part,i)=>body+=text(margin,titleY+i*titleGap,part,titleSize,ink,'font-weight="600" letter-spacing="-.7"'));
  const titleBottom=titleY+(title.length-1)*titleGap;
  const descriptionY=titleBottom+(mobile?44:47),description=wrap(project.description,inner,descriptionSize,3),descriptionGap=mobile?34:32;
  description.forEach((part,i)=>body+=text(margin,descriptionY+i*descriptionGap,part,descriptionSize,muted));
  const descriptionBottom=descriptionY+(description.length-1)*descriptionGap;
  const roleY=descriptionBottom+(mobile?39:38);
  body+=text(margin,roleY,(project.role||(project.fork?'Working fork':'Original repository')).toUpperCase(),mobile?22:20,blue,'font-weight="600" letter-spacing=".5"');
  const contentY=roleY+46;
  const inputs=(project.inputs||[]).slice(0,3);

  if(!inputs.length){
    let bottom=roleY+(mobile?36:33);
    if(project.stack?.length){
      body+=label(margin,bottom,'TECH STACK',mobile?20:18);
      bottom+=mobile?34:31;
      const stack=wrap(project.stack.join(' / '),inner,22,2);
      stack.forEach((part,i)=>body+=text(margin,bottom+i*29,part,22,blue));
      bottom+=(stack.length-1)*29+(mobile?34:31);
    }
    body+=line(margin,bottom,width-margin,bottom);
    const projectScale=wrap('PROJECT REPOSITORY · '+compact(project.stars||0)+' STARS · '+compact(project.forks||0)+' FORKS · '+(project.language||'PUBLIC').toUpperCase(),inner,20,2);
    projectScale.forEach((part,i)=>body+=text(margin,bottom+28+i*25,part,20,muted));
    return {body,width,height:bottom+42+(projectScale.length-1)*25};
  }

  if(mobile){
    body+=line(margin,contentY-9,width-margin,contentY-9);
    body+=label(margin,contentY+21,'INPUT MODALITIES',20);
    let inputY=contentY+61;
    inputs.forEach((input,index)=>{
      body+=text(margin,inputY,input.toUpperCase(),24,ink,'font-weight="600" letter-spacing=".4"');
      if(project.encoders&&project.encoders[index])body+=text(margin+145,inputY,project.encoders[index],22,muted);
      inputY+=37;
    });
    const center=width/2,nodeY=inputY+10;
    body+=line(margin,nodeY,center-39,nodeY,'#c9d7f4')+line(center+39,nodeY,width-margin,nodeY,'#c9d7f4');
    body+='<circle cx="'+center+'" cy="'+nodeY+'" r="18" fill="#fff" stroke="'+blue+'" stroke-width="2"/>';
    body+=text(center,nodeY+7,'+',22,blue,'text-anchor="middle" font-weight="600"');
    body+=text(center,nodeY+48,(project.fusion||'PROCESSING').toUpperCase(),20,muted,'text-anchor="middle" letter-spacing=".5"');
    body+=text(margin,nodeY+88,'PREDICTION',20,muted,'font-weight="600" letter-spacing=".8"');
    body+=text(margin,nodeY+126,(project.output||'OUTPUT').toUpperCase(),30,ink,'font-weight="600"');
    let bottom=nodeY+160;
    if(project.stack?.length){
      const stack=wrap(project.stack.join(' / '),inner,22,2);
      stack.forEach((part,i)=>body+=text(margin,bottom+i*29,part,22,blue));
      bottom+=(stack.length-1)*29+34;
    }
    body+=line(margin,bottom,width-margin,bottom);
    const projectScale=wrap('PROJECT REPOSITORY · '+compact(project.stars||0)+' STARS · '+compact(project.forks||0)+' FORKS · '+(project.language||'PUBLIC').toUpperCase(),inner,20,2);
    projectScale.forEach((part,i)=>body+=text(margin,bottom+28+i*25,part,20,muted));
    return {body,width,height:bottom+42+(projectScale.length-1)*25};
  }

  const gap=48,column=(inner-gap)/2,left=margin,right=margin+column+gap;
  body+=line(margin,contentY-9,width-margin,contentY-9);
  body+=label(left,contentY+21,'INPUT MODALITIES',20)+label(right,contentY+21,'FUSION + OUTPUT',20);
  let inputY=contentY+62;
  inputs.forEach((input,index)=>{
    body+=text(left,inputY,input.toUpperCase(),24,ink,'font-weight="600" letter-spacing=".4"');
    if(project.encoders&&project.encoders[index])body+=text(left+152,inputY,project.encoders[index],22,muted);
    inputY+=39;
  });
  const nodeX=right+column/2,nodeY=contentY+97;
  body+=line(right+10,nodeY,nodeX-38,nodeY,'#c9d7f4')+line(nodeX+38,nodeY,right+column-10,nodeY,'#c9d7f4');
  body+='<circle cx="'+nodeX+'" cy="'+nodeY+'" r="18" fill="#fff" stroke="'+blue+'" stroke-width="2"/>';
  body+=text(nodeX,nodeY+7,'+',22,blue,'text-anchor="middle" font-weight="600"');
  body+=text(nodeX,contentY+151,(project.fusion||'PROCESSING').toUpperCase(),20,muted,'text-anchor="middle" letter-spacing=".5"');
  body+=text(right,contentY+198,'PREDICTION',20,muted,'font-weight="600" letter-spacing=".8"');
  body+=text(right,contentY+239,(project.output||'OUTPUT').toUpperCase(),32,ink,'font-weight="600"');
  let bottom=Math.max(inputY,contentY+258)+20;
  if(project.stack?.length){
    const stack=wrap(project.stack.join(' / '),inner,22,2);
    stack.forEach((part,i)=>body+=text(margin,bottom+i*29,part,22,blue));
    bottom+=(stack.length-1)*29+34;
  }
  body+=line(margin,bottom,width-margin,bottom);
  const projectScale=wrap('PROJECT REPOSITORY · '+compact(project.stars||0)+' STARS · '+compact(project.forks||0)+' FORKS · '+(project.language||'PUBLIC').toUpperCase(),inner,20,2);
  projectScale.forEach((part,i)=>body+=text(margin,bottom+28+i*25,part,20,muted));
  return {body,width,height:bottom+42+(projectScale.length-1)*25};
}

function engineeringEvidence(evidence,mobile=false){
  const width=mobile?600:1200,margin=mobile?30:56,inner=width-margin*2;
  const titleSize=mobile?24:22,bodySize=mobile?24:22;
  let body=line(margin,1,width-margin,1)+label(margin,38,'ENGINEERING EVIDENCE',mobile?22:20);
  const title=wrap(evidence.label.toUpperCase(),mobile?inner*.78:inner,titleSize,2),titleY=88;
  title.forEach((part,i)=>body+=text(margin,titleY+i*31,part,titleSize,blue,'font-weight="600" letter-spacing=".3"'));
  let y=titleY+(title.length-1)*31+50;
  const points=evidence.points||[];
  if(mobile){
    for(let i=0;i<points.length;i++){
      body+=text(margin,y,String(i+1).padStart(2,'0'),20,blue,'font-weight="600"');
      const rows=wrap(points[i],inner-48,bodySize,3);
      rows.forEach((part,j)=>body+=text(margin+48,y+j*31,part,bodySize,ink));
      y+=(rows.length-1)*31+45;
    }
  }else{
    const gap=42,column=(inner-gap*(points.length-1))/points.length;
    const startY=y;
    let maxBottom=startY;
    for(let i=0;i<points.length;i++){
      const x=margin+i*(column+gap);
      if(i)body+=line(x-gap/2,startY-10,x-gap/2,startY+112);
      body+=text(x,startY,String(i+1).padStart(2,'0'),20,blue,'font-weight="600"');
      const rows=wrap(points[i],column,bodySize,4);
      rows.forEach((part,j)=>body+=text(x,startY+35+j*29,part,bodySize,ink));
      maxBottom=Math.max(maxBottom,startY+35+(rows.length-1)*29+39);
    }
    y=maxBottom+8;
  }
  return {body,width,height:y+26};
}

function contributionModule(group,mobile=false){
  const width=mobile?600:1200,margin=mobile?30:56,inner=width-margin*2;
  const titleSize=mobile?32:34,bodySize=mobile?24:22,small=mobile?22:20;
  let body=line(margin,1,width-margin,1);
  const titleLines=wrap(group.name||group.repo,inner,titleSize,2),titleY=49,titleGap=mobile?39:41;
  titleLines.forEach((part,i)=>body+=text(margin,titleY+i*titleGap,part,titleSize,ink,'font-weight="600" letter-spacing="-.5"'));
  const titleBottom=titleY+(titleLines.length-1)*titleGap;
  const scaleHeader=wrap('UPSTREAM REPOSITORY SCALE',inner,mobile?20:18,2),scaleY=titleBottom+(mobile?38:36);
  scaleHeader.forEach((part,i)=>body+=text(margin,scaleY+i*24,part,mobile?20:18,muted,'font-weight="600" letter-spacing=".5"'));
  const scaleValueY=scaleY+(scaleHeader.length-1)*24+(mobile?29:27);
  body+=text(margin,scaleValueY,compact(group.stars||0)+' stars  ·  '+compact(group.forks||0)+' forks',mobile?22:20,muted);
  const summary=String(group.count||0).padStart(2,'0')+' MERGED  ·  '+String(group.closedCount||0).padStart(2,'0')+' CLOSED / NOT MERGED';
  const countLines=wrap(summary,inner,small,2),countY=scaleValueY+(mobile?38:35);
  countLines.forEach((part,i)=>body+=text(margin,countY+i*26,part,small,blue,'font-weight="600" letter-spacing=".3"'));
  const rows=[...(group.pulls||[]).map(pr=>({...pr,status:'merged'})),...(group.closed||[])].slice(0,10);
  let bottom=countY+(countLines.length-1)*26+43;
  if(mobile){
    for(const pr of rows){
      const outcome=pr.status==='closed'?'CLOSED / NOT MERGED':'MERGED';
      body+=text(margin,bottom,'#'+pr.number+' · '+outcome,22,pr.status==='closed'?muted:blue,'font-weight="600" letter-spacing=".3"');
      const title=wrap(pr.title,inner,24,3);
      title.forEach((part,i)=>body+=text(margin+28,bottom+35+i*31,part,24,ink));
      bottom+=35+(title.length-1)*31+46;
    }
  }else{
    const gap=44,column=(inner-gap)/2,perColumn=Math.ceil(rows.length/2),ends=[bottom,bottom];
    for(let i=0;i<rows.length;i++){
      const col=Math.floor(i/perColumn),row=i%perColumn,x=margin+col*(column+gap),y=bottom+row*112,pr=rows[i];
      if(row)body+=line(x,y-18,x+column,y-18);
      const outcome=pr.status==='closed'?'CLOSED / NOT MERGED':'MERGED';
      body+=text(x,y,'#'+pr.number+' · '+outcome,20,pr.status==='closed'?muted:blue,'font-weight="600" letter-spacing=".3"');
      const title=wrap(pr.title,column-26,22,2);
      title.forEach((part,j)=>body+=text(x+26,y+31+j*28,part,22,ink));
      ends[col]=Math.max(ends[col],y+31+(title.length-1)*28+38);
    }
    bottom=Math.max(ends[0],ends[1]);
  }
  if(group.count>(group.pulls||[]).length)body+=text(margin,bottom+4,'+ '+(group.count-group.pulls.length)+' additional merged PRs',20,muted);
  if(group.closedCount>(group.closed||[]).length)body+=text(margin,bottom+32,'+ '+(group.closedCount-group.closed.length)+' additional closed, unmerged PRs',20,muted);
  return {body,width,height:Math.max(bottom+58,mobile?210:185)};
}

function emptyModule(title,message,mobile=false){
  const width=mobile?600:1200,margin=mobile?30:56;
  const body=line(margin,1,width-margin,1)+text(margin,43,title,mobile?24:22,ink,'font-weight="600"')+text(margin,89,message,mobile?24:22,muted);
  return {body,width,height:mobile?128:120};
}

function showcaseModule(section,sectionIndex,data,config,item=null,itemIndex=0){
  const width=1200,mobileWidth=600;
  const display=item?{...section,items:[item]}:section;
  const href=item?item.url:showcaseFallback(section,config.username);
  const id='showcase-'+(sectionIndex+1)+(item?'-'+(itemIndex+1):'');
  return {
    id,alt:section.title+'; '+(item?item.title:'No public entry yet'),href,showcaseSection:sectionIndex,
    draw:({mobile=false}={})=>{
      const viewWidth=mobile?mobileWidth:width;
      const result=renderShowcaseModule(display,viewWidth,mobile,1,false);
      return {body:result.svg,width:viewWidth,height:result.bottom+12};
    }
  };
}

function showcaseFallback(section,username){
  const topics=section.autoTopics||[];
  if(!topics.length)return 'https://github.com/'+username+'?tab=repositories';
  const query=topics.map(topic=>'topic:'+topic).join(' ');
  return 'https://github.com/search?q='+encodeURIComponent('user:'+username+' '+query)+'&type=repositories';
}

function footer(data,mobile=false){
  const width=mobile?600:1200,margin=mobile?30:56,font=mobile?20:18;
  const date=data.updatedAt?new Date(data.updatedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Shanghai'}).toUpperCase():'AUTOMATIC UPDATES';
  return {body:line(margin,1,width-margin,1)+text(margin,40,'PUBLIC GITHUB DATA',font,muted,'letter-spacing=".8"')+text(width-margin,40,'UPDATED '+date,font,muted,'text-anchor="end" letter-spacing=".4"'),width,height:58};
}

export function buildModules(data,config){
  const owner='https://github.com/'+config.username;
  const allPulls=searchPulls('author:'+config.username+' is:pr is:public -user:'+config.username);
  const modules=[];
  const add=(id,alt,href,draw,metadata={})=>modules.push({id,alt,href,draw,...metadata});
  add('identity',config.name+' — '+config.tagline,owner,({mobile=false}={})=>identity(data,config,mobile));
  if(data.projects?.length){
    data.projects.slice(0,config.projects.maxVisible).forEach((project,index)=>add('project-'+(index+1),'Featured build: '+project.name,project.url,({mobile=false}={})=>featuredProject(project,mobile,index===0),{projectIndex:index}));
  }else add('project-empty','No public projects yet',owner+'?tab=repositories',({mobile=false}={})=>emptyModule('FEATURED BUILD','No public project is available yet.',mobile));
  (data.projects||[]).slice(0,config.projects.maxVisible).forEach((project,index)=>(project.engineeringEvidence||[]).forEach((evidence,evidenceIndex)=>add('engineering-work-'+(index+1)+'-'+(evidenceIndex+1),evidence.label,evidence.url,({mobile=false}={})=>engineeringEvidence(evidence,mobile),{projectIndex:index})));
  add('contribution-overview',String(data.mergedPullRequests||0)+' merged; '+String(data.closedPullRequests||0)+' closed, not merged upstream PRs',allPulls,({mobile=false,animated=true}={})=>renderContributionTelemetry(data,{mobile,animated}));
  if(data.contributions?.length){
    data.contributions.forEach((group,index)=>add('contribution-repo-'+(index+1),group.name+' upstream contribution records',searchPulls('author:'+config.username+' repo:'+group.repo+' is:pr is:closed is:public'),({mobile=false}={})=>contributionModule(group,mobile)));
  }else add('contribution-empty','No upstream contributions recorded',allPulls,({mobile=false}={})=>emptyModule('CONTRIBUTION RECORDS','Public upstream PR records will appear here as data updates.',mobile));
  (data.showcase?.sections||[]).forEach((section,index)=>{
    const items=(section.items||[]).slice(0,data.showcase.maxVisible);
    if(items.length)items.forEach((item,itemIndex)=>modules.push(showcaseModule(section,index,data,config,item,itemIndex)));
    else modules.push(showcaseModule(section,index,data,config));
  });
  if(data.impact?.sampleSize)add('impact','Merged upstream PR diff totals across '+data.impact.sampleSize+' PRs',allPulls,({mobile=false}={})=>({body:renderImpact(data,mobile?30:56,1,mobile?540:1088,mobile).svg,width:mobile?600:1200,height:mobile?220:195}));
  add('footer','Public profile data refresh date',owner,({mobile=false}={})=>footer(data,mobile));
  for(const module of modules){
    const url=new URL(module.href);
    if(url.protocol!=='https:'||url.username||url.password)throw new Error('Dashboard modules need public HTTPS links');
  }
  return modules;
}

export function renderModule(module,options={}){
  const mobile=options.mobile===true;
  const {body,width,height}=module.draw({mobile,animated:options.animated!==false});
  return frame(body,width,height,module.alt,options.animated!==false);
}
