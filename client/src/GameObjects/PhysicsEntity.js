import Entity from "./Entity.js";
import { Vec3 } from "../utils/vector.js";

export default class PhysicsEntity extends Entity {
  constructor(config) {
    super(config);

    // Physics properties
    this.velocity = new Vec3(0, 0, 0); // Current velocity
    this.acceleration = new Vec3(0, 0, 0); // Current acceleration
    this.appliedForces = new Vec3(0, 0, 0); // Net force applied to the entity
    this.mass = config.mass || 1; // Mass of the object
    this.terminalVelocity = config.terminalVelocity || 50; // Max falling rate
    this.onPlatform = null; // Reference to platform or null
    this.onTime = 0; // Time entity has been on the platform

    // Bounds for limiting movement (optional)
    this.bounds = config.bounds || null; // { minX, maxX, minY, maxY, minZ, maxZ }
  }

  /**
   * Apply a force to the entity.
   * @param {Vec3} force - Force vector to apply.
   */
  applyForce(force) {
    this.appliedForces = this.appliedForces.add(force);
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
      dragForce = this.velocity.scale(-friction);
    } else {
      // Use air friction if in air
      const airFriction = 0.02;
      dragForce = this.velocity.scale(-airFriction);
    }
    this.applyForce(dragForce);
  }

  /**
   * Apply gravity to the entity.
   */
  applyGravity() {
    const G_CONST = -9.8; // Gravitational constant
    const gravityForce = new Vec3(0, G_CONST * this.mass, 0);
    this.applyForce(gravityForce);
  }

  /**
   * Updates physics properties such as velocity and position based on applied forces.
   * @param {number} deltaTime - Time since the last frame.
   */
  updatePhysics(deltaTime) {
    // Update acceleration based on applied forces
    this.acceleration = this.appliedForces.scale(1 / this.mass);

    // Update velocity based on acceleration
    this.velocity = this.velocity.add(this.acceleration.scale(deltaTime));

    // Clamp velocity to terminal velocity
    if (this.velocity.y < -this.terminalVelocity) {
      this.velocity.y = -this.terminalVelocity;
    }

    // Update position based on velocity
    this.position = this.position.add(this.velocity.scale(deltaTime));

    // Reset applied forces for the next frame
    this.appliedForces.set(0, 0, 0);
  }

  /**
   * Check for and handle collisions with other entities.
   * @param {Entity[]} entities - List of all entities in the scene.
   */
  collide(entities) {
    if (!Array.isArray(entities)) {
      throw new TypeError("Expected entities to be an array.");
    }

    for (const entity of entities) {
      if (entity !== this && this.checkBounds(entity)) {
        // Handle collision response (simple example: stop motion)
        this.velocity.set(0, 0, 0);

        // Adjust position to prevent overlap (basic example)
        const overlap = this.position.subtract(entity.position);
        this.position = this.position.add(overlap.scale(0.5));
      }
    }
  }

  /**
   * Main update loop for physics entity.
   * @param {number} deltaTime - Time since the last frame.
   * @param {Entity[]} entities - List of all entities in the scene.
   */
  update(deltaTime, entities) {
    if (!Array.isArray(entities)) {
      throw new TypeError("Expected entities to be an array.");
    }

    if (!this.onPlatform) {
      this.applyGravity();
    }

    this.applyDrag(this.onPlatform);

    this.updatePhysics(deltaTime);

    this.collide(entities);
  }
}