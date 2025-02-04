import Entity from "./Entity.js";
import { Timer } from 'three/addons/misc/Timer.js';
import * as THREE from 'three';

export default class PhysicsEntity extends Entity {
  constructor(config) {
    super(config);

    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.appliedForces = new THREE.Vector3(0, 0, 0);
    this.mass = config.mass || 1;
    this.terminalVelocity = config.terminalVelocity || 50; // Max falling rate
    this.onPlatform = null; // Reference to platform or null
    this.onTime = 0; // Time entity has been off the platform
    this.timer = new Timer();
    this.timer.setTimescale(1);
  }

  /**
   * Apply a force to the entity.
   * @param {THREE.Vector3} force - Force vector to apply.
   */
  applyForce(force) {
    this.appliedForces = this.appliedForces.add(force);
  }

  /**
   * Apply drag force to the entity.
   * @param {Entity | null} platform - The platform the entity is on (or null if in air).
   */
  applyDrag(platform) {
    const MIN_VELOCITY = 0.01; // Ignore drag if velocity is negligible
    if (this.velocity.length() < MIN_VELOCITY) return;

    let dragForce;
    if (platform) {
      const friction = platform.friction || .01;
      dragForce = this.velocity.clone().multiplyScalar(-friction); // Reduce velocity
    } else {
      const airFriction = 0.02; // I had to lower this as it was causing issues with movement after some changes
      dragForce = this.velocity.clone().multiplyScalar(-airFriction);
    }

    this.applyForce(dragForce);
  }

  /**
   * Apply gravity to the entity
   */
  applyGravity() {
    const G_CONST = -0.2;
    const gravityForce = new THREE.Vector3(0, G_CONST * this.mass, 0);
    this.applyForce(gravityForce);
  }

  /**
   * Check for and handle X collisions with other entities.
   * @param {Entity[]} entities - List of all entities in the scene.
   */
  collideX(entities) {
    if (!Array.isArray(entities)) {
      throw new TypeError("Expected entities to be an array.");
    }

    for (const entity of entities) {
      if (entity !== this && this.checkBounds(entity)) {

        this.velocity.x = 0;
        if (this.position.x < entity.position.x) {
          this.position.x = entity.position.x - this.size.width / 2 - entity.size.width / 2;
        } else {
          this.position.x = entity.position.x + this.size.width / 2 + entity.size.width / 2;
        }

      }
    }
  }
  collideY(entities) {
    if (!Array.isArray(entities)) {
      throw new TypeError("Expected entities to be an array.");
    }

    for (const entity of entities) {
      if (entity !== this && this.checkBounds(entity)) {
        this.velocity.y = 0;
        if (this.position.y < entity.position.y) {
          this.position.y = entity.position.y - this.size.height / 2 - entity.size.height / 2;
        } else {
          this.position.y = entity.position.y + this.size.height / 2 + entity.size.height / 2;
          this.onPlatform = true;
          this.onTime = 0;
        }
      }
    }
  }
  collideZ(entities) {
    if (!Array.isArray(entities)) {
      throw new TypeError("Expected entities to be an array.");
    }

    for (const entity of entities) {
      if (entity !== this && this.checkBounds(entity)) {
        this.velocity.z = 0;
        if (this.position.z < entity.position.z) {
          this.position.z = entity.position.z - this.size.depth / 2 - entity.size.depth / 2;
        } else {
          this.position.z = entity.position.z + this.size.depth / 2 + entity.size.depth / 2;
        }
      }
    }
  }

  updatePhysics(entities) {
    this.timer.update();
    let deltaTime = this.timer.getDelta();

    // Clamp deltaTime to a minimum value
    deltaTime = Math.max(deltaTime, .6);
    //console.log("Delta Time:", deltaTime);

    // apply some de facto forces
    this.applyGravity();
    this.applyDrag();


    this.acceleration = this.appliedForces.multiplyScalar(1 / this.mass); // to check ... a = F/m
    this.velocity = this.velocity.add(this.acceleration.multiplyScalar(deltaTime));

    // Clamp velocity to terminal velocity
    this.velocity.y = (this.velocity.y < -this.terminalVelocity) ? -this.terminalVelocity : this.velocity.y;


    // update position and check for collisions along each axis
    this.position.x += this.velocity.x * deltaTime;
    this.collideX(entities);
    this.position.y += this.velocity.y * deltaTime;
    this.collideY(entities);
    this.position.z += this.velocity.z * deltaTime;
    this.collideZ(entities);

    if (++this.onTime > 5 / deltaTime) {
      this.onPlatform = false;
    }

    // reset forces
    this.appliedForces.set(0, 0, 0);
  }

  /**
   * Abstract class
   */
  update() { }
}
