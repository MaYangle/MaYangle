import {xml,wrap} from './format.mjs';

const ink='#17232f',muted='#667583',blue='#4264e8',rule='#e1e7ed';
const text=(x,y,value,size=18,color=ink,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" fill="'+color+'" '+extra+'>'+xml(value)+'</text>';
const line=(x,y,x2,y2)=>'<path d="M'+x+' '+y+'L'+x2+' '+y2+'" fill="none" stroke="'+rule+'"/>';

function signalWave(x,y,width,animated){
  const path='M'+x+' '+(y+16)+'C'+(x+width*.18)+' '+(y+16)+' '+(x+width*.2)+' '+(y+2)+' '+(x+width*.34)+' '+(y+3)+'S'+(x+width*.52)+' '+(y+29)+' '+(x+width*.68)+' '+(y+19)+'S'+(x+width*.84)+' '+(y+4)+' '+(x+width)+' '+(y+9);
  let svg='<path d="'+path+'" fill="none" stroke="#d9e4f8" stroke-width="8" stroke-linecap="round"/>';
  svg+='<path d="'+path+'" fill="none" stroke="'+blue+'" stroke-width="2" stroke-linecap="round" stroke-opacity=".82" pathLength="100" stroke-dasharray="10 90" '+(animated?'class="flow"':'')+'/>';
  return svg;
}

export function renderContributionTelemetry(data,{mobile=false,animated=true}={}){
  const width=mobile?600:1200,margin=mobile?30:56,inner=width-margin*2;
  const merged=data.mergedPullRequests||0;
  const closed=data.closedPullRequests??(data.contributions||[]).reduce((sum,group)=>sum+(group.closedCount||0),0);
  const open=data.openPullRequests||0;
  let body=line(margin,1,width-margin,1)+text(margin,mobile?34:38,'PUBLIC UPSTREAM CONTRIBUTIONS',mobile?22:20,muted,'font-weight="600" letter-spacing="1.1"');
  const valueY=mobile?111:112,labelY=mobile?148:151;
  if(mobile){
    const col=inner/3,x1=margin,x2=margin+col+4,x3=margin+2*col+4;
    body+=text(x1,valueY,String(merged).padStart(2,'0'),48,blue,'font-weight="500" letter-spacing="-1.5"');
    body+=text(x1,labelY,'MERGED PRS',20,muted,'font-weight="600" letter-spacing=".3"');
    body+=text(x2,valueY,String(closed).padStart(2,'0'),40,ink,'font-weight="500" letter-spacing="-1"');
    wrap('CLOSED / NOT MERGED',col-10,20,2).forEach((part,i)=>body+=text(x2,labelY+i*25,part,20,muted,'font-weight="600" letter-spacing=".2"'));
    body+=text(x3,valueY,String(open).padStart(2,'0'),40,ink,'font-weight="500" letter-spacing="-1"');
    body+=text(x3,labelY,'OPEN PRS',20,muted,'font-weight="600" letter-spacing=".3"');
    const scope=wrap('Public PRs to repositories outside this account.',inner,20,2);
    scope.forEach((part,i)=>body+=text(margin,195+i*25,part,20,muted));
    body+=signalWave(margin,246,inner,animated);
    return {body,width,height:278};
  }
  const statWidth=250;
  body+=text(margin,valueY,String(merged).padStart(2,'0'),54,blue,'font-weight="500" letter-spacing="-1.8"');
  body+=text(margin,labelY,'MERGED PRS',20,muted,'font-weight="600" letter-spacing=".5"');
  body+=text(margin+statWidth+30,valueY,String(closed).padStart(2,'0'),44,ink,'font-weight="500" letter-spacing="-1.2"');
  body+=text(margin+statWidth+30,labelY,'CLOSED / NOT MERGED',20,muted,'font-weight="600" letter-spacing=".4"');
  body+=text(margin+statWidth*2+85,valueY,String(open).padStart(2,'0'),44,ink,'font-weight="500" letter-spacing="-1.2"');
  body+=text(margin+statWidth*2+85,labelY,'OPEN PRS',20,muted,'font-weight="600" letter-spacing=".4"');
  body+=text(width-margin,142,'PUBLIC PR RECORDS',18,blue,'text-anchor="end" font-weight="600" letter-spacing=".7"');
  body+=signalWave(margin,190,inner,animated);
  return {body,width,height:232};
}
