import * as THREE from 'three';

export default class Entity {
  constructor(config) {
    this.shapeType = config.shapeType || 'cube';
    this.size = config.size || this.getDefaultSize(this.shapeType);
    this.position = new THREE.Vector3(config.x, config.y, config.z);
    this.rotation = new THREE.Vector3(0, 0, 0);

    // coefficient of friction
    this.friction = config.friction || 0.5;

    // Collidability flag
    this.isCollidable = config.isCollidable !== undefined ? config.isCollidable : true;

    // every entity leaf class must define a shape (Three.js Mesh) 
    // AND a bounding box
    this.shape = null;
    this.boundingBox = null;
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
   * Abstract method to update the entity. Must be implemented by subclasses.
   */
  update() {
    throw new Error("Method 'update' must be implemented by subclasses.");
  }
}