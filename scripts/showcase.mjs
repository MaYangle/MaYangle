import {xml,wrap} from './format.mjs';

const ink='#17232f',muted='#667583',blue='#4264e8',rule='#e1e7ed';
const text=(x,y,value,size=18,color=ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+xml(value)+'</text>';
const line=(x,y,x2,y2)=>'<path d="M'+x+' '+y+'L'+x2+' '+y2+'" fill="none" stroke="'+rule+'"/>';

export function validateShowcase(showcase){
  if(!showcase)return;
  if(!Array.isArray(showcase.sections)||showcase.sections.length>6)throw new Error('Showcase supports up to six sections');
  if(!Number.isInteger(showcase.maxVisible)||showcase.maxVisible<1||showcase.maxVisible>3)throw new Error('Showcase maxVisible must be between one and three');
  const ids=new Set();
  for(const section of showcase.sections){
    if(!/^[a-z][a-z0-9-]*$/.test(section.id)||ids.has(section.id))throw new Error('Showcase section IDs must be unique');
    ids.add(section.id);
    if(!section.title||!section.description||!Array.isArray(section.items))throw new Error('Showcase sections need a title, description and items');
    if(section.autoTopics&&(!Array.isArray(section.autoTopics)||section.autoTopics.some(topic=>typeof topic!=='string')))throw new Error('Invalid showcase topics');
    for(const item of section.items){
      if(typeof item.title!=='string'||!item.title.trim())throw new Error('Showcase entries need a title');
      let url;try{url=new URL(item.url);}catch{throw new Error('Showcase entries need a public HTTPS URL');}
      if(url.protocol!=='https:'||url.username||url.password)throw new Error('Showcase entries need a public HTTPS URL');
      if(item.date&&!Number.isFinite(Date.parse(item.date)))throw new Error('Invalid showcase entry date');
    }
  }
}

export async function collectShowcase(config,projects,api){
  const setup=config.showcase;
  if(!setup)return null;
  validateShowcase(setup);
  const releases=[];
  if(setup.sections.some(section=>section.autoReleases)){
    const featured=projects.slice(0,config.projects.maxVisible);
    for(let i=0;i<featured.length;i+=4){
      const batch=await Promise.all(featured.slice(i,i+4).map(async project=>{
        const rows=await api('repos/'+project.repo+'/releases?per_page=3');
        if(!Array.isArray(rows))throw new Error('Invalid public release response');
        return rows.filter(release=>!release.draft&&release.published_at&&Number.isFinite(Date.parse(release.published_at))).map(release=>({
          title:project.name+' · '+(release.name||release.tag_name),
          url:release.html_url,kind:release.prerelease?'Pre-release':'Release',date:release.published_at,
          summary:project.description,source:'github-release'
        }));
      }));
      releases.push(...batch.flat());
    }
    releases.sort((a,b)=>b.date.localeCompare(a.date));
  }
  const sections=setup.sections.map(section=>{
    const curated=section.items.map(item=>({title:item.title,url:item.url,kind:item.kind||'Selected work',date:item.date||null,summary:item.summary||'',source:'curated'}));
    const topicSet=new Set((section.autoTopics||[]).map(topic=>topic.toLowerCase()));
    const tagged=projects.filter(project=>(project.topics||[]).some(topic=>topicSet.has(topic.toLowerCase()))).map(project=>({
      title:project.name,url:project.url,kind:'Repository',date:null,summary:project.description,source:'github-topic'
    }));
    const combined=[...curated,...tagged,...(section.autoReleases?releases:[])],seen=new Set();
    const items=combined.filter(item=>{if(seen.has(item.url))return false;seen.add(item.url);return true;});
    return {id:section.id,title:section.title,description:section.description,items};
  });
  return {title:setup.title||'RESEARCH & OUTPUTS',maxVisible:setup.maxVisible,sections};
}

function categoryMark(section,x,y){
  const shapes={
    research:'<path d="M2 25V3M2 25H28M6 21L12 15L17 18L26 7"/><circle cx="12" cy="15" r="1.8"/><circle cx="26" cy="7" r="1.8"/>',
    models:'<ellipse cx="15" cy="5" rx="12" ry="4"/><path d="M3 5V23C3 29 27 29 27 23V5M3 14C3 20 27 20 27 14"/>',
    writing:'<path d="M15 6C11 3 7 3 3 5V26C8 24 12 25 15 28C18 25 22 24 27 26V5C23 3 19 3 15 6ZM15 6V28"/>',
    releases:'<rect x="2" y="3" width="26" height="24" rx="2"/><path d="M2 10H28M12 15L20 19L12 23Z"/>'
  };
  const shape=shapes[section.id]||shapes.releases;
  return '<g transform="translate('+x+' '+y+')" fill="none" stroke="'+blue+'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+shape+'</g>';
}

function drawSection(section,width,mobile,maxVisible){
  const margin=mobile?30:56,inner=width-margin*2,titleSize=mobile?32:30,bodySize=mobile?24:22;
  let body=line(margin,1,width-margin,1)+categoryMark(section,width-margin-34,20);
  body+=text(margin,43,section.title,titleSize,ink,'font-weight="600" letter-spacing="-.3"');
  const description=wrap(section.description,inner,bodySize,2);
  const visible=(section.items||[]).slice(0,maxVisible);
  if(!visible.length){
    const descriptionY=mobile?75:73,descriptionGap=mobile?29:27;
    description.forEach((part,i)=>body+=text(margin,descriptionY+i*descriptionGap,part,bodySize,muted));
    const noEntryY=descriptionY+(description.length-1)*descriptionGap+(mobile?32:28);
    body+=text(margin,noEntryY,'No public entry yet',mobile?22:20,muted,'font-weight="600" letter-spacing=".2"');
    return {body,bottom:noEntryY+20};
  }
  let y=43;
  if(description.length){
    description.forEach((part,i)=>body+=text(margin,y+39+i*(mobile?31:29),part,bodySize,muted));
    y+=39+(description.length-1)*(mobile?31:29)+38;
  }else y+=46;
  for(const item of visible){
    let meta=(item.kind||'Selected work').toUpperCase();
    if(item.date)meta+=' · '+new Date(item.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Shanghai'}).toUpperCase();
    const metaLines=wrap(meta,inner,mobile?20:18,2);
    metaLines.forEach((part,i)=>body+=text(margin,y+i*(mobile?25:23),part,mobile?20:18,blue,'font-weight="600" letter-spacing=".4"'));
    y+=(metaLines.length-1)*(mobile?25:23)+36;
    const titleLines=wrap(item.title,inner,mobile?28:26,3);
    titleLines.forEach((part,i)=>body+=text(margin,y+i*(mobile?34:32),part,mobile?28:26,ink,'font-weight="600"'));
    y+=(titleLines.length-1)*(mobile?34:32)+33;
    if(item.summary){
      const summary=wrap(item.summary,inner,mobile?24:22,3);
      summary.forEach((part,i)=>body+=text(margin,y+i*(mobile?31:29),part,mobile?24:22,muted));
      y+=(summary.length-1)*(mobile?31:29)+32;
    }
    y+=20;
  }
  return {body,bottom:y};
}

export function renderShowcaseModule(section,width,mobile,maxVisible,includeTitle=false){
  const result=drawSection(section,width,mobile,maxVisible);
  const margin=mobile?30:56;
  const body=(includeTitle?line(margin,1,width-margin,1)+text(margin,38,'RESEARCH & OUTPUTS',mobile?22:20,muted,'font-weight="600" letter-spacing="1.1"'):'')+result.body;
  const height=result.bottom+(includeTitle?45:16);
  return {svg:body,bottom:height};
}

export function renderShowcase(showcase,x,y,width,mobile){
  if(!showcase?.sections?.length)return {svg:'',bottom:y-20};
  const canvasWidth=width+2*x;
  let svg=line(x,y,x+width,y)+text(x,y+36,showcase.title||'RESEARCH & OUTPUTS',mobile?22:20,muted,'font-weight="600" letter-spacing="1.1"');
  let current=y+58;
  for(const section of showcase.sections){
    const result=drawSection(section,canvasWidth,mobile,showcase.maxVisible);
    svg+='<g transform="translate(0 '+current+')">'+result.body+'</g>';
    current+=result.bottom+14;
  }
  return {svg,bottom:current};
}
