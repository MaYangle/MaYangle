import {xml} from './format.mjs';
import {buildModules,renderModule} from './modules.mjs';

export function renderHero(data,config,{mobile=false,animated=true}={}){
  const width=mobile?600:1200,gap=mobile?18:20,parts=[];
  let y=0;
  for(const module of buildModules(data,config)){
    const svg=renderModule(module,{mobile,animated});
    const height=Number(svg.match(/\bheight="([\d.]+)"/)?.[1]||0);
    let content=svg.slice(svg.indexOf('>')+1,svg.lastIndexOf('</svg>'));
    content=content.replace(/<title id="module-title">.*?<\/title>/,'').replace(/<style>.*?<\/style>/,'');
    parts.push('<svg x="0" y="'+y+'" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'">'+content+'</svg>');
    y+=height+gap;
  }
  y=Math.max(1,y-gap);
  const motion=animated?'<style>text{font-family:Arial,Helvetica,sans-serif}.flow{animation:flow 6s linear infinite}@keyframes flow{to{stroke-dashoffset:-100}}@media(prefers-reduced-motion:reduce){.flow{animation:none!important}}</style>':'';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+y+'" viewBox="0 0 '+width+' '+y+'" role="img" aria-labelledby="profile-title"><title id="profile-title">'+xml(config.name)+' — profile dashboard</title>'+motion+'<rect width="'+width+'" height="'+y+'" fill="#fff"/>'+parts.join('')+'</svg>\n';
}
