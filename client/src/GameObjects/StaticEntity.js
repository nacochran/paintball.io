import Entity from "./Entity.js";

export default class StaticEntity extends Entity {
  constructor(config) {
    super(config);

    // Position and size
    this.x = config.x || 0; // Default position
    this.y = config.y || 0;
    this.z = config.z || 0;

    this.size = config.size || { width: 1, height: 1, depth: 1 }; // Default size (unit cube)

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

    // Set position
    this.mesh.position.set(this.x, this.y, this.z);

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
}