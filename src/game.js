export const WORLD = { halfWidth: 11, playerY: -10 };
export const waveSettings = wave => ({ fuelSeconds: Math.max(45, 100 - (wave - 1) * 5), diveInterval: Math.max(.65, 2.2 - (wave - 1) * .12), diveSpeed: Math.min(.5, .32 + (wave - 1) * .012), bulletSpeed: Math.min(26, 16 + (wave - 1) * .6), maxDivers: Math.min(7, 1 + Math.ceil(wave / 2)) });
export function createGame(random = Math.random) {
  return { mode: 'menu', score: 0, lives: 3, fuel: 1, wave: 1, player: {x: 0, y: WORLD.playerY}, enemies: [], bullets: [], effects: [], elapsed: 0, cooldown: 0, invincible: 0, diveTimer: 1.6, transition: 0, bonusGiven: false, random, nextId: 1, event: null, damageCount: 0 };
}
export function spawnWave(g) {
  g.enemies = [];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 8; col++) {
    const type = row === 0 && (col === 3 || col === 4) ? 'yellow' : row < 2 ? 'green' : 'red';
    g.enemies.push({id:g.nextId++, type, homeX:(col-3.5)*2.15, homeY:10.3-row*1.65, x:(col-3.5)*2.15, y:10.3-row*1.65, phase:'formation', t:0, fired:false});
  }
  g.fuel = 1; g.diveTimer = 1.8; g.bullets = [];
}
export function startGame(g) { const fresh = createGame(g.random); Object.assign(g, fresh); g.mode = 'playing'; spawnWave(g); g.invincible = 2; }
function burst(g, x, y, color) { g.effects.push({id:g.nextId++, x, y, color, age:0, seed:g.random()*100}); }
export function damagePlayer(g) {
  if (g.mode !== 'playing' || g.invincible > 0) return false;
  burst(g,g.player.x,g.player.y,'cyan'); g.lives--; g.damageCount++; g.event = 'hit';
  if (g.lives <= 0) {g.mode='gameover'; g.reason='Your fleet has fallen.';} else {g.player.x=0; g.invincible=2;}
  return true;
}
export function destroyEnemy(g, enemy) {
  if (!g.enemies.includes(enemy)) return;
  g.score += ({red:30,green:60,yellow:100}[enemy.type]) * (enemy.phase === 'dive' ? 2 : 1);
  burst(g,enemy.x,enemy.y,enemy.type); g.enemies.splice(g.enemies.indexOf(enemy),1); g.event='kill';
  if (g.score >= 5000 && !g.bonusGiven) {g.lives++; g.bonusGiven=true; g.event='bonus';}
}
export function updateGame(g, dt, input = {}) {
  g.event=null;
  if (g.mode !== 'playing' && g.mode !== 'transition') return;
  g.elapsed+=dt; g.effects.forEach(e=>e.age+=dt); g.effects=g.effects.filter(e=>e.age<.7);
  if (g.mode === 'transition') {g.transition-=dt; if(g.transition<=0) {g.wave++;spawnWave(g);g.mode='playing';g.invincible=1.5;} return;}
  const s=waveSettings(g.wave);
  g.invincible=Math.max(0,g.invincible-dt); g.cooldown=Math.max(0,g.cooldown-dt);
  const move=Number.isFinite(input.targetX)?Math.max(-12*dt,Math.min(12*dt,input.targetX-g.player.x)):(Number(!!input.right)-Number(!!input.left))*12*dt;
  g.player.x=Math.max(-10,Math.min(10,g.player.x+move));
  g.fuel=Math.max(0,g.fuel-dt/s.fuelSeconds);
  if(g.fuel<=0) {g.mode='gameover';g.reason='Fuel reserves exhausted.';return;}
  if(input.fire && g.cooldown<=0) {g.bullets.push({id:g.nextId++,x:g.player.x,y:g.player.y+.85,vy:24,vx:0,owner:'player'});g.cooldown=.19;g.event='fire';}
  const sway=Math.sin(g.elapsed*(.7+g.wave*.03))*1.4;
  g.diveTimer-=dt;
  if(g.diveTimer<=0) {
    const available=g.enemies.filter(e=>e.phase==='formation');
    if(available.length && g.enemies.filter(e=>e.phase==='dive').length<s.maxDivers) {
      const e=available[Math.floor(g.random()*available.length)];e.phase='dive';e.t=0;e.startX=e.x;e.startY=e.y;e.targetX=g.player.x;e.side=g.random()<.5?-1:1;e.fired=false;
    }
    g.diveTimer=s.diveInterval*(.8+g.random()*.4);
  }
  for(const e of g.enemies) {
    if(e.phase==='formation') {e.x=e.homeX+sway;e.y=e.homeY+Math.sin(g.elapsed+e.homeX)*.08;}
    else if(e.phase==='dive') {
      e.t+=dt*s.diveSpeed; const t=e.t;
      e.x=e.startX+(e.targetX-e.startX)*Math.min(1,t)+Math.sin(t*Math.PI*2)*2.3*e.side;e.y=e.startY-t*24;
      if(t>.3 && !e.fired) {e.fired=true;const dx=g.player.x-e.x,dy=g.player.y-e.y, len=Math.hypot(dx,dy);g.bullets.push({id:g.nextId++,x:e.x,y:e.y,vx:dx/len*s.bulletSpeed,vy:dy/len*s.bulletSpeed,owner:'enemy'});}
      if(e.y < -14) {e.phase='return';e.y=14;e.x=e.homeX+sway;}
    } else {e.y-=dt*7;if(e.y<=e.homeY) e.phase='formation';}
    if(Math.hypot(e.x-g.player.x,e.y-g.player.y)<.95) damagePlayer(g);
  }
  for(const b of g.bullets) {
    b.previousY=b.y;b.previousX=b.x;b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.owner==='player') {
      const hit=g.enemies.find(e=>Math.abs(e.x-b.x)<.72 && e.y>=Math.min(b.previousY,b.y)-.6 && e.y<=Math.max(b.previousY,b.y)+.6);
      if(hit) {b.dead=true;destroyEnemy(g,hit);}
    } else if(Math.hypot(b.x-g.player.x,b.y-g.player.y)<.55) {b.dead=true;damagePlayer(g);}
  }
  g.bullets=g.bullets.filter(b=>!b.dead && Math.abs(b.y)<15 && Math.abs(b.x)<14);
  if(!g.enemies.length && g.mode==='playing') {g.mode='transition';g.transition=2.2;g.bullets=[];g.event='wave';}
}
