// A short impact with a smooth decay; offsets are world units, not frame counts.
export function impactOffset(age){
 if(age<0||age>=.32)return {x:0,y:0};
 const strength=.22*(1-age/.32)**2;
 return {x:Math.cos(age*83)*strength,y:Math.sin(age*109)*strength*.7};
}
