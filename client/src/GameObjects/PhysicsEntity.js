import Entity from "./Entity.js";
import { Timer } from 'three/addons/misc/Timer.js';
import * as THREE from 'three';

export default class PhysicsEntity extends Entity {
  constructor(config) {
    super(config);

    // State vectors.
    this.position = this.position || new THREE.Vector3();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.appliedForces = new THREE.Vector3(0, 0, 0);
    
    // For interpolation:
    this.previousPosition = this.position.clone();
    this.renderPosition = this.position.clone();

    // Physical properties.
    this.mass = config.mass || 10;
    this.terminalVelocity = config.terminalVelocity || 20; // Maximum falling speed.

    // Grounding flag.
    this.isGrounded = false;
    
    // Timer & fixed time step integration.
    this.timer = new Timer();
    this.timer.setTimescale(1);
    this.accumulatedTime = 0;
    this.fixedDelta = 1 / 120; // 120 frames

    // For Quake‑style movement:
    this.wishDir = new THREE.Vector3(0, 0, 0); // Normalized desired horizontal direction.
    this.targetSpeed = 50;                     // Desired horizontal speed.
  }

  // ─────────────────────────────
  // Helper Functions for Quake‑like Movement
  // ─────────────────────────────

  accelerate(currentVel, wishDir, targetSpeed, accel, deltaTime) {
    const desiredVel = wishDir.clone().multiplyScalar(targetSpeed);
    const velDiff = desiredVel.sub(currentVel);
    const maxAccel = accel * deltaTime;
    if (velDiff.length() > maxAccel) {
      velDiff.setLength(maxAccel);
    }
    return currentVel.add(velDiff);
  }

  applyGroundFriction(currentVel, friction, deltaTime) {
    const speed = currentVel.length();
    if (speed < 0.1) return new THREE.Vector3(0, 0, 0);
    const drop = speed * friction * deltaTime;
    const newSpeed = Math.max(speed - drop, 0);
    return currentVel.clone().normalize().multiplyScalar(newSpeed);
  }

  applyGravity(deltaTime, currentVerticalVel) {
    const gravity = -50; // Adjust as needed.
    return currentVerticalVel + gravity * deltaTime;
  }

  // ─────────────────────────────
  // Quake‑Style Physics Update using improved (trapezoidal) integration.
  // ─────────────────────────────

  updatePhysics(deltaTime) {
    // Save previous velocity to use for position update.
    const prevVelocity = this.velocity.clone();

    // Separate horizontal (X/Z) and vertical (Y) components.
    let horizontalVel = new THREE.Vector3(this.velocity.x, 0, this.velocity.z);
    let verticalVel = this.velocity.y;

    // Apply gravity.
    verticalVel = this.applyGravity(deltaTime, verticalVel);

    // Horizontal movement:
    if (this.isGrounded) {
      if (this.wishDir.lengthSq() > 0) {
        const groundAccel = 50;
        horizontalVel = this.accelerate(horizontalVel, this.wishDir, this.targetSpeed, groundAccel, deltaTime);
      } else {
        horizontalVel = this.applyGroundFriction(horizontalVel, 10, deltaTime);
      }
    } else {
      if (this.wishDir.lengthSq() > 0) {
        const airAccel = 20;
        horizontalVel = this.accelerate(horizontalVel, this.wishDir, this.targetSpeed, airAccel, deltaTime);
      }
      horizontalVel = this.applyGroundFriction(horizontalVel, 2, deltaTime);
    }

    // Update velocity.
    this.velocity.set(horizontalVel.x, verticalVel, horizontalVel.z);
    if (this.velocity.y < -this.terminalVelocity) {
      this.velocity.y = -this.terminalVelocity;
    }
    
    // Instead of a simple Euler update, update the position using the average velocity.
    const avgVelocity = new THREE.Vector3().addVectors(prevVelocity, this.velocity).multiplyScalar(0.5);
    this.position.add(avgVelocity.multiplyScalar(deltaTime));

    // Reset applied forces.
    this.appliedForces.set(0, 0, 0);
  }

  // ─────────────────────────────
  // Collision and Miscellaneous Functions
  // ─────────────────────────────

  resolveCollision(entity) {
    const entityBox = entity.boundingBox;
    const thisBox = this.boundingBox;
    const mtv = this.calculateMTV(thisBox, entityBox);

    // Use a small epsilon to ignore very small overlaps.
    const epsilon = 0.01;
    if (!mtv || mtv.length() < epsilon) return;

    const direction = this.position.clone().sub(entity.position).normalize();
    const pushVector = mtv.dot(direction) < 0 ? mtv.negate() : mtv;
    this.position.add(pushVector);

    const mtvAxis = pushVector.clone().normalize();
    if (Math.abs(mtvAxis.x) > Math.abs(mtvAxis.y) && Math.abs(mtvAxis.x) > Math.abs(mtvAxis.z)) {
      this.velocity.x = 0;
    } else if (Math.abs(mtvAxis.y) > Math.abs(mtvAxis.z)) {
      this.velocity.y = 0;
      if (thisBox.corners[0].y > entityBox.corners[0].y) {
        this.isGrounded = true;
      }
    } else {
      this.velocity.z = 0;
    }
  }

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

  // ─────────────────────────────
  // Fixed-step update method with interpolation.
  // ─────────────────────────────

  update() {
    // Update timer and accumulate delta time.
    this.timer.update();
    this.accumulatedTime += this.timer.getDelta();

    // Process fixed time steps.
    while (this.accumulatedTime >= this.fixedDelta) {
      this.previousPosition.copy(this.position);
      this.updatePhysics(this.fixedDelta);
      if (this.boundingBox && typeof this.boundingBox.update === "function") {
        this.boundingBox.update();
      }
      this.accumulatedTime -= this.fixedDelta;
    }
    
    // Calculate interpolation factor.
    const alpha = this.accumulatedTime / this.fixedDelta;
    
    // Interpolate between the previous physics state and the current state.
    this.renderPosition.copy(this.previousPosition).lerp(this.position, alpha);
  }
}