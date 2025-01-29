import Entity from "./Entity.js";
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
  }

  /**
   * Apply a force to the entity.
   * @param {THREE.Vector3} force - Force vector to apply.
   */
  applyForce(force) {
    this.appliedForces.add(force);
  }

  /**
   * Apply drag force to the entity.
   * @param {Entity | null} platform - The platform the entity is on (or null if in air).
   */
  applyDrag(platform) {
    let dragForce;
    if (platform) {
      // Use platform friction if on a platform
      const friction = platform.friction || 0.1;
      dragForce = this.velocity.clone().multiplyScalar(-friction);
    } else {
      // Use air friction if in air
      const airFriction = 0.02;
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

  updatePhysics() {
    // apply some de facto forces
    this.applyGravity();
    this.applyDrag();

    this.acceleration = this.appliedForces.clone().multiplyScalar(1 / this.mass); // to check
    this.velocity.add(this.acceleration);

    // Clamp velocity to terminal velocity
    this.velocity.y = (this.velocity.y < -this.terminalVelocity) ? -this.terminalVelocity : this.velocity.y;

    this.position.add(this.velocity);

    if (++this.onTime > 5) {
      this.onPlatform = false;
    }

    // reset forces
    this.appliedForces.set(0, 0, 0);
  }

  /**
   * Resolves collisions with entities in the world.
   */
  handleCollisions(entities) {
    const collisions = this.boundingBox.handleCollisions(entities);

    if (collisions.length > 0) {
      for (const entity of collisions) {
        this.resolveCollision(entity);
      }
    } else {
      this.onPlatform = false; // If no collisions, player is in the air
    }
  }

  /**
   * Resolves collision with another entity, adjusting position and velocity.
   */
  resolveCollision(entity) {
    const entityBox = entity.boundingBox;
    const thisBox = this.boundingBox;

    // Calculate the Minimum Translation Vector (MTV) to separate the two OBBs
    const mtv = this.calculateMTV(thisBox, entityBox);

    if (mtv) {
      // Ensure MTV pushes away from the other entity
      const direction = this.position.clone().sub(entity.position).normalize();
      const pushVector = mtv.dot(direction) < 0 ? mtv.negate() : mtv;

      // Apply MTV to separate the object from the collision
      this.position.add(pushVector);

      // Zero velocity along the axis of greatest penetration
      const mtvAxis = pushVector.clone().normalize();
      if (Math.abs(mtvAxis.x) > Math.abs(mtvAxis.y) && Math.abs(mtvAxis.x) > Math.abs(mtvAxis.z)) {
        this.velocity.x = 0;
      } else if (Math.abs(mtvAxis.y) > Math.abs(mtvAxis.z)) {
        this.velocity.y = 0;

        // If MTV pushes up, the player is on a platform
        if (thisBox.corners[0].y > entityBox.corners[0].y) {
          this.onPlatform = true;
          this.onTime = 0;
        }
      } else {
        this.velocity.z = 0;
      }
    }
  }


  /**
   * Uses SAT to compute the Minimum Translation Vector (MTV) to separate OBBs.
   */
  calculateMTV(boxA, boxB) {
    const axes = boxA.getSeparatingAxes(boxA.corners, boxB.corners);
    let minOverlap = Infinity;
    let mtv = null;

    for (const axis of axes) {
      let minA = Infinity, maxA = -Infinity;
      let minB = Infinity, maxB = -Infinity;

      for (const corner of boxA.corners) {
        const projection = corner.dot(axis);
        minA = Math.min(minA, projection);
        maxA = Math.max(maxA, projection);
      }

      for (const corner of boxB.corners) {
        const projection = corner.dot(axis);
        minB = Math.min(minB, projection);
        maxB = Math.max(maxB, projection);
      }

      if (maxA < minB || maxB < minA) {
        return null; // No collision, early exit
      }

      const overlap = Math.min(maxA, maxB) - Math.max(minA, minB);
      if (overlap < minOverlap) {
        minOverlap = overlap;
        mtv = axis.clone().multiplyScalar(overlap);
      }
    }

    return mtv;
  }


  /**
   * Abstract class
   */
  update() { }
}
