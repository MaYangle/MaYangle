import {xml,wrap,compact} from './format.mjs';

const ink='#17232f', muted='#667583', blue='#4264e8', rule='#e1e7ed';
const text=(x,y,value,size=18,color=ink,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${xml(value)}</text>`;
const line=(x,y,x2,y2)=>`<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${rule}"/>`;
const label=(x,y,value)=>text(x,y,value,13,muted,'font-weight="600" letter-spacing="1.3"');
const numeric=n=>n>=1000000?compact(n):n.toLocaleString('en-US');

export function renderImpact(data,x,y,width,mobile){
  const d=data.impact;
  if(!d?.sampleSize)return {svg:'',bottom:y-24};
  let svg=line(x,y,x+width,y)+label(x,y+36,'MERGED IMPACT');
  svg+=text(x+width,y+36,`Across ${d.sampleSize} merged PRs`,mobile?12:13,muted,'text-anchor="end"');
  const metrics=[[`+${numeric(d.additions)}`,'LINES ADDED',blue],[`−${numeric(d.deletions)}`,'LINES REMOVED',ink],[numeric(d.fileChanges),'FILE CHANGES',ink]];
  metrics.forEach(([value,caption,color],i)=>{
    const px=x+i*width/3;
    svg+=text(px,y+102,value,mobile?34:46,color,'font-weight="500" letter-spacing="-1.2"')+label(px,y+130,caption);
  });
  return {svg,bottom:y+164};
}

export function renderActivity(data,x,y,width,mobile){
  const items=data.activity||[];
  if(!items.length)return {svg:'',bottom:y-24};
  let svg=line(x,y,x+width,y)+label(x,y+36,'RECENT WORK');
  let bottom=y+36;
  if(!mobile){
    const gap=40,cw=(width-gap*(items.length-1))/items.length;
    const trackY=y+91;
    svg+=line(x,trackY,x+width,trackY);
    items.forEach((item,i)=>{
      const px=x+i*(cw+gap);
      const date=new Date(item.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Shanghai'}).toUpperCase();
      svg+=text(px,y+73,date,12,muted,'letter-spacing=".6"')+`<circle cx="${px+4}" cy="${trackY}" r="4" fill="#fff" stroke="${blue}"/>`;
      svg+=text(px,trackY+32,`${item.status.toUpperCase()} · #${item.number}`,12,blue,'font-weight="600" letter-spacing=".6"');
      const title=wrap(item.title,cw,18,2);title.forEach((s,j)=>svg+=text(px,trackY+65+j*25,s,18,ink));
      const nameY=trackY+65+(title.length-1)*25+31;
      const repo=wrap(item.repoName,cw,13,2);repo.forEach((s,j)=>svg+=text(px,nameY+j*19,s,13,muted));
      bottom=Math.max(bottom,nameY+(repo.length-1)*19+28);
    });
  }else{
    let py=y+84;
    items.forEach((item,i)=>{
      const date=new Date(item.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'Asia/Shanghai'}).toUpperCase();
      svg+=`<circle cx="${x+4}" cy="${py-5}" r="4" fill="#fff" stroke="${blue}"/>`+text(x+23,py,`${date}  /  ${item.status.toUpperCase()} #${item.number}`,12,blue,'letter-spacing=".3"');
      const title=wrap(item.title,width-23,20,2);title.forEach((s,j)=>svg+=text(x+23,py+34+j*28,s,20,ink));
      const nameY=py+34+(title.length-1)*28+29;
      const repo=wrap(item.repoName,width-23,16,2);repo.forEach((s,j)=>svg+=text(x+23,nameY+j*23,s,16,muted));
      const next=nameY+(repo.length-1)*23+43;
      if(i<items.length-1)svg+=line(x+4,py+5,x+4,next-15);
      py=next;bottom=py;
    });
  }
  return {svg,bottom};
}
