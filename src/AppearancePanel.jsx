import React from 'react';
export const DEFAULT_APPEARANCE={center:'#030912',edge:'#010205',radius:1.4,softness:.6,brightness:1,bloomStrength:.13,bloomRadius:.07,bloomThreshold:0};
export function loadAppearance(){
 try{const saved=JSON.parse(localStorage.getItem('space-attack-appearance'));const value={...DEFAULT_APPEARANCE};
 for(const key of ['center','edge'])if(/^#[0-9a-f]{6}$/i.test(saved?.[key]))value[key]=saved[key];
 for(const [key,min,max] of [['radius',.5,2.5],['softness',.1,1],['brightness',0,2],['bloomStrength',0,1],['bloomRadius',0,1],['bloomThreshold',0,2]])if(Number.isFinite(saved?.[key]))value[key]=Math.max(min,Math.min(max,saved[key]));
 return value;}catch{return {...DEFAULT_APPEARANCE};}
}
export default function AppearancePanel({open,onToggle,value,onChange}){
 const set=(key,next)=>onChange({...value,[key]:next});
 return <aside className="appearance-debug" aria-label="Appearance controls">
 <button className="appearance-toggle" aria-expanded={open} aria-controls="appearance-panel" onClick={onToggle}>{open?'CLOSE CONTROLS':'VISUAL CONTROLS'}</button>
 {open&&<div id="appearance-panel" className="appearance-panel">
 <h3>APPEARANCE</h3><p>Live preview · gameplay frozen</p>
 {['center','edge'].map(key=><label className="color-control" key={key}><span>{key==='center'?'Center color':'Corner color'}</span><input type="color" value={value[key]} onChange={e=>set(key,e.target.value)}/><code>{value[key]}</code></label>)}
 {[['radius','Gradient size',.5,2.5,.05],['softness','Fade softness',.1,1,.05],['brightness','Brightness',0,2,.05]].map(([key,label,min,max,step])=><label className="range-control" key={key}><span>{label}<output>{Math.round(value[key]*100)}%</output></span><input type="range" min={min} max={max} step={step} value={value[key]} onChange={e=>set(key,Number(e.target.value))}/></label>)}
 <h3 className="bloom-heading">BLOOM</h3>
 {[['bloomStrength','Strength',1],['bloomRadius','Spread',1],['bloomThreshold','Threshold',2]].map(([key,label,max])=><label className="range-control" key={key}><span>{label}<output>{value[key].toFixed(2)}</output></span><input type="range" min="0" max={max} step="0.01" value={value[key]} onChange={e=>set(key,Number(e.target.value))}/></label>)}
 <div className="appearance-actions"><button onClick={()=>onChange({...value,center:value.edge,edge:value.center})}>Swap colors</button><button onClick={()=>onChange({...DEFAULT_APPEARANCE})}>Reset</button></div>
 <p>Changes save automatically on this browser.</p>
 </div>}
 </aside>;
}
