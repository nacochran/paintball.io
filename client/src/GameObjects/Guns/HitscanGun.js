import Gun from "./Gun";
import * as THREE from 'three';

export default class HitscanGun extends Gun {
  constructor(config = {}) {
    super(config);
  }

  fire(origin, direction, currentTime, scene) {
    if (this.readyToFire(currentTime)) {
      this.lastFireTime = currentTime
      console.log('Shooting: ', this.config);
      const raycaster = new THREE.Raycaster(origin, direction, 0, this.range);
      // Assumes collidable objects are in the scene.
      const intersections = raycaster.intersectObjects(scene.children, true);
      if (intersections.length > 0) {
        const hit = intersections[0];
        console.log(`Hitscan hit at ${hit.point.toArray()} (damage: ${this.damage})`);
        // Here is where we should call player.damage or someting to deal damage to a player
      } else {
        console.log("Hitscan shot missed.");
      }
    }
    else {
      console.log('Waiting to fire');
    }
  }
}