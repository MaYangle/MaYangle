import {xml,compact} from './format.mjs';

const ink='#17232f', muted='#667583', blue='#4264e8', rule='#e1e7ed';
const text=(x,y,value,size=18,color=ink,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${xml(value)}</text>`;
const line=(x,y,x2,y2)=>`<path d="M${x} ${y}L${x2} ${y2}" fill="none" stroke="${rule}"/>`;
const label=(x,y,value)=>text(x,y,value,17,muted,'font-weight="600" letter-spacing="1.1"');
const numeric=n=>n>=1000000?compact(n):n.toLocaleString('en-US');

export function renderImpact(data,x,y,width,mobile){
  const d=data.impact;
  if(!d?.sampleSize)return {svg:'',bottom:y-24};
  let svg=line(x,y,x+width,y)+label(x,y+36,'MERGED IMPACT');
  svg+=text(x+width,y+36,`Across ${d.sampleSize} merged PRs`,mobile?16:17,muted,'text-anchor="end"');
  const metrics=[[`+${numeric(d.additions)}`,'LINES ADDED',blue],[`−${numeric(d.deletions)}`,'LINES REMOVED',ink],[numeric(d.fileChanges),'FILE CHANGES',ink]];
  metrics.forEach(([value,caption,color],i)=>{
    const px=x+i*width/3;
    svg+=text(px,y+102,value,mobile?34:46,color,'font-weight="500" letter-spacing="-1.2"')+label(px,y+130,caption);
  });
  return {svg,bottom:y+164};
}
