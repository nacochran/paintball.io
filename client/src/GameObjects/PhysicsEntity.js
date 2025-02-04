import Entity from "./Entity.js";
import { Timer } from 'three/addons/misc/Timer.js';
import * as THREE from 'three';

export default class PhysicsEntity extends Entity {
  constructor(config) {
    super(config);

    // State vectors
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.appliedForces = new THREE.Vector3(0, 0, 0);
    
    // Physical properties
    this.mass = config.mass || 10;
    this.terminalVelocity = config.terminalVelocity || 1000; // Maximum falling speed

    // Grounding flag
    this.isGrounded = false;
    
    // Timer & fixed time step integration
    this.timer = new Timer();
    this.timer.setTimescale(1);
    this.accumulatedTime = 0;
    this.fixedDelta = 1 / 120; // 60 physics updates per second
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
   * @param {Entity|null} platform - The platform (if any) the entity is on.
   */
  applyDrag(platform) {
    const MIN_VELOCITY = 0.01;
    if (this.velocity.length() < MIN_VELOCITY) return;
  
    let dragForce;
    if (platform) {
      const friction = platform.friction || 0.1;
      dragForce = this.velocity.clone().multiplyScalar(-friction);
    } else {
      const airFriction = 20 // Reduced air friction for smoother jumps
      dragForce = this.velocity.clone().normalize().multiplyScalar(-airFriction);
    }
    this.applyForce(dragForce);
  }

  /**
   * Apply gravity to the entity.
   */
  applyGravity() {
    const G_CONST = -500; // units/s² (adjust for future world scale)
    const gravityForce = new THREE.Vector3(0, G_CONST * this.mass, 0);
    this.applyForce(gravityForce);
  }

  /**
   * Update physics over one fixed time step.
   * @param {Number} deltaTime - Fixed time step (in seconds).
   */
  updatePhysics(deltaTime) {
    // Always apply gravity.
    this.applyGravity();
    this.applyDrag();
  
    // If already grounded, apply an upward normal force to cancel gravity.
    if (this.isGrounded) {
      // Gravity force is: mass * G_CONST (e.g., mass * (-500))
      // To cancel, add: mass * 500 upward.
      const normalForce = new THREE.Vector3(0, this.mass * 500, 0);
      this.applyForce(normalForce);
    }
  
    this.acceleration.copy(this.appliedForces).multiplyScalar(1 / this.mass);
    this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
    if (this.velocity.y < -this.terminalVelocity) {
      this.velocity.y = -this.terminalVelocity;
    }
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    this.appliedForces.set(0, 0, 0);
  }

  /**
   * Resolve collisions using the Separating Axis Theorem.
   * When a collision from below is detected, mark the entity as grounded.
   */
  resolveCollision(entity) {
    const entityBox = entity.boundingBox;
    const thisBox = this.boundingBox;
    const mtv = this.calculateMTV(thisBox, entityBox);

    const epsilon = 0.1; // A sort of leeway such that it does not constantly try to resolve collision and push the player up
    if (mtv.length() < epsilon) {
      return;
    }

    if (mtv) {
      // Use the vector from the other entity to this one.
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
          console.log("The player is grounded");
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
   * Fixed-step update method. Call this every frame to accumulate time and
   * perform one or more fixed-step physics updates.
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