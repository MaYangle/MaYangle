import { xml } from './format.mjs';
const ink='#17232f',muted='#667583',blue='#4264e8',rule='#e1e7ed';
const text=(x,y,value,size=18,color=ink,extra='')=>`<text x='${x}' y='${y}' font-size='${size}' fill='${color}' ${extra}>${xml(value)}</text>`;
const line=(x,y,x2,y2)=>`<path d='M${x} ${y}L${x2} ${y2}' stroke='${rule}' fill='none'/>`;
function repositoryLabel(name){
 const value=(name||'PUBLIC REPOSITORY').toLowerCase();
 if(value.includes('bilingual-multimodal-sentiment')||value.includes('bilingual multimodal sentiment'))return 'BILINGUAL MSA';
 if(value.includes('ai-engineering-from-scratch')||value.includes('ai engineering from scratch'))return 'AI ENGINEERING';
 return (name||'PUBLIC REPOSITORY').toUpperCase();
}
function neuralTide(cx,top,scale,animated){
 const x=cx-165*scale;
 let svg='<g transform="translate('+x+' '+top+') scale('+scale+')" fill="none" stroke-linecap="round" stroke-linejoin="round">';
 svg+='<path d="M10 92C54 92 68 42 119 46C165 50 175 108 221 105C259 103 275 68 320 68" stroke="#d8e3f8" stroke-width="12"/>';
 svg+='<path d="M10 92C54 92 68 42 119 46C165 50 175 108 221 105C259 103 275 68 320 68" stroke="#4264e8" stroke-width="2" stroke-opacity=".8"/>';
 svg+='<path d="M26 119C82 119 94 78 138 78C183 78 195 129 241 124C274 120 290 96 318 96" stroke="#afc2eb" stroke-width="1.5"/>';
 svg+='<g '+(animated?'class="core"':'')+'><path d="M141 61L160 72L160 94L141 105L122 94L122 72Z" fill="#fff" stroke="#4264e8" stroke-width="2"/>';
 svg+='<path d="M132 83H150M141 73V93" stroke="#4264e8" stroke-width="1.6"/><circle cx="141" cy="83" r="3.2" fill="#4264e8" stroke="none"/></g>';
 svg+='<path d="M10 92C54 92 68 42 119 46C165 50 175 108 221 105C259 103 275 68 320 68" pathLength="100" stroke="#4264e8" stroke-width="3.2" stroke-dasharray="4 96" '+(animated?'class="flow"':'')+'/>';
 for(let i=0;i<22;i++){
  const px=18+i*14,py=133+Math.sin(i*.37)*3;
  svg+='<circle cx="'+px+'" cy="'+py+'" r="'+(i%5===0?1.7:1)+'" fill="#4264e8" stroke="none" opacity=".38" '+(animated?'class="wave" style="animation-delay:-'+(i*.21).toFixed(2)+'s"':'')+'/>';
 }
 svg+='<path d="M10 146H320" stroke="#e1e7ed" stroke-width="1"/><path d="M10 146H320" pathLength="100" stroke="#4264e8" stroke-width="2" stroke-dasharray="6 94" '+(animated?'class="flow"':'')+'/></g>';
 return svg;
}
export function renderContributionTelemetry(data,{mobile=false,animated=true}={}){
 const width=mobile?300:600,margin=mobile?18:56,cx=width/2,groups=(data.contributions||[]).slice(0,3);
 const merged=data.mergedPullRequests||0,closed=groups.reduce((sum,group)=>sum+(group.closedCount||0),0);
 let body=text(margin,mobile?27:35,mobile?'CONTRIBUTIONS':'CONTRIBUTION RECORDS',mobile?22:18,muted,'font-weight="600" letter-spacing="1.1"');
 body+=line(margin,mobile?45:53,width-margin,mobile?45:53)+neuralTide(cx,mobile?54:70,mobile?.72:1,animated);
 body+=text(cx,mobile?227:278,String(merged+closed).padStart(2,'0'),mobile?58:68,blue,'text-anchor="middle" font-weight="400" letter-spacing="-1.8"');
 body+=text(cx,mobile?252:306,'RESOLVED UPSTREAM PRS',mobile?18:18,muted,'text-anchor="middle" letter-spacing=".6"');
 body+=text(cx,mobile?282:339,`${String(merged).padStart(2,'0')} MERGED  ·  ${String(closed).padStart(2,'0')} CLOSED`,mobile?17:17,blue,'text-anchor="middle" font-weight="600" letter-spacing=".3"');
 if(mobile){let y=326;groups.slice(0,2).forEach(group=>{body+=text(margin,y,repositoryLabel(group.name),18,ink,'font-weight="600" letter-spacing=".4"')+text(width-margin,y,`${String(group.count||0).padStart(2,'0')}M / ${String(group.closedCount||0).padStart(2,'0')}C`,16,muted,'text-anchor="end" letter-spacing=".3"');y+=29;});return {body,width,height:Math.max(394,y+8)};}
 let y=379;groups.slice(0,2).forEach(group=>{body+=text(margin,y,repositoryLabel(group.name),17,muted,'font-weight="600" letter-spacing=".5"')+text(width-margin,y,`${String(group.count||0).padStart(2,'0')} MERGED  ·  ${String(group.closedCount||0).padStart(2,'0')} CLOSED`,17,blue,'text-anchor="end" letter-spacing=".2"');y+=28;});
 body+=line(margin,y+1,width-margin,y+1);return {body,width,height:y+15};
}
