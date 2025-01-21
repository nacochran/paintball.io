/**
import Entity from "./Entity.js";

export default class PhysicsEntity extends Entity {
  constructor(config) {
    super(config);

    // Physics properties
    this.velocity = { x: 0, y: 0, z: 0 }; // Current velocity
    this.acceleration = { x: 0, y: 0, z: 0 }; // Current acceleration
    this.friction = 5; // Friction value (reduces velocity over time)
    this.gravity = -9.8; // Gravity (default downward force in the y-axis)
    this.mass = 1; // Mass of the object (affects forces)
    this.onGround = true; // Is the object on the ground?

    // Ground level
    this.groundY = config.groundY !== undefined ? config.groundY : 0; // Default ground level is 0

    // Bounds for limiting movement (optional)
    this.bounds = config.bounds || null; // { minX, maxX, minY, maxY, minZ, maxZ }
  }

  /**
   * Apply a force to the entity
   * @param {number} fx - Force in the x direction
   * @param {number} fy - Force in the y direction
   * @param {number} fz - Force in the z direction
   */
  /*
  applyForce(fx, fy, fz) {
    this.acceleration.x += fx / this.mass;
    this.acceleration.y += fy / this.mass;
    this.acceleration.z += fz / this.mass;
  }

  /**
   * Update physics properties such as velocity and position.
   * @param {number} deltaTime - Time since the last frame
   */
  /*
  updatePhysics(deltaTime) {
    // Apply acceleration to velocity
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.velocity.z += this.acceleration.z * deltaTime;

    // Apply friction (damping) to velocity
    this.velocity.x -= this.velocity.x * this.friction * deltaTime;
    this.velocity.z -= this.velocity.z * this.friction * deltaTime;

    // Apply gravity if not on the ground
    if (!this.onGround) {
      this.velocity.y += this.gravity * deltaTime;
    }

    // Update position based on velocity
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;
    this.z += this.velocity.z * deltaTime;

    // Reset acceleration for the next frame
    this.acceleration.x = 0;
    this.acceleration.y = 0;
    this.acceleration.z = 0;

    // Handle ground collision
    this.checkGroundCollision();

    // Collision or bounds checking (if enabled)
    if (this.bounds) {
      this.checkBounds();
    }
  }

  /**
   * Check for collision with the ground.
   * If the entity is below the ground level, reset its position and velocity.
   */
  /*
  checkGroundCollision() {
    if (this.y <= this.groundY) {
      this.y = this.groundY; // Reset position to ground level
      this.velocity.y = 0; // Stop downward velocity
      this.onGround = true; // Ensure the entity is on the ground
    } else {
      this.onGround = false; // Entity is in the air
    }
  }

  /**
   * Check if the entity is within its bounds and adjust if necessary.
   */
  /*
  checkBounds() {
    if (this.bounds) {
      const { minX, maxX, minY, maxY, minZ, maxZ } = this.bounds;

      if (this.x < minX) {
        this.x = minX;
        this.velocity.x = 0;
      }
      if (this.x > maxX) {
        this.x = maxX;
        this.velocity.x = 0;
      }
      if (this.y < minY) {
        this.y = minY;
        this.velocity.y = 0;
        this.onGround = true;
      }
      if (this.y > maxY) {
        this.y = maxY;
        this.velocity.y = 0;
      }
      if (this.z < minZ) {
        this.z = minZ;
        this.velocity.z = 0;
      }
      if (this.z > maxZ) {
        this.z = maxZ;
        this.velocity.z = 0;
      }
    }
  }

  /**
   * Main update loop for physics entity.
   * @param {number} deltaTime - Time since the last frame
   */
  /*
  update(deltaTime) {
    this.updatePhysics(deltaTime);
  }
}*/
import Entity from "./Entity.js";

