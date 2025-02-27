import * as THREE from 'three';

export default class Gun {
  /**
   * @param {Object} config - Configuration options for the gun.
   *  Example options:
   *    {
   *      type: 'hitscan' | 'projectile', // default: 'hitscan'
   *      fireRate: 0.5,       // seconds between shots
   *      damage: 10,          // damage per shot
   *      range: 100,          // maximum range for hitscan shots
   *      projectileSpeed: 50, // speed for projectile guns
   *      fireBehavior: function(origin, direction, gun, scene) { ... } // optional custom fire behavior
   *    }
   */
  constructor(config = {}) {
    this.config = config;
    this.type = config.type || 'hitscan';
    this.fireRate = config.fireRate || 0.5;
    this.damage = config.damage || 10;
    this.range = config.range || 100;
    this.projectileSpeed = config.projectileSpeed || 50;
    this.lastFireTime = 0;
  }

  /**
   * Call this method when the player wants to shoot.
   * @param {THREE.Vector3} origin - The starting point of the shot.
   * @param {THREE.Vector3} direction - The normalized direction of the shot.
   * @param {number} currentTime - The current time in seconds (to enforce fire rate).
   * @param {THREE.Scene} scene - The scene (used for raycasting or spawning projectiles).
   */
  fire(origin, direction, currentTime, scene) {
    // Enforce fire rate
    if (currentTime - this.lastFireTime < this.fireRate) {
      return; // Not enough time has passed to fire again.
    }
    this.lastFireTime = currentTime;

    // If a custom fire behavior is provided, use that.
    if (this.config.fireBehavior && typeof this.config.fireBehavior === 'function') {
      this.config.fireBehavior(origin, direction, this, scene);
      return;
    }

    // Otherwise, use the default behavior based on type.
    if (this.type === 'hitscan') {
      this.fireHitscan(origin, direction, scene);
    } else if (this.type === 'projectile') {
      this.fireProjectile(origin, direction, scene);
    } else {
      console.warn("Unknown gun type:", this.type);
    }
  }

  /**
   * Default hitscan behavior: Cast a ray from origin in direction.
   */
  fireHitscan(origin, direction, scene) {
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

  /**
   * Default projectile behavior: Spawn a projectile that moves in the given direction.
   */
  fireProjectile(origin, direction, scene) {
    // Create a simple projectile mesh (a small red sphere).
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const projectileMesh = new THREE.Mesh(geometry, material);
    projectileMesh.position.copy(origin);
    // Store velocity in userData so it can be updated each frame.
    projectileMesh.userData.velocity = direction.clone().multiplyScalar(this.projectileSpeed);
    scene.add(projectileMesh);
    console.log("Projectile fired:", projectileMesh);

    // Note: We will need to update the projectile's position in our main game loop.
    // For example, by iterating over all projectiles and applying:
    //   projectile.position.add(projectile.userData.velocity.clone().multiplyScalar(deltaTime));
  }
}