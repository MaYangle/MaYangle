export const xml = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
export const markdown = value => String(value).replace(/[\r\n]+/g,' ').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replace(/([\\`*_[\]])/g,'\\$1');
export const short = (value, limit) => String(value).length > limit ? `${String(value).slice(0,limit-1).trim()}…` : String(value);
export const compact = n => n >= 1000000 ? `${(n/1000000).toFixed(1).replace(/\.0$/,'')}M` : n >= 1000 ? `${(n/1000).toFixed(1).replace(/\.0$/,'')}K` : String(n);

export function wrap(value,width,size,maxLines=3) {
  const capacity=Math.max(8,Math.floor(width/(size*.53)));
  const words=String(value).replace(/[\r\n]+/g,' ').split(/\s+/);
  const lines=[];let line='';
  for(let word of words) {
    while(word.length>capacity) {
      if(line){lines.push(line);line='';}
      lines.push(word.slice(0,capacity));word=word.slice(capacity);
    }
    if(line && line.length+word.length+1>capacity){lines.push(line);line=word;}
    else line+=(line?' ':'')+word;
  }
  if(line)lines.push(line);
  if(lines.length>maxLines){lines.length=maxLines;lines[maxLines-1]=short(lines[maxLines-1],capacity-1)+'…';}
  return lines;
}
