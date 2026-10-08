import {test} from 'node:test';import assert from 'node:assert/strict';import {advanceMeteorTravel} from './background.js';
const rock=(speed,travel=0)=>({userData:{speed,travel}});
test('overlapping meteors retain their individual constant speeds',()=>{
 const slow=rock(.55),fast=rock(1.65);
 for(let i=0;i<3600;i++)advanceMeteorTravel([slow,fast],1/60);
 assert.ok(Math.abs(slow.userData.travel-33)<1e-8);
 assert.ok(Math.abs(fast.userData.travel-99)<1e-8);
 assert.equal(slow.userData.speed,.55);assert.equal(fast.userData.speed,1.65);
});
test('paused background does not advance',()=>{const meteor=rock(1.65,7);advanceMeteorTravel([meteor],0);assert.equal(meteor.userData.travel,7);});
