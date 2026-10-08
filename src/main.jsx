import AppearancePanel,{loadAppearance,DEFAULT_APPEARANCE} from './AppearancePanel.jsx';
import {PixelText,PixelAlien} from './PixelText.jsx';
import React,{useEffect,useRef,useState} from 'react';import {createRoot} from 'react-dom/client';
import {createGame,spawnWave,startGame,updateGame} from './game.js';import {createScene} from './scene.js';import {createAudio} from './audio.js';import './style.css';
const format=n=>String(n).padStart(6,'0');
function FireIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="fire-icon"><path fill="currentColor" d="M10 2h4v3h3v3h-3v9h-4V8H7V5h3zM4 11h2v6H4zm14 0h2v6h-2zM10 20h4v2h-4z"/></svg>;}
function App(){
 const firePointer=useRef(null);
 const sceneRef=useRef(null),debugRef=useRef(false),drag=useRef(null),touchMode=useRef(navigator.maxTouchPoints>0||matchMedia('(pointer:coarse)').matches);
 const [isTouch,setIsTouch]=useState(touchMode.current);
 useEffect(()=>{const query=matchMedia('(pointer:coarse)');const sync=()=>{touchMode.current=navigator.maxTouchPoints>0||query.matches;setIsTouch(touchMode.current);drag.current=null;};query.addEventListener('change',sync);return()=>query.removeEventListener('change',sync);},[]);
 const [debugOpen,setDebugOpen]=useState(false),[appearance,setAppearance]=useState(()=>import.meta.env.DEV?loadAppearance():{...DEFAULT_APPEARANCE});
 useEffect(()=>{sceneRef.current?.setAppearance(appearance);try{localStorage.setItem('space-attack-appearance',JSON.stringify(appearance));}catch{}},[appearance]);
 const toggleDebug=()=>{debugRef.current=!debugRef.current;setDebugOpen(debugRef.current);keys.current={};drag.current=null;firePointer.current=null;};
const shell=useRef(null),helpRef=useRef(false),viewport=useRef(null),game=useRef(null),audio=useRef(null),keys=useRef({});const [hud,setHud]=useState({mode:'menu',score:0,lives:3,fuel:1,wave:1});const [best,setBest]=useState(()=>{try{return Number(localStorage.getItem('space-attack-best'))||0;}catch{return 0;}});const bestRef=useRef(best);const [muted,setMuted]=useState(false),[error,setError]=useState('');const [help,setHelp]=useState(false);const showHelp=value=>{helpRef.current=value;setHelp(value);};
 const prepareExpansion=()=>{const r=viewport.current.getBoundingClientRect();viewport.current.style.setProperty('--scene-top',`${r.top}px`);viewport.current.style.setProperty('--scene-right',`${window.innerWidth-r.right}px`);viewport.current.style.setProperty('--scene-bottom',`${window.innerHeight-r.bottom}px`);viewport.current.style.setProperty('--scene-left',`${r.left}px`);};
 const begin=()=>{if(!game.current||error)return;audio.current.unlock();prepareExpansion();showHelp(false);keys.current={};drag.current=null;firePointer.current=null;startGame(game.current);setHud({...game.current});viewport.current.focus();};
 const pause=()=>{const g=game.current;if(!g)return;if(g.mode==='playing'||g.mode==='transition'){g.beforePause=g.mode;g.mode='paused';}else if(g.mode==='paused'){g.mode=g.beforePause||'playing';showHelp(false);prepareExpansion();}keys.current={};drag.current=null;firePointer.current=null;setHud({...g});};
 useEffect(()=>{const g=createGame();spawnWave(g);game.current=g;audio.current=createAudio();let scene;try{scene=createScene(viewport.current);sceneRef.current=scene;scene.setAppearance(appearance);}catch{setError('This game needs a browser with WebGL enabled.');return;}
 const down=e=>{if(debugRef.current||e.target.closest('input,textarea,select,button'))return;if(['ArrowLeft','ArrowRight','Space','Escape','Enter','KeyA','KeyD'].includes(e.code))e.preventDefault();keys.current[e.code]=true;if(e.repeat)return;if(e.code==='Enter'&&(g.mode==='menu'||g.mode==='gameover'))begin();else if(e.code==='Escape'){if(helpRef.current)showHelp(false);else pause();}};const up=e=>{keys.current[e.code]=false;};const blur=()=>{keys.current={};drag.current=null;firePointer.current=null;if(g.mode==='playing'||g.mode==='transition'){g.beforePause=g.mode;g.mode='paused';setHud({...g});}};

 window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);const visibility=()=>{if(document.hidden)blur();};document.addEventListener('visibilitychange',visibility);
 let frame,last=performance.now(),acc=0,ui=0;const tick=now=>{const delta=Math.min((now-last)/1000,.1);last=now;acc+=delta;const input={left:keys.current.ArrowLeft||keys.current.KeyA,right:keys.current.ArrowRight||keys.current.KeyD,fire:keys.current.Space||firePointer.current!==null,targetX:drag.current?.targetX};while(acc>=1/120){if(!debugRef.current)updateGame(g,1/120,input);if(g.event){audio.current.play(g.event);g.event=null;}acc-=1/120;}
 if(g.score>bestRef.current){bestRef.current=g.score;setBest(g.score);try{localStorage.setItem('space-attack-best',String(g.score));}catch{}}
 scene.render(g,input,debugRef.current);ui+=delta;if(ui>.06){setHud({mode:g.mode,score:g.score,lives:g.lives,fuel:g.fuel,wave:g.wave,reason:g.reason,bonusGiven:g.bonusGiven});ui=0;}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);
 return()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);scene.dispose();audio.current.dispose();};},[]);
 const toggleSound=()=>{const value=!muted;setMuted(value);audio.current.setEnabled(!value);};
 const overlay=['menu','paused','gameover'].includes(hud.mode)||error;
 const dragStart=e=>{if(drag.current||e.pointerType==='mouse'||debugRef.current||!['playing','transition'].includes(game.current?.mode))return;e.preventDefault();touchMode.current=true;setIsTouch(true);drag.current={id:e.pointerId,x:e.clientX,targetX:game.current.player.x};e.currentTarget.setPointerCapture(e.pointerId);};
 const dragMove=e=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;e.preventDefault();const width=Math.min(window.innerWidth,window.innerHeight*24/28,720);d.targetX=Math.max(-10,Math.min(10,d.targetX+(e.clientX-d.x)*24/width));d.x=e.clientX;};
 useEffect(()=>{if(!['playing','transition'].includes(hud.mode)||debugOpen)firePointer.current=null;},[hud.mode,debugOpen]);
 const fireStart=e=>{if(firePointer.current!==null||debugRef.current||!['playing','transition'].includes(game.current?.mode))return;e.preventDefault();firePointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);audio.current?.unlock();};
 const fireEnd=e=>{if(firePointer.current===e.pointerId)firePointer.current=null;};
 const dragEnd=e=>{if(drag.current?.id===e.pointerId)drag.current=null;};
 return <main className={`shell ${debugOpen?'debug-open':''} ${overlay?'menu-screen':''}`} ref={shell} style={{'--sky-center':appearance.center,'--sky-edge':appearance.edge}}>
 {import.meta.env.DEV&&<AppearancePanel open={debugOpen} onToggle={toggleDebug} value={appearance} onChange={setAppearance}/>}
 <div className="game-column">
 <div className={'hud-top voxel-hud '+(overlay?'concealed':'')}>
 <div><span className="label">SCORE</span><strong>{format(hud.score)}</strong></div>
 <div className="wave"><span className="label">WAVE</span><strong>{String(hud.wave).padStart(2,'0')}</strong></div>
 <div className="lives"><span className="label">LIVES</span><strong aria-label={`${hud.lives} lives`}>{Array.from({length:Math.max(3,hud.lives)},(_,i)=><span className={i<hud.lives?'':'lost'} key={i}>▲</span>)}</strong></div>
 <button className="menu-button" aria-label="Pause and open menu" onClick={pause}>☰</button>
 </div>
 <div className={`playfield ${['playing','transition'].includes(hud.mode)?'playfield-playing':''}`}><div className={`scene ${['playing','transition'].includes(hud.mode)?'scene-playing':''}`} ref={viewport} onPointerDown={dragStart} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={dragEnd} onLostPointerCapture={dragEnd} tabIndex={0} aria-label="Space Attack game playfield"/>
 {overlay&&<div className="overlay"><div className={`overlay-card menu-${hud.mode} ${help?'showing-help':''}`}>
 {help?<><h2 className="help-title">HOW TO PLAY</h2><div className="instructions"><div><span>Move</span><kbd>{isTouch?'DRAG LEFT / RIGHT':'← → / A D'}</kbd></div><div><span>Fire</span><kbd>{isTouch?<span className="fire-hint">HOLD <FireIcon/></span>:'HOLD SPACE'}</kbd></div><div><span>Pause</span><kbd>{isTouch?'TAP ☰':'ESC'}</kbd></div><p>Three lives. Dodge shots and diving enemies. Clear each wave to refill your fuel. Empty fuel ends the run.</p><div className="enemy-scores"><span className="red">Drone · 30</span><span className="green">Fighter · 60</span><span className="yellow">Commander · 100</span></div><p>Double points for diving enemies. Earn a bonus life at 5,000 points. Waves get faster and fuel time gets tighter.</p></div><button className="primary" onClick={()=>showHelp(false)}>BACK</button></>:<>
 <div className="emblem"><PixelAlien/></div><h2 className="arcade-title" aria-label={hud.mode==='gameover'?'GAME OVER':hud.mode==='paused'?'PAUSED':'SPACE ATTACK'}>{(hud.mode==='gameover'?['GAME','OVER']:hud.mode==='paused'?['PAUSED']:['SPACE','ATTACK']).map(word=><PixelText key={word}>{word}</PixelText>)}</h2>
 {hud.mode==='gameover'&&<p>{hud.reason}</p>}{error&&<p>{error}</p>}
 <div className="run-stats">{hud.mode!=='menu'&&<span>SCORE <b aria-label={format(hud.score)}><PixelText>{format(hud.score)}</PixelText></b></span>}<span>PERSONAL BEST <b aria-label={format(best)}><PixelText>{format(best)}</PixelText></b></span></div>
 <button className="primary" disabled={!!error} onClick={hud.mode==='paused'?pause:begin} aria-label={hud.mode==='paused'?'RESUME':hud.mode==='gameover'?'PLAY AGAIN':'PLAY'}><PixelText>{hud.mode==='paused'?'RESUME':hud.mode==='gameover'?'PLAY AGAIN':'PLAY'}</PixelText><span className="pixel-arrow" aria-hidden="true"/></button>
 {hud.mode==='menu'&&<div className="start-controls" aria-label="Game controls"><div><span>Move</span><kbd>{isTouch?'DRAG ↔':'← → / A D'}</kbd></div><div><span>Fire</span><kbd>{isTouch?<span className="fire-hint">HOLD <FireIcon/></span>:'HOLD SPACE'}</kbd></div><div><span>Pause</span><kbd>{isTouch?'TAP ☰':'ESC'}</kbd></div></div>}
 <div className="menu-options"><button onClick={()=>showHelp(true)}>HOW TO PLAY</button><button onClick={toggleSound}>{muted?'SOUND OFF':'SOUND ON'}</button></div>
 {hud.mode==='paused'&&<button className="quiet-button" onClick={()=>{game.current.mode='menu';showHelp(false);keys.current={};drag.current=null;firePointer.current=null;setHud({...game.current});}}>QUIT TO START</button>}
 </>}
 </div></div>}
 {hud.mode==='transition'&&<div className="wave-banner" role="status" aria-live="polite">
 <h2 className="wave-clear-title" aria-label={`Wave ${hud.wave} clear`}><PixelText className="wave-clear-number">{`WAVE ${String(hud.wave).padStart(2,'0')}`}</PixelText><PixelText className="wave-clear-word">CLEAR</PixelText></h2>
 <div className="refuel-blocks" aria-hidden="true">{Array.from({length:12},(_,i)=><span key={i} style={{'--block':i}}/>)}</div><p>REFUELING</p>
 </div>}
 {hud.mode==='playing'&&hud.fuel<.2&&<div className="fuel-warning">LOW FUEL</div>}
 </div>
 <div className={'fuel-panel voxel-fuel '+(hud.fuel<.2?'low ':'')+(overlay?'concealed':'')}><div className="fuel-title"><span>FUEL</span><b>{Math.ceil(hud.fuel*100)}%</b></div><div className="fuel-track"><div style={{width:`${hud.fuel*100}%`}}/></div></div>

 </div>
 {isTouch&&!overlay&&!debugOpen&&<button className="touch-fire" aria-label="Hold to fire" onPointerDown={fireStart} onPointerUp={fireEnd} onPointerCancel={fireEnd} onLostPointerCapture={fireEnd} onContextMenu={e=>e.preventDefault()}><FireIcon/></button>}
 </main>;

}
createRoot(document.getElementById('root')).render(<App/>);
