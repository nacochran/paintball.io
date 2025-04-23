import Gun from "./Gun";
import * as THREE from 'three';

export default class HitscanGun extends Gun {
  constructor(config = {}) {
    super(config);
  }

  fire(origin, direction, currentTime, scene) {
    if (!this.readyToFire(currentTime)) {
      return;
    }

    this.lastFireTime = currentTime;

    const raycaster = new THREE.Raycaster(origin, direction, 0, this.range);
    const intersections = raycaster.intersectObjects(scene.children, true);

    if (intersections.length === 0) {
      // ("Hitscan shot missed.");
      return;
    }

    // First hit only
    const firstHit = intersections[0];
    const hitMesh = firstHit.object;
    const userData = hitMesh.userData;

    // Check if it's an opponent
    if (userData.entityType === 'opponent') {
      const opponent = userData.opponent;
      // (`Hit opponent ID=${opponent.id} at ${firstHit.point.toArray()} (damage: ${this.damage})`);
      opponent.health -= this.damage;
      return {
        damage: this.damage,
        recipient: userData.opponent.id
      };
    } else {
      // ('Shot blocked by wall or non-opponent object:', hitMesh.name || hitMesh.type);
    }
  }

}