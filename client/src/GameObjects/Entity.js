import * as THREE from 'three';

export default class Entity {
  constructor(config) {
    this.shapeType = config.shapeType || 'cube';
    this.size = config.size || this.getDefaultSize(this.shapeType);
    this.position = new THREE.Vector3(config.x, config.y, config.z);
    this.orientation = new THREE.Vector3(0, 0, 0);

    // coefficient of friction
    this.friction = config.friction || 0.5;

    // Collidability flag
    this.isCollidable = config.isCollidable !== undefined ? config.isCollidable : true;

    // every entity leaf class must define a shape (Three.js Mesh)
    this.shape = null;
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

    if (this.shapeType === "cube" && otherEntity.shapeType === "cube") {
      return (
        Math.abs(this.position.x - otherEntity.position.x) <
        (this.size.width / 2 + otherEntity.size.width / 2) &&
        Math.abs(this.position.y - otherEntity.position.y) <
        (this.size.height / 2 + otherEntity.size.height / 2) &&
        Math.abs(this.position.z - otherEntity.position.z) <
        (this.size.depth / 2 + otherEntity.size.depth / 2)
      );
    }

    if (this.shapeType === "sphere" && otherEntity.shapeType === "sphere") {
      const distance = this.position.subtract(otherEntity.position).magnitude();
      return distance <= (this.size.radius + otherEntity.size.radius);
    }

    // Additional collision checks for mixed shapes can be implemented here

    return false;
  }

  /**
   * Abstract method to update the entity. Must be implemented by subclasses.
   */
  update() {
    throw new Error("Method 'update' must be implemented by subclasses.");
  }
}