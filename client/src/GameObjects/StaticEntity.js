import * as THREE from 'three';
import Entity from "./Entity.js";

export default class StaticEntity extends Entity {
  constructor(config) {
    super(config);

    // Use the entity's position from the base class.
    // (The base class already creates a THREE.Vector3 from config.x, config.y, config.z.)
    // For clarity, you can also reassign it or use it directly.
    this.position = new THREE.Vector3(config.x, config.y, config.z);

    // Set the size using the provided config or default to a unit cube.
    this.size = config.size || { width: 1, height: 1, depth: 1 };

    // Mesh (Three.js object) will be created later via createMesh.
    this.mesh = null;
  }

  /**
   * Creates and initializes the Three.js mesh for the static entity.
   * @param {THREE.Material} material - The material to apply to the mesh.
   */
  createMesh(material) {
    const geometry = new THREE.BoxGeometry(
      this.size.width, 
      this.size.height, 
      this.size.depth
    );
    this.mesh = new THREE.Mesh(geometry, material);

    // Set the mesh's position to match the entity's position.
    this.mesh.position.copy(this.position);

    // Configure shadow properties.
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }

  /**
   * Adds the entity's mesh to the given scene.
   * @param {THREE.Scene} scene - The Three.js scene to add the mesh to.
   */
  addToScene(scene) {
    if (this.mesh) {
      scene.add(this.mesh);
    }
  }

  /**
   * Updates the entity. For static entities, this synchronizes the mesh's position
   * and rotation with the entity's properties. Even if the entity is "static", external
   * changes to its properties (position, rotation) will be reflected on its mesh.
   */
  update() {
    if (this.mesh) {
      // Update the mesh's position based on the entity's position.
      this.mesh.position.copy(this.position);

      // Update the mesh's rotation based on the entity's rotation.
      this.mesh.rotation.set(
        this.rotation.x,
        this.rotation.y,
        this.rotation.z
      );

      // Optionally, in case we want to change the scale later we can update the mesh's scale:
      // this.mesh.scale.set(this.size.width, this.size.height, this.size.depth);
    }
  }
}