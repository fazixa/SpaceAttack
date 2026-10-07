import {test} from 'node:test';import assert from 'node:assert/strict';
import {createGame,startGame,updateGame,damagePlayer,destroyEnemy,waveSettings} from './game.js';
test('start and restart reset all run state',()=>{const g=createGame(()=>.5);startGame(g);g.score=600;g.lives=1;g.fuel=.1;startGame(g);assert.equal(g.score,0);assert.equal(g.lives,3);assert.equal(g.fuel,1);assert.equal(g.enemies.length,32);});
test('held fire is rate limited and movement bounded',()=>{const g=createGame(()=>.5);startGame(g);for(let i=0;i<60;i++) updateGame(g,1/60,{fire:true,right:true});assert.ok(g.bullets.length<=6);assert.equal(g.player.x,10);});
test('swept projectile destroys enemy and awards points once',()=>{const g=createGame();startGame(g);g.enemies=[{id:1,type:'red',phase:'formation',homeX:0,homeY:0,x:0,y:0}];g.bullets=[{x:0,y:-1,vy:24,vx:0,owner:'player'}];updateGame(g,.1);assert.equal(g.score,30);assert.equal(g.mode,'transition');});
test('damage respects invulnerability and last life ends run',()=>{const g=createGame();startGame(g);assert.equal(damagePlayer(g),false);g.invincible=0;damagePlayer(g);assert.equal(g.lives,2);damagePlayer(g);assert.equal(g.lives,2);g.invincible=0;g.lives=1;damagePlayer(g);assert.equal(g.mode,'gameover');});
test('fuel exhaustion ends run and difficulty tightens with caps',()=>{const g=createGame();startGame(g);g.fuel=.0001;updateGame(g,.1);assert.equal(g.mode,'gameover');assert.ok(waveSettings(2).fuelSeconds<waveSettings(1).fuelSeconds);assert.equal(waveSettings(100).fuelSeconds,45);});
test('wave clears refill fuel and bonus life awarded once',()=>{const g=createGame();startGame(g);g.score=4990;destroyEnemy(g,g.enemies[0]);assert.equal(g.lives,4);destroyEnemy(g,g.enemies[0]);assert.equal(g.lives,4);g.enemies=[];updateGame(g,.01);updateGame(g,2.3);assert.equal(g.wave,2);assert.equal(g.fuel,1);});
test('fatal hit sound is emitted once and does not repeat after game over',()=>{
 const g=createGame();startGame(g);g.lives=1;g.invincible=0;
 g.enemies=[{id:1,type:'red',phase:'formation',homeX:0,homeY:-10,x:0,y:-10}];
 updateGame(g,1/120);assert.equal(g.mode,'gameover');assert.equal(g.event,'hit');
 for(let i=0;i<120;i++){updateGame(g,1/120);assert.equal(g.event,null);}
});
test('paused game clears the previous sound event without advancing',()=>{
 const g=createGame();startGame(g);updateGame(g,1/120,{fire:true});assert.equal(g.event,'fire');
 g.mode='paused';const elapsed=g.elapsed;updateGame(g,1/120);
 assert.equal(g.event,null);assert.equal(g.elapsed,elapsed);
});
