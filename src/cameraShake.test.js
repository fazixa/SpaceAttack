import {test} from 'node:test';
import assert from 'node:assert/strict';
import {impactOffset} from './cameraShake.js';
import {createGame,startGame,updateGame,damagePlayer} from './game.js';

test('enemy contact and bullets each register one impact, protected hits register none',()=>{
 for(const type of ['enemy','bullet']){
  const g=createGame(()=>.5);startGame(g);g.invincible=0;
  if(type==='enemy')g.enemies=[{id:1,type:'red',phase:'formation',homeX:0,homeY:-10,x:0,y:-10}];
  else g.bullets=[{id:99,owner:'enemy',x:0,y:-10,vx:0,vy:0}];
  updateGame(g,1/120);assert.equal(g.damageCount,1);assert.equal(g.lives,2);
  damagePlayer(g);assert.equal(g.damageCount,1);
  g.invincible=0;g.lives=1;damagePlayer(g);assert.equal(g.damageCount,2);assert.equal(g.mode,'gameover');
  updateGame(g,1);assert.equal(g.damageCount,2);
  startGame(g);assert.equal(g.damageCount,0);
 }
});
test('impact is bounded, fades, and finishes at the exact neutral position',()=>{
 assert.equal(impactOffset(0).x,.22);
 for(let age=0;age<.32;age+=.001){const {x,y}=impactOffset(age);const bound=.22*(1-age/.32)**2;assert.ok(Math.abs(x)<=bound+1e-10);assert.ok(Math.abs(y)<=bound*.7+1e-10);}
 for(const age of [-1,.32,1,Infinity])assert.deepEqual(impactOffset(age),{x:0,y:0});
});
