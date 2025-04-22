import Gun from "./Gun";
import * as THREE from 'three';

export default class ProjectileGun extends Gun {
  constructor(config = {}) {
    super(config);
  }

  fire(origin, direction, currentTime, scene) {
    if (this.readyToFire(currentTime)) {
      this.lastFireTime = currentTime
      console.log('Shooting: ', this.config);
      const geometry = new THREE.SphereGeometry(0.1, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const projectileMesh = new THREE.Mesh(geometry, material);
      projectileMesh.position.copy(origin);
      // Store velocity in userData so it can be updated each frame.
      projectileMesh.userData.velocity = direction.clone().multiplyScalar(this.projectileSpeed);
      scene.add(projectileMesh);
      console.log("Projectile fired:", projectileMesh);

    }
    else {
      console.log('Waiting to fire');
    }
  }
}