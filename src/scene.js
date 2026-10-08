import * as THREE from 'three';
import {impactOffset} from './cameraShake.js';
import {updateObjectTilt} from './objectTilt.js';
import {advanceMeteorTravel} from './background.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
const COLORS={red:0xff0000,green:0x00ff00,yellow:0xffed00,cyan:0x04dfff};
const POSES={
 red:[['00100100','11111111','01011010','01111110','00111100','01100110','00100100'],['00100100','01111110','11011011','01111110','00111100','00100100','01000010']],
 green:[['00100100','11111111','01011010','01111110','00111100','01100110','00100100'],['00100100','01111110','11011011','01111110','00111100','00100100','01000010']],
 yellow:[['10011001','10111101','11111111','01011010','01111110','00111100','00011000'],['01011010','01111110','11111111','01011010','01111110','00111100','00100100']],
};
const PLAYER=['0001000','0011100','0001000','1111111','1100011','1000001'];
const FONT={
 '0':['01110','11011','11011','10101','11011','11011','01110'],
 '1':['00100','01100','00100','00100','00100','00100','01110'],
 '2':['01110','10001','00001','00010','00100','01000','11111'],
 '3':['11110','00001','00001','01110','00001','00001','11110'],
 '4':['10010','10010','10010','11111','00010','00010','00010'],
 '5':['11111','10000','10000','11110','00001','00001','11110'],
 '6':['01110','10000','10000','11110','10001','10001','01110'],
 '7':['11111','00001','00010','00100','01000','01000','01000'],
 '8':['01110','10001','10001','01110','10001','10001','01110'],
 '9':['01110','10001','10001','01111','00001','00001','01110'],
 E:['11111','10000','10000','11110','10000','10000','11111'],
 W:['10001','10001','10001','10101','10101','11011','10001'],
};
const blockGeometry=new THREE.BoxGeometry(1,1,1);
const materials={};
function voxelMaterial(color){
 if(!materials[color]){
  const surface=factor=>new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(factor)});
  // Color-rich shaded edges with restrained neutral reflections.
  materials[color]=[surface(.4),surface(.28),surface(.75),surface(.28),new THREE.MeshBasicMaterial({color}),surface(.24)];
 }
 return materials[color];
}
function voxelMask(rows,color,size=.22,depth=.36){
 const count=rows.join('').split('1').length-1;
 const mesh=new THREE.InstancedMesh(blockGeometry,voxelMaterial(color),count);
 const matrix=new THREE.Matrix4();let i=0;
 rows.forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='1'){
  matrix.compose(new THREE.Vector3((x-(row.length-1)/2)*size,((rows.length-1)/2-y)*size,0),new THREE.Quaternion(),new THREE.Vector3(size,size,depth));mesh.setMatrixAt(i++,matrix);
 }}));
 mesh.instanceMatrix.needsUpdate=true;
 return mesh;
}
export function makeAlien(type='red'){
 const root=new THREE.Group(),body=new THREE.Group();root.add(body);
 for(const mask of POSES[type])body.add(voxelMask(mask,COLORS[type],.205,.38));
 body.rotation.set(-.42,0,0);body.children[1].visible=false;
 root.userData.body=body;root.userData.frames=body.children;return root;
}
export function makeShip(){const root=new THREE.Group();const body=voxelMask(PLAYER,COLORS.cyan,.23,.42);body.rotation.set(-.42,0,0);root.add(body);return root;}
function voxelText(value,color=COLORS.yellow,size=.15){
 const root=new THREE.Group();[...value].forEach((char,i)=>{if(!FONT[char])return;const letter=voxelMask(FONT[char],color,size,size*1.7);letter.position.x=i*size*6;root.add(letter);});
 root.rotation.set(-.42,0,0);root.userData.width=value.length*size*6;return root;
}
function meteor(seed,radius){
 const root=new THREE.Group(),positions=[];let n=seed;
 const random=()=>{n=(n*1664525+1013904223)>>>0;return n/4294967296;};
 const step=.4,extent=Math.ceil(radius/step);
 for(let x=-extent;x<=extent;x++)for(let y=-extent;y<=extent;y++)for(let z=-extent;z<=extent;z++){
  const distance=Math.hypot(x,y,z)*step;
  if(distance<radius*(.78+random()*.3)&&distance>radius-step*1.6)positions.push([x*step,y*step,z*step,.6+random()*.4]);
 }
 const material=new THREE.MeshStandardMaterial({color:0x50445d,roughness:.86,metalness:0,envMapIntensity:.15});
 const blocks=new THREE.InstancedMesh(blockGeometry,material,positions.length);const matrix=new THREE.Matrix4(),color=new THREE.Color();
 positions.forEach(([x,y,z,t],i)=>{matrix.compose(new THREE.Vector3(x,y,z),new THREE.Quaternion(),new THREE.Vector3(step,step,step));blocks.setMatrixAt(i,matrix);color.setRGB(t*.7,t*.64,t*.8);blocks.setColorAt(i,color);});
 root.add(blocks);root.rotation.set(.35,.45,.2);root.userData.material=material;
 root.userData.motion={phase:Math.random()*Math.PI*2,pitch:.35+(Math.random()-.5)*.3,yaw:Math.random()*Math.PI,roll:(Math.random()-.5)*.6,spinX:(Math.random()-.5)*.08,spinY:(Math.random()<.5?-1:1)*(.025+Math.random()*.07),spinZ:(Math.random()-.5)*.08};
 return root;
}
export function createScene(element){
 const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x020407);renderer.toneMapping=THREE.ReinhardToneMapping;renderer.toneMappingExposure=1.5;element.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-12,12,14,-14,.1,150);camera.position.set(0,-5,40);camera.lookAt(0,0,0);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0x989ec6,0x171420,.3));
 const key=new THREE.DirectionalLight(0xffe6a7,1.8);key.position.set(-6,10,14);scene.add(key);
 const rim=new THREE.DirectionalLight(0x778eff,.35);rim.position.set(7,-3,9);scene.add(rim);
 const floor=new Reflector(new THREE.PlaneGeometry(180,180),{textureWidth:768,textureHeight:768,color:0x30363f});floor.position.z=-7;scene.add(floor);
 // A circular blue wash beneath the scene, anchored to the full-page sky.
 let appearanceRadius=1.4,tiltAngle=THREE.MathUtils.degToRad(10),tiltPreview=0;
 floor.material.uniforms.skyRadius={value:18};
 floor.material.uniforms.skyCenter={value:new THREE.Color('#030912')};
 floor.material.uniforms.skyEdge={value:new THREE.Color('#010205')};
 floor.material.uniforms.skySoftness={value:.6};
 floor.material.uniforms.skyBrightness={value:1};
 floor.material.vertexShader=floor.material.vertexShader.replace('varying vec4 vUv;', 'varying vec4 vUv; varying vec2 skyPosition;').replace('vUv = textureMatrix', 'skyPosition = (modelViewMatrix * vec4(position, 1.0)).xy; vUv = textureMatrix');
 floor.material.fragmentShader=floor.material.fragmentShader.replace('varying vec4 vUv;', 'varying vec4 vUv; varying vec2 skyPosition; uniform float skyRadius; uniform vec3 skyCenter; uniform vec3 skyEdge; uniform float skySoftness; uniform float skyBrightness;').replace('#include <tonemapping_fragment>', `
  float centerLight = 1.0 - smoothstep(skyRadius * (1.0 - skySoftness), skyRadius, length(skyPosition));
  gl_FragColor.rgb += mix(skyEdge, skyCenter, centerLight) * skyBrightness;
  #include <tonemapping_fragment>`);

 const hudScene=new THREE.Scene(),hudCamera=camera.clone();
 let lastDamageCount=0,impactStarted=-Infinity;
 let lastGameTime=0,lastRenderTime=performance.now()/1000;
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
 const hudPass=new RenderPass(hudScene,hudCamera);hudPass.clear=false;hudPass.clearDepth=true;composer.addPass(hudPass);
 const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.13,.07,0);composer.addPass(bloom);composer.addPass(new OutputPass());
 const stars=new THREE.InstancedMesh(blockGeometry,new THREE.MeshStandardMaterial({color:0xffefa4,emissive:0xffdf62,emissiveIntensity:.45,roughness:.85}),250);scene.add(stars);
 const starData=Array.from({length:250},()=>({x:Math.random()*2-1,y:Math.random()*2-1,size:.025+Math.random()**3*.065}));const matrix=new THREE.Matrix4();
 const rocks=[[-1,.7,2.4],[1,.76,1.8],[-1,-.6,2.7],[1,-.65,2.4],[-1,-.12,.6],[1,-.03,.7],[-1,-.9,.4],[1,.24,.5]].map(([side,y,r],i)=>{const rock=meteor(i+71,r);rock.userData.side=side;rock.userData.height=y;rock.userData.radius=r;rock.userData.travel=0;rock.userData.speed=.65+Math.random()*1.3;rock.userData.lane=0;rock.userData.depth=-2.5+Math.random()*4;scene.add(rock);return rock;});
 // Keep gameplay positions fixed; apply tilt separately around each object center.
 const gameObjects=new THREE.Group();scene.add(gameObjects);
 // Screen-up is perpendicular to the camera view, unlike world Y with this pitched camera.
 const tiltAxis=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion).normalize();
 const player=makeShip();gameObjects.add(player);const enemies=new Map(),bullets=new Map(),effects=new Map();
 const shotGeometry=new THREE.BoxGeometry(.09,.65,.14),shotMaterials={player:new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xeed7ff,emissiveIntensity:3}),enemy:new THREE.MeshStandardMaterial({color:0xffb467,emissive:0xff5a19,emissiveIntensity:2})};
 const hud=new THREE.Group();hudScene.add(hud);let scoreText,waveText,lifeText;let lastScore=-1,lastWave=-1,lastLives=-1;
 const fuelLabel=voxelText('E',COLORS.red,.13);hud.add(fuelLabel);
 const fuelMaterial=voxelMaterial(COLORS.green),fuelBlocks=new THREE.InstancedMesh(blockGeometry,fuelMaterial,24);hud.add(fuelBlocks);
 const lifeShips=new THREE.Group();hud.add(lifeShips);for(let i=0;i<5;i++){const ship=voxelMask(PLAYER,COLORS.green,.12,.25);ship.rotation.set(-.42,0,0);ship.position.x=i*1.08;lifeShips.add(ship);}
 const replaceText=(old,value,color,size)=>{if(old){hud.remove(old);old.traverse(object=>{if(object.isInstancedMesh)object.dispose();});}const text=voxelText(value,color,size);hud.add(text);return text;};
 const sync=(map,items,create,update)=>{const ids=new Set(items.map(i=>i.id));for(const [id,object]of map)if(!ids.has(id)){gameObjects.remove(object);object.traverse(part=>{if(part.isInstancedMesh)part.dispose();});if(object.userData.ownMaterial)object.material.dispose();map.delete(id);}for(const item of items){let object=map.get(item.id);if(!object){object=create(item);map.set(item.id,object);gameObjects.add(object);}update(object,item);}};
 const ambientStart=performance.now();const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let halfWidth=12,halfHeight=14,scrollTime=0,lastBackgroundFrame=performance.now();
 const updateStars=()=>{
  const extent=halfHeight*1.08,span=extent*2;
  starData.forEach((star,i)=>{
   const y=star.y*extent-scrollTime*(.45+star.size*8);
   const wrapped=((y+extent)%span+span)%span-extent;
   matrix.compose(new THREE.Vector3(star.x*halfWidth*1.08,wrapped,-.2),new THREE.Quaternion(),new THREE.Vector3(star.size,star.size,star.size));stars.setMatrixAt(i,matrix);
  });
  stars.instanceMatrix.needsUpdate=true;stars.computeBoundingSphere();
 };
 const advanceBackground=active=>{
  const now=performance.now(),dt=Math.min((now-lastBackgroundFrame)/1000,.1);lastBackgroundFrame=now;
  if(!active||reduceMotion.matches)return;
  scrollTime+=dt;
  advanceMeteorTravel(rocks,dt);
  rocks.forEach((rock,i)=>{
   const y=rock.userData.height*halfHeight-rock.userData.travel;
   if(y>-halfHeight-rock.userData.radius-1)return;
   // Rebuild only beyond the lower edge, then enter naturally from above.
   const radius=Math.random()<.45?.35+Math.random()*.65:1.4+Math.random()*1.5;
   const replacement=meteor(Math.floor(Math.random()*4294967295),radius);
   Object.assign(replacement.userData,{side:Math.random()<.5?-1:1,height:1+(radius+1+Math.random()*3)/halfHeight,radius,travel:0,speed:.65+Math.random()*1.3,lane:radius<1?-.5-Math.random()*1.5:Math.random()*.4,depth:-2.5+Math.random()*4});
   scene.remove(rock);rock.traverse(part=>{if(part.isInstancedMesh)part.dispose();});rock.userData.material.dispose();
   rocks[i]=replacement;scene.add(replacement);
  });
 };

 const updateMeteors=()=>{
  const skyTime=reduceMotion.matches?0:(performance.now()-ambientStart)/1000;
  rocks.forEach((rock,i)=>{
   const motion=rock.userData.motion,phase=motion.phase;
   rock.position.x=rock.userData.side*(halfWidth-rock.userData.radius*.35-.5+rock.userData.lane)+Math.sin(skyTime*.2+phase)*.4;
   rock.position.y=rock.userData.height*halfHeight-rock.userData.travel+Math.sin(skyTime*.16+phase)*.6;
   rock.position.z=rock.userData.depth+Math.sin(skyTime*.14+phase)*.18;
   rock.rotation.set(motion.pitch+skyTime*motion.spinX,motion.yaw+skyTime*motion.spinY,motion.roll+skyTime*motion.spinZ);
  });
 };

 const layout=()=>{
  const width=Math.max(1,element.clientWidth),height=Math.max(1,element.clientHeight);
  // Use the full page's world scale in every mode; menus crop that view.
  const scale=Math.min(window.innerWidth/24,window.innerHeight/28,720/24);
  halfWidth=window.innerWidth/(scale*2);halfHeight=window.innerHeight/(scale*2);
  floor.material.uniforms.skyRadius.value=Math.min(halfWidth,halfHeight)*appearanceRadius;
  const bounds=element.getBoundingClientRect();
  const centerX=(bounds.left+width/2-window.innerWidth/2)/scale;
  const centerY=(window.innerHeight/2-bounds.top-height/2)/scale;
  camera.left=centerX-width/(scale*2);camera.right=centerX+width/(scale*2);
  camera.top=centerY+height/(scale*2);camera.bottom=centerY-height/(scale*2);camera.updateProjectionMatrix();hudCamera.copy(camera);
  updateStars();
  updateMeteors();
  renderer.setSize(width,height,false);composer.setSize(width,height);composer.render();
 };
 const observer=new ResizeObserver(layout);observer.observe(element);window.addEventListener('resize',layout);layout();
 return {setAppearance(value){
  appearanceRadius=value.radius;
  tiltAngle=THREE.MathUtils.degToRad(value.tiltDegrees??10);tiltPreview=value.tiltPreview??0;
  bloom.strength=value.bloomStrength;bloom.radius=value.bloomRadius;bloom.threshold=value.bloomThreshold;
  const uniforms=floor.material.uniforms;
  uniforms.skyRadius.value=Math.min(halfWidth,halfHeight)*appearanceRadius;
  uniforms.skyCenter.value.set(value.center);uniforms.skyEdge.value.set(value.edge);
  uniforms.skySoftness.value=value.softness;uniforms.skyBrightness.value=value.brightness;
 },render(g,input,debugging=false){
  advanceBackground(!debugging&&(g.mode==='playing'||g.mode==='transition'));updateStars();
  player.position.set(g.player.x,g.player.y,.15);player.quaternion.identity();player.visible=g.mode!=='gameover'&&(g.invincible<=0||Math.floor(g.elapsed*12)%2===0);
  sync(enemies,g.enemies,e=>makeAlien(e.type),(alien,e)=>{alien.position.set(e.x,e.y,.15);const frame=(Math.floor(g.elapsed*4)+e.id)%2;alien.userData.frames.forEach((pose,i)=>pose.visible=i===frame);alien.quaternion.identity();});
  sync(bullets,g.bullets,b=>new THREE.Mesh(shotGeometry,shotMaterials[b.owner]),(shot,b)=>{shot.position.set(b.x,b.y,.35);shot.rotation.set(0,0,-Math.atan2(b.vx,b.vy));});
  sync(effects,g.effects,e=>{const debris=new THREE.InstancedMesh(blockGeometry,new THREE.MeshStandardMaterial({color:COLORS[e.color],emissive:COLORS[e.color],emissiveIntensity:1.5,transparent:true}),12);debris.userData.ownMaterial=true;return debris;},(debris,e)=>{debris.position.set(e.x,e.y,.3);for(let i=0;i<12;i++){const angle=i*2.399+e.seed,spread=e.age*4;matrix.compose(new THREE.Vector3(Math.cos(angle)*spread,Math.sin(angle)*spread,Math.sin(i)*e.age),new THREE.Quaternion(),new THREE.Vector3(.1,.1,.1));debris.setMatrixAt(i,matrix);}debris.instanceMatrix.needsUpdate=true;debris.material.opacity=1-e.age/.7;});
  hud.visible=['playing','transition'].includes(g.mode);
  if(g.score!==lastScore){scoreText=replaceText(scoreText,String(g.score).padStart(6,'0'),COLORS.yellow,.16);lastScore=g.score;}
  if(g.wave!==lastWave){waveText=replaceText(waveText,'W'+String(g.wave).padStart(2,'0'),COLORS.yellow,.13);lastWave=g.wave;}
  if(g.lives!==lastLives){lifeText=replaceText(lifeText,String(g.lives),COLORS.red,.13);lastLives=g.lives;}
  const inset=.9;scoreText.position.set(-halfWidth+inset+.35,halfHeight-1.25,.6);waveText.position.set(halfWidth-waveText.userData.width-inset-1.3,halfHeight-1.25,.6);
  fuelLabel.position.set(-halfWidth+inset,-halfHeight+1.35,.6);fuelBlocks.position.set(-halfWidth+inset+.75,-halfHeight+1.35,.6);
  for(let i=0;i<24;i++){const filled=i<Math.ceil(g.fuel*24);matrix.compose(new THREE.Vector3(i*.24,0,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(-.42,0,0)),new THREE.Vector3(.24,filled?.48:.06,.26));fuelBlocks.setMatrixAt(i,matrix);}fuelBlocks.instanceMatrix.needsUpdate=true;
  lifeShips.position.set(halfWidth-4.6,-halfHeight+1.35,.6);lifeShips.children.forEach((ship,i)=>{ship.visible=i<Math.min(g.lives,3);});lifeText.position.set(halfWidth-1,-halfHeight+1.35,.6);
  updateMeteors();
  const now=performance.now()/1000;
  const renderDt=Math.min(Math.max(0,now-lastRenderTime),.1),gameDt=g.elapsed-lastGameTime;
  const active=g.mode==='playing'&&!debugging&&!reduceMotion.matches;
  const preview=debugging&&!reduceMotion.matches?tiltPreview:null;
  const reset=gameDt<0||gameDt>=.15||reduceMotion.matches;
  const playerAngle=updateObjectTilt(player,g.player,{dt:renderDt,gameDt,active,preview,maxAngle:tiltAngle,reset:reset||g.damageCount!==lastDamageCount});
  player.quaternion.setFromAxisAngle(tiltAxis,playerAngle);
  for(const enemy of g.enemies){
   const alien=enemies.get(enemy.id),diving=enemy.phase==='dive';
   const angle=updateObjectTilt(alien,enemy,{dt:renderDt,gameDt,active,preview,maxAngle:tiltAngle*(diving?1.25:.3),fullSpeed:diving?7:1.8,reset});
   alien.quaternion.setFromAxisAngle(tiltAxis,angle);
  }
  lastRenderTime=now;lastGameTime=g.elapsed;
  if(g.damageCount>lastDamageCount)impactStarted=now;
  if(g.damageCount<lastDamageCount||g.mode==='menu'||g.mode==='paused'||debugging||reduceMotion.matches)impactStarted=-Infinity;
  lastDamageCount=g.damageCount;
  const offset=impactOffset(now-impactStarted);
  camera.position.set(offset.x,-5+offset.y,40);
  try{composer.render();}finally{camera.position.set(0,-5,40);camera.updateMatrixWorld();}
 },dispose(){observer.disconnect();window.removeEventListener('resize',layout);const geometries=new Set(),mats=new Set();const collect=o=>{if(o.geometry)geometries.add(o.geometry);if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);}};scene.traverse(collect);hudScene.traverse(collect);scene.traverse(object=>{if(object.isInstancedMesh)object.dispose();});hudScene.traverse(object=>{if(object.isInstancedMesh)object.dispose();});geometries.forEach(geometry=>geometry.dispose());mats.forEach(material=>material.dispose());floor.getRenderTarget().dispose();environment.dispose();bloom.dispose();composer.dispose();renderer.dispose();renderer.domElement.remove();}};
}
