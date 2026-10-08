import {test} from 'node:test';
import assert from 'node:assert/strict';
import {springTilt,updateObjectTilt} from './objectTilt.js';
test('spring feels consistent across frame rates and rebounds gently on release',()=>{
 const run=hz=>{const s={angle:0,speed:0};for(let i=0;i<hz;i++)springTilt(s,.17,1/hz);return s;};
 assert.ok(Math.abs(run(30).angle-run(120).angle)<1e-10);
 const s=run(60);let minimum=0;for(let i=0;i<120;i++){springTilt(s,0,1/60);minimum=Math.min(minimum,s.angle);}
 assert.ok(minimum<0&&minimum>-.02);assert.ok(Math.abs(s.angle)<.0001);
});
test('objects lean independently and respawn, pause, or disabling tilt clears motion',()=>{
 const left={userData:{}},right={userData:{}};
 const opts={dt:1/60,gameDt:1/60,active:true,preview:null,maxAngle:.17};
 for(let i=0;i<30;i++){
  updateObjectTilt(left,{x:-i*.1,y:0},opts);updateObjectTilt(right,{x:i*.1,y:0},opts);
 }
 assert.ok(left.userData.motionTilt.angle<0);assert.ok(right.userData.motionTilt.angle>0);
 assert.equal(updateObjectTilt(left,{x:0,y:14,phase:'return'},opts),0);
 assert.equal(updateObjectTilt(right,{x:2.9,y:0},{...opts,active:false}),0);
 assert.equal(updateObjectTilt(right,{x:3,y:0},{...opts,maxAngle:0}),0);
});
