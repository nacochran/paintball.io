import Entity from "./Entity.js";

export default class StaticEntity extends Entity {
  constructor(config) {
    super(config);

    // Dimensions of the static entity
    this.size = config.size || { width: 1, height: 1, depth: 1 }; // Default to a unit cube

    // Mesh (Three.js object)
    this.mesh = null;
  }

  /**
   * Creates and initializes the Three.js mesh for the static entity.
   * @param {THREE.Material} material - The material to apply to the mesh.
   */
  createMesh(material) {
    const geometry = new THREE.BoxGeometry(this.size.width, this.size.height, this.size.depth);
    this.mesh = new THREE.Mesh(geometry, material);

    // Set position from Entity base class
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);

    // Shadow properties
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  /**
   * Adds the entity's mesh to the scene.
   * @param {THREE.Scene} scene - The Three.js scene to add the mesh to.
   */
  addToScene(scene) {
    if (this.mesh) {
      scene.add(this.mesh);
    }
  }

  /**
   * Main update method for the static entity.
   * For static entities, it typically does not involve physics or movement.
   */
  update() {
    // Static entities do not have dynamic updates.
  }
}