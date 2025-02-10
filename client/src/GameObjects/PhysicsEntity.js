import Entity from "./Entity.js";
import { Timer } from 'three/addons/misc/Timer.js';
import * as THREE from 'three';

export default class PhysicsEntity extends Entity {
  constructor(config) {
    super(config);

    // State vectors.
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.appliedForces = new THREE.Vector3(0, 0, 0);
    
    // Physical properties.
    this.mass = config.mass || 10;
    this.terminalVelocity = config.terminalVelocity || 20; // Maximum falling speed.

    // Grounding flag.
    this.isGrounded = false;
    
    // Timer & fixed time step integration.
    this.timer = new Timer();
    this.timer.setTimescale(1);
    this.accumulatedTime = 0;
    this.fixedDelta = 1 / 120;// 360 physics updates per second

    // For Quake‑style movement:
    // These will be set externally (e.g., by the Player subclass) based on input.
    this.wishDir = new THREE.Vector3(0, 0, 0); // Normalized desired horizontal direction.
    this.targetSpeed = 0;                     // Desired horizontal speed.
  }

  // ─────────────────────────────
  // Helper Functions for Quake‑like Movement
  // ─────────────────────────────

  /**
   * Accelerate the current horizontal velocity toward the target speed.
   * @param {THREE.Vector3} currentVel - The current horizontal velocity.
   * @param {THREE.Vector3} wishDir - Normalized desired direction.
   * @param {Number} targetSpeed - Desired horizontal speed.
   * @param {Number} accel - Acceleration constant.
   * @param {Number} deltaTime - Fixed time step.
   * @returns {THREE.Vector3} Updated horizontal velocity.
   */
  accelerate(currentVel, wishDir, targetSpeed, accel, deltaTime) {
    // Calculate the desired velocity vector.
    const desiredVel = wishDir.clone().multiplyScalar(targetSpeed);
    
    // Determine how much we need to change.
    const velDiff = desiredVel.sub(currentVel);
    
    // The maximum change allowed this frame.
    const maxAccel = accel * deltaTime;
    
    // If the difference is greater than maxAccel, clamp it.
    if (velDiff.length() > maxAccel) {
      velDiff.setLength(maxAccel);
    }
    
    // Return the new velocity.
    return currentVel.add(velDiff);
  }

  /**
   * Apply friction to reduce horizontal speed.
   * @param {THREE.Vector3} currentVel - The current horizontal velocity.
   * @param {Number} friction - Friction constant.
   * @param {Number} deltaTime - Fixed time step.
   * @returns {THREE.Vector3} Updated horizontal velocity.
   */
  applyGroundFriction(currentVel, friction, deltaTime) {
    const speed = currentVel.length();
    if (speed < 0.1) return new THREE.Vector3(0, 0, 0);
    const drop = speed * friction * deltaTime;
    const newSpeed = Math.max(speed - drop, 0);
    return currentVel.clone().normalize().multiplyScalar(newSpeed);
  }

  /**
   * Apply gravity to the vertical component.
   * (Gravity is applied here rather than via force integration.)
   * @param {Number} deltaTime - Fixed time step.
   * @returns {Number} The updated vertical velocity.
   */
  applyGravity(deltaTime, currentVerticalVel) {
    const gravity = -50; // Adjust as needed.
    return currentVerticalVel + gravity * deltaTime;
  }

  // ─────────────────────────────
  // Quake‑Style Physics Update
  // ─────────────────────────────

  /**
   * Update physics using a Quake‑like movement system.
   * Separates horizontal and vertical motion, applies gravity,
   * and uses custom acceleration and friction for horizontal movement.
   * @param {Number} deltaTime - Fixed time step.
   */
  updatePhysics(deltaTime) {
    // Separate horizontal (X/Z) and vertical (Y) components.
    let horizontalVel = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
    let verticalVel = this.velocity.y;

    // Apply gravity to vertical velocity.
    verticalVel = this.applyGravity(deltaTime, verticalVel);

    // Horizontal movement:
    if (this.isGrounded) {
      if (this.wishDir.lengthSq() > 0) {
        const groundAccel = 50; // Strong acceleration on ground.
        horizontalVel = this.accelerate(horizontalVel, this.wishDir, this.targetSpeed, groundAccel, deltaTime);
      } else {
        // No input: apply strong friction for quick stops.
        horizontalVel = this.applyGroundFriction(horizontalVel, 10, deltaTime);
      }
    } else {
      // In air: allow limited air control.
      if (this.wishDir.lengthSq() > 0) {
        const airAccel = 20; // Reduced acceleration in air.
        horizontalVel = this.accelerate(horizontalVel, this.wishDir, this.targetSpeed, airAccel, deltaTime);
      }
      // Apply mild friction in the air.
      horizontalVel = this.applyGroundFriction(horizontalVel, 2, deltaTime);
    }

    // Reassemble the overall velocity.
    this.velocity.set(horizontalVel.x, verticalVel, horizontalVel.z);
    if (this.velocity.y < -this.terminalVelocity) {
      this.velocity.y = -this.terminalVelocity;
    }
    
    // Update the entity's position.
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Reset applied forces.
    this.appliedForces.set(0, 0, 0);
  }

  // ─────────────────────────────
  // Collision and Miscellaneous Functions
  // ─────────────────────────────

  /**
   * Resolve collisions using the Separating Axis Theorem.
   * If a collision from below is detected, mark the entity as grounded.
   */
  resolveCollision(entity) {
    const entityBox = entity.boundingBox;
    const thisBox = this.boundingBox;
    const mtv = this.calculateMTV(thisBox, entityBox);

    const epsilon = 0.00001;
    if (mtv.length() < epsilon) return;

    if (mtv) {
      const direction = this.position.clone().sub(entity.position).normalize();
      const pushVector = mtv.dot(direction) < 0 ? mtv.negate() : mtv;
      this.position.add(pushVector);

      const mtvAxis = pushVector.clone().normalize();
      if (Math.abs(mtvAxis.x) > Math.abs(mtvAxis.y) && Math.abs(mtvAxis.x) > Math.abs(mtvAxis.z)) {
        this.velocity.x = 0;
      } else if (Math.abs(mtvAxis.y) > Math.abs(mtvAxis.z)) {
        this.velocity.y = 0;
        // If collision comes from below, mark as grounded.
        if (thisBox.corners[0].y > entityBox.corners[0].y) {
          this.isGrounded = true;
          console.log("The entity is grounded");
        }
      } else {
        this.velocity.z = 0;
      }
    }
  }

  /**
   * Handle collisions with a list of entities.
   */
  handleCollisions(entities) {
    const collisions = this.boundingBox.handleCollisions(entities);
    if (collisions.length > 0) {
      for (const entity of collisions) {
        this.resolveCollision(entity);
      }
    } else {
      this.isGrounded = false;
    }
  }

  /**
   * Compute the Minimum Translation Vector (MTV) using SAT.
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
        return null;
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
   * Fixed-step update method.
   * Call this every frame to accumulate time and perform fixed-step physics updates.
   */
  fixedUpdate() {
    this.timer.update();
    this.accumulatedTime += this.timer.getDelta();
    while (this.accumulatedTime >= this.fixedDelta) {
      this.updatePhysics(this.fixedDelta);
      this.accumulatedTime -= this.fixedDelta;
    }
  }
}