import { Vec3 } from "../utils/vector.js";

export default class Entity {
  constructor(config) {
    // Initialize position as a Vec3 instance
    this.position = new Vec3(config.x || 0, config.y || 0, config.z || 0);

    // Shape type for collision (e.g., 'cube', 'sphere')
    this.shape = config.shape || "cube";

    // Size object, default based on shape
    this.size = config.size || this.getDefaultSize(this.shape);

    // Friction coefficient
    this.friction = config.friction || 0.5;

    // Collidability flag
    this.isCollidable = config.isCollidable !== undefined ? config.isCollidable : true;

    // Mesh placeholder for Three.js integration
    this.mesh = null;
  }

  /**
   * Returns default size metrics for a given shape.
   * @param {string} shape - The shape type (e.g., 'cube', 'sphere').
   * @returns {Object} - Default size metrics for the shape.
   */
  getDefaultSize(shape) {
    switch (shape) {
      case "cube":
        return { width: 1, height: 1, depth: 1 };
      case "sphere":
        return { radius: 1 };
      default:
        throw new Error(`Shape "${shape}" is not supported.`);
    }
  }

  /**
   * Checks if this entity's bounds overlap with another entity's bounds.
   * @param {Entity} otherEntity - The other entity to check bounds against.
   * @returns {boolean} - True if the bounds overlap, false otherwise.
   */
  checkBounds(otherEntity) {
    if (!this.isCollidable || !otherEntity.isCollidable) return false;

    if (this.shape === "cube" && otherEntity.shape === "cube") {
      return (
        Math.abs(this.position.x - otherEntity.position.x) <=
          (this.size.width / 2 + otherEntity.size.width / 2) &&
        Math.abs(this.position.y - otherEntity.position.y) <=
          (this.size.height / 2 + otherEntity.size.height / 2) &&
        Math.abs(this.position.z - otherEntity.position.z) <=
          (this.size.depth / 2 + otherEntity.size.depth / 2)
      );
    }

    if (this.shape === "sphere" && otherEntity.shape === "sphere") {
      const distance = this.position.subtract(otherEntity.position).magnitude();
      return distance <= (this.size.radius + otherEntity.size.radius);
    }

    // Additional collision checks for mixed shapes can be implemented here

    return false;
  }

  /**
   * Adds the entity's mesh to a Three.js scene.
   * @param {THREE.Scene} scene - The Three.js scene to add the mesh to.
   */
  addToScene(scene) {
    if (!this.mesh) {
      throw new Error("Mesh not initialized. Please create the mesh before adding it to the scene.");
    }
    scene.add(this.mesh);
  }

  /**
   * Abstract method to update the entity. Must be implemented by subclasses.
   */
  update() {
    throw new Error("Method 'update' must be implemented by subclasses.");
  }
}