export default class PhysicsEntity extends Entity {
  constructor(config) {
    super(config);

    // Physics properties
    this.velocity = { x: 0, y: 0, z: 0 }; // Current velocity
    this.acceleration = { x: 0, y: 0, z: 0 }; // Current acceleration
    this.friction = 5; // Friction value (reduces velocity over time)
    this.gravity = -9.8; // Gravity (default downward force in the y-axis)
    this.mass = 1; // Mass of the object (affects forces)
    this.onGround = true; // Is the object on the ground?

    // Dimensions of the entity (for edge-based collision)
    this.size = config.size || { width: 1, height: 1, depth: 1 }; // Default to a unit cube

    // Ground level
    this.groundY = config.groundY !== undefined ? config.groundY : 0; // Default ground level is 0

    // Bounds for limiting movement (optional)
    this.bounds = config.bounds || null; // { minX, maxX, minY, maxY, minZ, maxZ }
  }

  /**
   * Apply a force to the entity
   * @param {number} fx - Force in the x direction
   * @param {number} fy - Force in the y direction
   * @param {number} fz - Force in the z direction
   */
  applyForce(fx, fy, fz) {
    this.acceleration.x += fx / this.mass;
    this.acceleration.y += fy / this.mass;
    this.acceleration.z += fz / this.mass;
  }

  /**
   * Update physics properties such as velocity and position.
   * @param {number} deltaTime - Time since the last frame
   */
  updatePhysics(deltaTime) {
    // Apply acceleration to velocity
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.velocity.z += this.acceleration.z * deltaTime;

    // Apply friction (damping) to velocity
    this.velocity.x -= this.velocity.x * this.friction * deltaTime;
    this.velocity.z -= this.velocity.z * this.friction * deltaTime;

    // Apply gravity if not on the ground
    if (!this.onGround) {
      this.velocity.y += this.gravity * deltaTime;
    }

    // Update position based on velocity
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;
    this.z += this.velocity.z * deltaTime;

    // Reset acceleration for the next frame
    this.acceleration.x = 0;
    this.acceleration.y = 0;
    this.acceleration.z = 0;

    // Handle ground collision
    this.checkGroundCollision();

    // Collision or bounds checking (if enabled)
    if (this.bounds) {
      this.checkBounds();
    }
  }

  /**
   * Check for collision with the ground.
   * If the entity is below the ground level, reset its position and velocity.
   */
  checkGroundCollision() {
    const bottomEdge = this.y - this.size.height / 2; // Calculate the bottom edge of the cube
    if (bottomEdge <= this.groundY) {
      this.y = this.groundY + this.size.height / 2; // Reset the position to align the bottom edge with the ground
      this.velocity.y = 0; // Stop downward velocity
      this.onGround = true; // Ensure the entity is on the ground
    } else {
      this.onGround = false; // Entity is in the air
    }
  }

  /**
   * Check if the entity is within its bounds and adjust if necessary.
   */
  checkBounds() {
    if (this.bounds) {
      const { minX, maxX, minY, maxY, minZ, maxZ } = this.bounds;

      const leftEdge = this.x - this.size.width / 2;
      const rightEdge = this.x + this.size.width / 2;
      const frontEdge = this.z - this.size.depth / 2;
      const backEdge = this.z + this.size.depth / 2;

      // Check X bounds
      if (leftEdge < minX) {
        this.x = minX + this.size.width / 2;
        this.velocity.x = 0;
      }
      if (rightEdge > maxX) {
        this.x = maxX - this.size.width / 2;
        this.velocity.x = 0;
      }

      // Check Y bounds
      if (this.y < minY) {
        this.y = minY + this.size.height / 2;
        this.velocity.y = 0;
        this.onGround = true;
      }
      if (this.y > maxY) {
        this.y = maxY - this.size.height / 2;
        this.velocity.y = 0;
      }

      // Check Z bounds
      if (frontEdge < minZ) {
        this.z = minZ + this.size.depth / 2;
        this.velocity.z = 0;
      }
      if (backEdge > maxZ) {
        this.z = maxZ - this.size.depth / 2;
        this.velocity.z = 0;
      }
    }
  }

  /**
   * Main update loop for physics entity.
   * @param {number} deltaTime - Time since the last frame
   */
  update(deltaTime) {
    this.updatePhysics(deltaTime);
  }
}
