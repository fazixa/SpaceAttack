// Background objects retain their assigned speed throughout their lifetime.
export function advanceMeteorTravel(rocks, dt) {
 if(dt<=0)return;
 for(const rock of rocks)rock.userData.travel+=dt*rock.userData.speed;
}
