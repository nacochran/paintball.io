import * as THREE from 'three';

export default class Gun {
  /**
   * @param {Object} config - Configuration options for the gun.
   *  Example options:
   *    {
   *      name: 'pistol' | 'RPG' | ... // name of the gun
   *      fireRate: 0.5,       // seconds between shots
   *      magazineSize: 5      // number of shots in the magizine
   *      damage: 10,          // damage per shot
   *      range: 100,          // maximum range for hitscan shots
   *      projectileSpeed: 50, // speed for projectile guns
   *    }
   */
  constructor(config = {}) {
    this.config = config;
    this.name = config.name
    this.fireRate = config.fireRate || 0.5;
    this.magazineSize = config.magazineSize || 5;
    this.damage = config.damage || 10;
    this.range = config.range || 100;
    this.projectileSpeed = config.projectileSpeed || 50;
    this.lastFireTime = 0;
  }

  readyToFire(currentTime) {
    return (currentTime - this.lastFireTime >= this.fireRate)
  }

  /**
   * Call this method when the player wants to shoot.
   * @param {THREE.Vector3} origin - The starting point of the shot.
   * @param {THREE.Vector3} direction - The normalized direction of the shot.
   * @param {number} currentTime - The current time in seconds (to enforce fire rate).
   * @param {THREE.Scene} scene - The scene (used for raycasting or spawning projectiles).
   */
  fire(origin, direction, currentTime, scene) {
    throw new Error("Method 'fire' must be implemented by subclasses.")
  }
}