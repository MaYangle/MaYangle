// Native scientific particle illustrations; no sampled photograph on the paint path.
const n=v=>String(Math.round(v*100)/100);
const rand=i=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const dot=(x,y,r,c,o=1)=>`<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${c}" opacity="${n(o)}"/>`;
const line=(d,c='#bfd4e4',o=.5,w=.7)=>`<path d="${d}" fill="none" stroke="${c}" stroke-opacity="${o}" stroke-width="${w}"/>`;
function current(d,count,duration,color,animated,size=1.6){
 let s='';
 for(let i=0;i<count;i++){
  const speed=duration*(.8+rand(i+52)*.4),begin=-rand(i+110)*speed;
  if(animated)s+=`<ellipse rx="${n(size*(1.1+rand(i)*1.6))}" ry="${n(size*.48)}" fill="${color}"><animateMotion path="${d}" rotate="auto" dur="${n(speed)}s" begin="${n(begin)}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.85;.7;0" keyTimes="0;.1;.85;1" dur="${n(speed)}s" begin="${n(begin)}s" repeatCount="indefinite"/></ellipse>`;
 }
 return s;
}
function sphere(cx,cy,r,animated,prefix,small=false,cinematic=false){
 const stops=cinematic?'<stop stop-color="#d0e3ef"/><stop offset=".22" stop-color="#718fa5"/><stop offset=".58" stop-color="#283f55"/><stop offset="1" stop-color="#101f30"/>':'<stop stop-color="#fff"/><stop offset=".45" stop-color="#ecf6fc" stop-opacity=".65"/><stop offset="1" stop-color="#b0cde2" stop-opacity=".25"/>';
 let s=`<defs><radialGradient id="${prefix}-body" cx=".18" cy=".14" r="1">${stops}</radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${prefix}-body)"/>`;
 const count=small?80:460;let points='';
 for(let i=0;i<count;i++){
  const z=1-2*(i+.5)/count,a=i*2.39996323,rr=Math.sqrt(1-z*z),x=rr*Math.cos(a),depth=rr*Math.sin(a);
  points+=dot(cx+x*r,cy+z*r,(small?.65:cinematic?.45:1.05)+Math.max(0,depth)*(small?.65:cinematic?.75:1.2),cinematic?'#c9e4f5':depth>0?'#6d9cbe':'#c6dbe9',cinematic?.08+(depth+1)*.15:.2+(depth+1)*.3);
 }
 s+=`<g class="${animated?'sphere-turn':''}" style="transform-origin:${cx}px ${cy}px">${points}</g>`;
 for(let band=0;band<(cinematic?0:3);band++){
  const ry=r*(.24+band*.18),yy=cy+(band-1)*r*.15;
  const d=`M${n(cx-r)} ${n(yy)}a${r} ${n(ry)} 0 1 0 ${2*r} 0a${r} ${n(ry)} 0 1 0 ${-2*r} 0`;
  s+=`<g transform="rotate(-24 ${cx} ${cy})">${line(d,'#a3c7e0',.35,.65)}${current(d,small?2:7,9+band*3,'#739dbd',animated,small?.8:1.2)}</g>`;
 }
 return s;
}
function field(width,height,animated,compact=false){
 let s='';const lanes=compact?5:10;
 for(let j=0;j<lanes;j++){
  const y=height*(.25+j*.061),wave=height*(.04+rand(j)*.06);
  s+=`<g${animated?` class="current-layer" style="animation-delay:-${n(j*.9)}s"`:''}>`;
  const billow=compact?wave:wave*(1.8+rand(j+412)*2.5);
  const d=`M-25 ${n(y)}C${n(width*.19)} ${n(y-billow)} ${n(width*.31)} ${n(y+billow)} ${n(width*.52)} ${n(y)}S${n(width*.85)} ${n(y-billow*.6)} ${width+25} ${n(y+wave*.4)}`;
  if(!compact){
   s+=line(d,j%3===0?'#d9c8a8':'#b7cddd',.045+j*.003,28+j*2.3);
   s+=line(d,'#eaf2f7',.13,15+j*1.2);
  }
  s+=line(d,j%3===0?'#d0bb95':'#a7c8df',.2+j*.035,compact?.65:.85);
  for(let i=0;i<(compact?12:22);i++){
   const t=rand(i+j*64),x=t*width;
   s+=dot(x,y+Math.sin(t*Math.PI*3)*wave*.55,(compact?.5:.7)+rand(i+23)*.8,j%3===0?'#c1ad89':'#9abdd7',.25+rand(i)*.3);
  }
  s+=current(d,compact?3:4,compact?8+j:8+j*.8,j%3===0?'#c7ab7b':'#83b2d3',animated,compact?.75:1.25);
  s+='</g>';
 }
 return s;
}
function hero(animated,prefix){
 let s=`<defs><radialGradient id="${prefix}-halo"><stop offset=".64" stop-color="#e7f2fb" stop-opacity="0"/><stop offset=".75" stop-color="#9cbdd5" stop-opacity=".3"/><stop offset=".84" stop-color="#edf5fb" stop-opacity=".65"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><linearGradient id="${prefix}-disk" x1="0" y1="0" x2="1" y2=".4"><stop stop-color="#f5eddf" stop-opacity="0"/><stop offset=".4" stop-color="#ead8b7"/><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#d2e9fa"/></linearGradient></defs><circle cx="842" cy="218" r="281" fill="url(#${prefix}-halo)"/>`;
 s+=sphere(842,218,218,animated,prefix,false,true);
 const rim='M687 371A218 218 0 0 1 988 56';
 s+=line(rim,'#d8edfc',.12,27)+line(rim,'#e8f5ff',.24,12)+line(rim,'#fff',.88,3.5);
 const lens='M422 251C541 235 599 260 637 189C697 62 806 -19 991 -4';
 s+=line(lens,'#d5e7f5',.075,33)+line(lens,'#e4f0f9',.22,14)+line(lens,'#fff4dd',.6,4.2)+line(lens,'#fff',.95,1.3);
 const sweep='M396 248C573 225 792 325 1050 378';
 s+=line(sweep,`url(#${prefix}-disk)`,.09,37)+line(sweep,`url(#${prefix}-disk)`,.2,17)+line(sweep,`url(#${prefix}-disk)`,.78,3.8);
 for(let j=0;j<6;j++){
  const d=`M400 ${242+j*5}C581 ${221+j*5} 789 ${319+j*5} 1050 ${365+j*7}`;
  s+=line(d,j%2?'#d1e7f7':'#d9c49f',j%2?.52:.42,j===2?1.3:.65)+current(d,j<4?7:3,4+j*.65,j%2?'#edf8ff':'#d4b780',animated,j===2?1.75:1.1);
 }
 s+=current(rim,12,10,'#f5fbff',animated,1.3);
 s+=`<svg y="364" width="1024" height="244" viewBox="0 0 1024 244">${field(1024,244,animated)}</svg>`;
 for(let i=0;i<26;i++)s+=dot(460+rand(i+3)*560,25+rand(i+77)*440,.55+rand(i)*1.1,'#9fb9ce',.22+rand(i+4)*.4);
 s+=`<g stroke="#a9bfce" stroke-width=".5" opacity=".35"><path d="M560 85h18m-9-9v18M992 449h20m-10-10v20"/></g>`;
 return s;
}
function fusion(animated,prefix){
 let s='';const ys=[53,133,223];
 for(let j=0;j<3;j++){
  const cy=ys[j],color=j===2?'#bca37e':'#87afcd';
  s+=`<circle cx="59" cy="${cy}" r="29" fill="#f7fafc" stroke="#d8e5ef" stroke-width=".7"/>`;
  for(let i=0;i<25;i++){
   const a=i*2.39996,r=23*Math.sqrt((i+.5)/25);
   s+=dot(59+Math.cos(a)*r,cy+Math.sin(a)*r,.65+rand(i)*.8,color,.5);
  }
  for(let lane=0;lane<3;lane++){
   const d=`M86 ${cy+(lane-1)*8}C185 ${cy} 238 ${132+(lane-1)*16} 354 137`;
   s+=line(d,color,.32,.75)+current(d,4,3.2+j*.65+lane*.4,color,animated,1.25);
  }
 }
 s+=sphere(362,137,64,animated,prefix,true,true);
 s+=line('M310 174A64 64 0 0 1 395 83','#d3e9f8',.75,2.2);
 s+=`<circle cx="362" cy="137" r="78" stroke="#cadce9" stroke-width=".65" fill="none" stroke-dasharray="1 7"${animated?' class="core-orbit"':''}/>`;
 if(animated)s+=`<circle cx="362" cy="137" r="12" fill="none" stroke="#c3dbea"><animate attributeName="r" values="12;90" dur="4s" repeatCount="indefinite"/><animate attributeName="opacity" values=".7;0" dur="4s" repeatCount="indefinite"/></circle>`;
 return s;
}
const sizes={hero:[1024,660],fusion:[494,350],landscape:[374,100],orbital:[374,100]};
export function renderParticleArtwork(name,x,y,width,height,{animated=true,fadeBottom=false,fit='xMidYMid meet'}={}){
 if(!sizes[name])throw Error(`Unknown particle region: ${name}`);
 const [w,h]=sizes[name],prefix=`science-${name}-${Math.round(x)}-${Math.round(y)}`;
 let content=name==='hero'?hero(animated,prefix):name==='fusion'?fusion(animated,prefix):field(w,h,animated,true);
 if(name==='orbital')content+=`<g opacity=".85">${sphere(290,12,70,animated,prefix,true,true)}${line('M235 55A70 70 0 0 1 330 -45','#d9eaf6',.8,2)}</g>`;
 if(fadeBottom)content+=`<defs><linearGradient id="${prefix}-fade" x2="0" y2="1"><stop stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect y="480" width="${w}" height="180" fill="url(#${prefix}-fade)"/>`;
 return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="${fit}" aria-label="${animated?'Animated':'Static'} scientific particle illustration: ${name}"><rect width="${w}" height="${h}" fill="#fff"/>${content}</svg>`;
}
export function particleRegionStats(name){
 const svg=renderParticleArtwork(name,0,0,...(sizes[name]??[1,1]));
 return {particles:(svg.match(/<(?:circle|ellipse)\b/g)??[]).length,bytes:svg.length,source:{width:sizes[name][0],height:sizes[name][1]}};
}
export const particleMotion=`
@keyframes science-turn{from{transform:rotate(-4deg)}to{transform:rotate(356deg)}}
.sphere-turn{animation:science-turn 70s linear infinite}
@keyframes science-wave{0%,100%{transform:translateY(-2px)}50%{transform:translateY(2px)}}
.current-layer{animation:science-wave 8s ease-in-out infinite}
.core-orbit{transform-origin:362px 137px;animation:science-turn 22s linear infinite}
@media(prefers-reduced-motion:reduce){.sphere-turn,.core-orbit,.current-layer{animation:none!important}}
`;
