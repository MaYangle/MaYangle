import {xml,wrap} from './format.mjs';

const ink='#17232f',muted='#667583',blue='#4264e8',rule='#e1e7ed';
const text=(x,y,value,size=18,color=ink,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${xml(value)}</text>`;
const line=(x,y,x2,y2)=>`<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${rule}"/>`;

export function validateShowcase(showcase){
  if(!showcase)return;
  if(!Array.isArray(showcase.sections)||showcase.sections.length>6)throw new Error('Showcase supports up to six sections');
  if(!Number.isInteger(showcase.maxVisible)||showcase.maxVisible<1||showcase.maxVisible>3)throw new Error('Showcase maxVisible must be between one and three');
  const ids=new Set();
  for(const section of showcase.sections){
    if(!/^[a-z][a-z0-9-]*$/.test(section.id)||ids.has(section.id))throw new Error('Showcase section IDs must be unique');
    ids.add(section.id);
    if(!section.title||!section.description||!Array.isArray(section.items))throw new Error('Showcase sections need a title, description and items');
    if(section.autoTopics && (!Array.isArray(section.autoTopics)||section.autoTopics.some(topic=>typeof topic!=='string')))throw new Error('Invalid showcase topics');
    for(const item of section.items){
      if(typeof item.title!=='string'||!item.title.trim())throw new Error('Showcase entries need a title');
      let url;try{url=new URL(item.url);}catch{throw new Error('Showcase entries need a public HTTPS URL');}
      if(url.protocol!=='https:'||url.username||url.password)throw new Error('Showcase entries need a public HTTPS URL');
      if(item.date && !Number.isFinite(Date.parse(item.date)))throw new Error('Invalid showcase entry date');
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
        const rows=await api(`repos/${project.repo}/releases?per_page=3`);
        if(!Array.isArray(rows))throw new Error('Invalid public release response');
        return rows.filter(release=>!release.draft&&release.published_at&&Number.isFinite(Date.parse(release.published_at))).map(release=>({
          title:`${project.name} · ${release.name||release.tag_name}`,
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
    const combined=[...curated,...tagged,...(section.autoReleases?releases:[])];
    const seen=new Set();
    const items=combined.filter(item=>{if(seen.has(item.url))return false;seen.add(item.url);return true;});
    return {id:section.id,title:section.title,description:section.description,items};
  });
  return {title:setup.title||'RESEARCH & OUTPUTS',maxVisible:setup.maxVisible,sections};
}

function icon(id,x,y){
  const shapes={
    research:'<path d="M3 27V3M3 27H30M7 21L14 14L20 18L29 7"/><circle cx="14" cy="14" r="2"/><circle cx="29" cy="7" r="2"/>',
    models:'<ellipse cx="16" cy="6" rx="12" ry="4"/><path d="M4 6V25C4 31 28 31 28 25V6M4 15C4 21 28 21 28 15"/>',
    writing:'<path d="M16 7C11 3 7 3 3 5V27C8 25 12 25 16 29C20 25 24 25 29 27V5C25 3 21 3 16 7ZM16 7V29M7 11L12 12M7 17L12 18M21 12L25 11M21 18L25 17"/>',
    releases:'<rect x="2" y="4" width="28" height="25" rx="2"/><path d="M2 11H30M7 8H8M12 8H13M13 16L21 20L13 24Z"/>'
  };
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${blue}" stroke-opacity=".72" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${shapes[id]||shapes.releases}</g>`;
}

function card(section,x,y,width,mobile,maxVisible){
  const left=x+48,bodyWidth=width-48;
  let svg=icon(section.id,x,y+3);
  const heading=wrap(section.title,bodyWidth,mobile?26:23,2);
  heading.forEach((s,i)=>svg+=text(left,y+26+i*31,s,mobile?26:23,ink,'font-weight="500" letter-spacing="-.2"'));
  let py=y+26+(heading.length-1)*31+31;
  const description=wrap(section.description,bodyWidth,mobile?19:17,2);
  description.forEach((s,i)=>svg+=text(left,py+i*26,s,mobile?19:17,muted));
  py+=(description.length-1)*26+31;
  const visible=section.items.slice(0,maxVisible);
  if(!visible.length){
    svg+=`<path d="M${left} ${py}H${x+width}" stroke="#dbe2e9" stroke-dasharray="3 5" fill="none"/>`;
    svg+=text(left,py+25,'No public entry yet',mobile?15:13,muted);
    return {svg,bottom:py+52};
  }
  for(const item of visible){
    let meta=item.kind.toUpperCase();
    if(item.date)meta+=' · '+new Date(item.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Shanghai'}).toUpperCase();
    svg+=text(left,py,meta,12,blue,'letter-spacing=".5"');
    const title=wrap(item.title,bodyWidth,mobile?21:19,2);py+=29;
    title.forEach((s,i)=>svg+=text(left,py+i*27,s,mobile?21:19,ink));py+=(title.length-1)*27;
    if(item.summary){const summary=wrap(item.summary,bodyWidth,mobile?18:16,2);py+=27;summary.forEach((s,i)=>svg+=text(left,py+i*24,s,mobile?18:16,muted));py+=(summary.length-1)*24;}
    py+=35;
  }
  return {svg,bottom:py+4};
}

export function renderShowcase(showcase,x,y,width,mobile){
  if(!showcase?.sections?.length)return {svg:'',bottom:y-20};
  const columns=mobile?1:2,gap=64,cw=(width-gap*(columns-1))/columns;
  let svg=line(x,y,x+width,y)+text(x,y+36,showcase.title,13,muted,'font-weight="600" letter-spacing="1.3"');
  let py=y+76;
  for(let i=0;i<showcase.sections.length;i+=columns){
    let rowBottom=py;
    showcase.sections.slice(i,i+columns).forEach((section,j)=>{
      const result=card(section,x+j*(cw+gap),py,cw,mobile,showcase.maxVisible);
      svg+=result.svg;rowBottom=Math.max(rowBottom,result.bottom);
    });
    py=rowBottom+18;
  }
  return {svg,bottom:py};
}
