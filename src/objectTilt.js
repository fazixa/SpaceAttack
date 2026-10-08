// An underdamped spring: quick engagement, softer settling, and a small rebound.
export function springTilt(state,target,dt){
 const omega=Math.abs(target)>.0001?20:12,zeta=.68;
 const t=Math.max(0,Math.min(dt,.1)),decay=Math.exp(-zeta*omega*t);
 const frequency=omega*Math.sqrt(1-zeta*zeta),offset=state.angle-target;
 const a=offset,b=(state.speed+zeta*omega*offset)/frequency;
 const cos=Math.cos(frequency*t),sin=Math.sin(frequency*t);
 state.angle=target+decay*(a*cos+b*sin);
 state.speed=decay*((-a*frequency*sin+b*frequency*cos)-zeta*omega*(a*cos+b*sin));
 return state.angle;
}
export function updateObjectTilt(object,sample,{dt,gameDt,active,preview,maxAngle,fullSpeed=12,reset=false}){
 const state=object.userData.motionTilt??={angle:0,speed:0,vx:0,x:sample.x,y:sample.y,phase:sample.phase};
 const jumped=Math.hypot(sample.x-state.x,sample.y-state.y)>3||sample.phase==='return'&&state.phase!=='return';
 if(reset||jumped||(!active&&preview===null)){state.angle=0;state.speed=0;state.vx=0;}
 else if(gameDt>0&&gameDt<.15)state.vx=(sample.x-state.x)/gameDt;
 state.x=sample.x;state.y=sample.y;state.phase=sample.phase;
 const amount=preview??(active?Math.max(-1,Math.min(1,state.vx/fullSpeed)):0);
 if(maxAngle===0){state.angle=0;state.speed=0;return 0;}
 return springTilt(state,amount*maxAngle,dt);
}
