import React,{useEffect,useRef,useState} from 'react';import {createRoot} from 'react-dom/client';
import {createGame,spawnWave,startGame,updateGame} from './game.js';import {createScene} from './scene.js';import {createAudio} from './audio.js';import './style.css';
const format=n=>String(n).padStart(6,'0');
function App(){const shell=useRef(null),helpRef=useRef(false),viewport=useRef(null),game=useRef(null),audio=useRef(null),keys=useRef({});const [hud,setHud]=useState({mode:'menu',score:0,lives:3,fuel:1,wave:1});const [best,setBest]=useState(()=>{try{return Number(localStorage.getItem('space-attack-best'))||0;}catch{return 0;}});const bestRef=useRef(best);const [muted,setMuted]=useState(false),[error,setError]=useState('');const [help,setHelp]=useState(false);const showHelp=value=>{helpRef.current=value;setHelp(value);};
 const prepareExpansion=()=>{const r=viewport.current.getBoundingClientRect();viewport.current.style.setProperty('--scene-top',`${r.top}px`);viewport.current.style.setProperty('--scene-right',`${window.innerWidth-r.right}px`);viewport.current.style.setProperty('--scene-bottom',`${window.innerHeight-r.bottom}px`);viewport.current.style.setProperty('--scene-left',`${r.left}px`);};
 const begin=()=>{if(!game.current||error)return;audio.current.unlock();prepareExpansion();showHelp(false);keys.current={};startGame(game.current);setHud({...game.current});viewport.current.focus();};
 const pause=()=>{const g=game.current;if(!g)return;if(g.mode==='playing'||g.mode==='transition'){g.beforePause=g.mode;g.mode='paused';}else if(g.mode==='paused'){g.mode=g.beforePause||'playing';showHelp(false);prepareExpansion();}keys.current={};setHud({...g});};
 useEffect(()=>{const g=createGame();spawnWave(g);game.current=g;audio.current=createAudio();let scene;try{scene=createScene(viewport.current);}catch{setError('This game needs a browser with WebGL enabled.');return;}
 const down=e=>{if(['ArrowLeft','ArrowRight','Space','Escape','Enter','KeyA','KeyD'].includes(e.code))e.preventDefault();keys.current[e.code]=true;if(e.repeat)return;if(e.code==='Enter'&&(g.mode==='menu'||g.mode==='gameover'))begin();else if(e.code==='Escape'){if(helpRef.current)showHelp(false);else pause();}};const up=e=>{keys.current[e.code]=false;};const blur=()=>{keys.current={};if(g.mode==='playing'||g.mode==='transition'){g.beforePause=g.mode;g.mode='paused';setHud({...g});}};

 window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);const visibility=()=>{if(document.hidden)blur();};document.addEventListener('visibilitychange',visibility);
 let frame,last=performance.now(),acc=0,ui=0;const tick=now=>{const delta=Math.min((now-last)/1000,.1);last=now;acc+=delta;const input={left:keys.current.ArrowLeft||keys.current.KeyA,right:keys.current.ArrowRight||keys.current.KeyD,fire:keys.current.Space};while(acc>=1/120){updateGame(g,1/120,input);if(g.event){audio.current.play(g.event);g.event=null;}acc-=1/120;}
 if(g.score>bestRef.current){bestRef.current=g.score;setBest(g.score);try{localStorage.setItem('space-attack-best',String(g.score));}catch{}}
 scene.render(g,input);ui+=delta;if(ui>.06){setHud({mode:g.mode,score:g.score,lives:g.lives,fuel:g.fuel,wave:g.wave,reason:g.reason,bonusGiven:g.bonusGiven});ui=0;}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);
 return()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);scene.dispose();audio.current.dispose();};},[]);
 const toggleSound=()=>{const value=!muted;setMuted(value);audio.current.setEnabled(!value);};
 const overlay=['menu','paused','gameover'].includes(hud.mode)||error;
 const touch=(code,active)=>{keys.current[code]=active;};
 return <main className="shell" ref={shell}>
 <div className="game-column">
 <div className={'hud-top '+(overlay?'concealed':'')}>
 <div><span className="label">SCORE</span><strong>{format(hud.score)}</strong></div>
 <div className="wave"><span className="label">WAVE</span><strong>{String(hud.wave).padStart(2,'0')}</strong></div>
 <div className="lives"><span className="label">LIVES</span><strong aria-label={`${hud.lives} lives`}>{Array.from({length:Math.max(3,hud.lives)},(_,i)=><span className={i<hud.lives?'':'lost'} key={i}>▲</span>)}</strong></div>
 <button className="menu-button" aria-label="Pause and open menu" onClick={pause}>☰</button>
 </div>
 <div className={`playfield ${['playing','transition'].includes(hud.mode)?'playfield-playing':''}`}><div className={`scene ${['playing','transition'].includes(hud.mode)?'scene-playing':''}`} ref={viewport} tabIndex={0} aria-label="Space Attack game playfield"/>
 {overlay&&<div className="overlay"><div className="overlay-card">
 {help?<><h2 className="help-title">HOW TO PLAY</h2><div className="instructions"><div><span>Move</span><span><kbd>←</kbd> <kbd>→</kbd> / <kbd>A</kbd> <kbd>D</kbd></span></div><div><span>Fire</span><kbd>HOLD SPACE</kbd></div><div><span>Pause</span><kbd>ESC</kbd></div><p>Three lives. Dodge shots and diving enemies. Clear each wave to refill your fuel. Empty fuel ends the run.</p><div className="enemy-scores"><span className="red">Drone · 30</span><span className="green">Fighter · 60</span><span className="yellow">Commander · 100</span></div><p>Double points for diving enemies. Earn a bonus life at 5,000 points. Waves get faster and fuel time gets tighter.</p></div><button className="primary" onClick={()=>showHelp(false)}>BACK</button></>:<>
 <div className="emblem">✦</div><h2>{hud.mode==='gameover'?'GAME OVER':hud.mode==='paused'?'PAUSED':<>SPACE<br/>ATTACK</>}</h2>
 {hud.mode==='gameover'&&<p>{hud.reason}</p>}{error&&<p>{error}</p>}
 <div className="run-stats">{hud.mode!=='menu'&&<span>SCORE <b>{format(hud.score)}</b></span>}<span>PERSONAL BEST <b>{format(best)}</b></span></div>
 <button className="primary" disabled={!!error} onClick={hud.mode==='paused'?pause:begin}>{hud.mode==='paused'?'RESUME':hud.mode==='gameover'?'PLAY AGAIN':'PLAY'}<span>↗</span></button>
 <div className="menu-options"><button onClick={()=>showHelp(true)}>HOW TO PLAY</button><button onClick={toggleSound}>{muted?'SOUND OFF':'SOUND ON'}</button></div>
 {hud.mode==='paused'&&<button className="quiet-button" onClick={()=>{game.current.mode='menu';showHelp(false);keys.current={};setHud({...game.current});}}>QUIT TO START</button>}
 </>}
 </div></div>}
 {hud.mode==='transition'&&<div className="wave-banner"><h2>WAVE {String(hud.wave).padStart(2,'0')} CLEAR</h2><p>Refueling…</p></div>}
 {hud.mode==='playing'&&hud.fuel<.2&&<div className="fuel-warning">LOW FUEL</div>}
 </div>
 <div className={'fuel-panel '+(hud.fuel<.2?'low ':'')+(overlay?'concealed':'')}><div className="fuel-title"><span>FUEL</span><b>{Math.ceil(hud.fuel*100)}%</b></div><div className="fuel-track"><div style={{width:`${hud.fuel*100}%`}}/></div></div>
 <div className={'touch-controls '+(overlay?'concealed':'')}>{[['ArrowLeft','←','Move left'],['ArrowRight','→','Move right'],['Space','FIRE','Fire']].map(([code,label,name])=><button key={code} aria-label={name} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);touch(code,true);}} onPointerUp={()=>touch(code,false)} onPointerCancel={()=>touch(code,false)} onLostPointerCapture={()=>touch(code,false)}>{label}</button>)}</div>
 </div></main>;

}
createRoot(document.getElementById('root')).render(<App/>);
