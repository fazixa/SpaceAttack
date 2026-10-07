import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const colors={cyan:0x66eeff,red:0xff4656,green:0x9dfb65,yellow:0xffdf70};
function hull(points,material,depth=.35){const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.07,bevelThickness:.07,curveSegments:8});geo.computeVertexNormals();return new THREE.Mesh(geo,material);}
export function makeShip(type='cyan') {
 const group=new THREE.Group(), player=type==='cyan';
 const metal=new THREE.MeshStandardMaterial({color:player?0x9bacbb:0x657080,metalness:.72,roughness:.28});
 const trim=new THREE.MeshStandardMaterial({color:colors[type],metalness:.45,roughness:.25,emissive:colors[type],emissiveIntensity:.12});
 const glass=new THREE.MeshPhysicalMaterial({color:0x102b40,metalness:.35,roughness:.12,clearcoat:1,clearcoatRoughness:.1});
 const body=hull(player?[[-.28,-.5],[-.35,.05],[0,.85],[.35,.05],[.28,-.5]]:[[-.38,-.35],[-.48,.2],[0,.58],[.48,.2],[.38,-.35]],metal,.4);group.add(body);
 for(const side of [-1,1]) {const wing=hull([[side*.2,-.35],[side*.92,-.5],[side*.75,.1],[side*.25,.38]],trim,.16);group.add(wing);const pod=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.38,4,8),metal);pod.position.set(side*.58,-.15,.15);group.add(pod);}
 const cockpit=new THREE.Mesh(new THREE.SphereGeometry(.23,16,12),glass);cockpit.scale.set(.75,1.4,.6);cockpit.position.set(0,.14,.52);group.add(cockpit);
 const engine=new THREE.Mesh(new THREE.ConeGeometry(.15,.52,12),new THREE.MeshBasicMaterial({color:colors[type],transparent:true,opacity:.85}));engine.rotation.z=Math.PI;engine.position.set(0,-.73,.15);group.add(engine);group.userData.engine=engine;
 if(type==='yellow'){const crown=hull([[-.35,.3],[-.3,.8],[0,.6],[.3,.8],[.35,.3]],trim,.22);group.add(crown);group.scale.setScalar(1.05);}
 group.userData.unique=true;
 if(!player)group.rotation.z=Math.PI;
 return group;
}
export function createScene(element) {
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x060b12);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;element.appendChild(renderer.domElement);
 const scene=new THREE.Scene();const camera=new THREE.OrthographicCamera(-12,12,14,-14,.1,100);camera.position.set(0,-5,40);camera.lookAt(0,0,0);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xbde4ff,0x182330,2));const light=new THREE.DirectionalLight(0xe9f4ff,4);light.position.set(-8,8,18);scene.add(light);const rim=new THREE.DirectionalLight(0x36cfff,2);rim.position.set(8,-5,8);scene.add(rim);
 const positions=new Float32Array(240*3);for(let i=0;i<240;i++){positions[i*3]=(Math.random()-.5)*30;positions[i*3+1]=(Math.random()-.5)*34;positions[i*3+2]=-3-Math.random()*10;}
 const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xb2c7d9,size:.055,transparent:true,opacity:.6}));scene.add(stars);
 const player=makeShip();scene.add(player);const enemies=new Map(),bullets=new Map(),effects=new Map();const bulletGeo=new THREE.CapsuleGeometry(.065,.5,3,6);const shotMats={player:new THREE.MeshBasicMaterial({color:0x9df6ff}),enemy:new THREE.MeshBasicMaterial({color:0xffba68})};
 function syncMap(map,items,create,update){const ids=new Set(items.map(i=>i.id));for(const [id,m] of map)if(!ids.has(id)){scene.remove(m);map.delete(id);if(m.userData.unique){m.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}}for(const item of items){let m=map.get(item.id);if(!m){m=create(item);map.set(item.id,m);scene.add(m);}update(m,item);}}
 const originalStars=positions.slice();
 const resize=()=>{
  const width=Math.max(1,element.clientWidth),height=Math.max(1,element.clientHeight);
  const playing=element.classList.contains('scene-playing');
  const scale=Math.min(width/24,height/28,720/24);
  camera.left=playing?-width/(scale*2):-12;camera.right=-camera.left;
  camera.top=playing?height/(scale*2):14;camera.bottom=-camera.top;camera.updateProjectionMatrix();
  for(let i=0;i<positions.length;i+=3){positions[i]=originalStars[i]*(playing?camera.right/12:1);positions[i+1]=originalStars[i+1]*(playing?camera.top/14:1);}
  starGeo.attributes.position.needsUpdate=true;
  renderer.setSize(width,height,false);
  renderer.render(scene,camera);
 };const observer=new ResizeObserver(resize);observer.observe(element);resize();
 return {render(g,input){player.position.set(g.player.x,g.player.y,0);player.rotation.y=THREE.MathUtils.lerp(player.rotation.y,(Number(!!input.left)-Number(!!input.right))*.3,.12);player.visible=g.mode!=='gameover' && (g.invincible<=0 || Math.floor(g.elapsed*12)%2===0);player.userData.engine.scale.y=.85+Math.sin(g.elapsed*35)*.15;
 syncMap(enemies,g.enemies,e=>makeShip(e.type),(m,e)=>{m.position.set(e.x,e.y,.1);m.rotation.y=e.phase==='dive'?Math.sin(e.t*6)*.35:Math.sin(g.elapsed+e.homeX)*.08;m.rotation.z=Math.PI+(e.phase==='dive'?Math.cos(e.t*6)*.3:0);});
 syncMap(bullets,g.bullets,b=>new THREE.Mesh(bulletGeo,shotMats[b.owner]),(m,b)=>{m.position.set(b.x,b.y,.3);m.rotation.z=-Math.atan2(b.vx,b.vy);});
 syncMap(effects,g.effects,e=>{const p=new Float32Array(22*3);for(let i=0;i<22;i++){const a=i*2.399+e.seed;p[i*3]=Math.cos(a);p[i*3+1]=Math.sin(a);p[i*3+2]=(i%3)*.2;}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(p,3));const m=new THREE.Points(geo,new THREE.PointsMaterial({color:colors[e.color],size:.12,transparent:true}));m.userData.unique=true;return m;},(m,e)=>{m.position.set(e.x,e.y,.5);m.scale.setScalar(e.age*5+.1);m.material.opacity=1-e.age/.7;});
 stars.position.y=-(g.elapsed*.15)%3;renderer.render(scene,camera);},dispose(){observer.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});env.dispose();renderer.dispose();renderer.domElement.remove();}};
}
