import Entity from "./Entity.js";
import { Vec3 } from "../utils/vector.js";

export default class PhysicsEntity extends Entity {
  constructor(config) {
    super(config);

    this.velocity = new Vec3(0, 0, 0);
    this.acceleration = new Vec3(0, 0, 0);
    this.appliedForces = new Vec3(0, 0, 0);
    this.mass = config.mass || 1;
    this.terminalVelocity = config.terminalVelocity || 50; // Max falling rate
    this.onPlatform = null; // Reference to platform or null
    this.onTime = 0; // Time entity has been off the platform
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
   * Apply gravity to the entity
   */
  applyGravity() {
    const G_CONST = -0.2;
    const gravityForce = new Vec3(0, G_CONST * this.mass, 0);
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
    // apply some de facto forces
    this.applyGravity();
    this.applyDrag();

    this.acceleration = this.appliedForces.scale(1 / this.mass); // to check
    this.velocity = this.velocity.add(this.acceleration);

    // Clamp velocity to terminal velocity
    this.velocity.y = (this.velocity.y < -this.terminalVelocity) ? -this.terminalVelocity : this.velocity.y;


    // update position and check for collisions along each axis
    this.position.x += this.velocity.x;
    this.collideX(entities);
    this.position.y += this.velocity.y;
    this.collideY(entities);
    this.position.z += this.velocity.z;
    this.collideZ(entities);

    if (++this.onTime > 5) {
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
