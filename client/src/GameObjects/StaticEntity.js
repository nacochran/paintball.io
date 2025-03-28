import * as THREE from 'three';
import Entity from "./Entity.js";

export default class StaticEntity extends Entity {
  constructor(config) {
    super(config);
  }

  update() {
    if (this.shape.mesh) {
      // Update the mesh's position based on the entity's position.
      this.shape.mesh.position.copy(this.position);

      // Update the mesh's rotation based on the entity's rotation.
      this.shape.mesh.rotation.set(
        this.rotation.x,
        this.rotation.y,
        this.rotation.z
      );

      // Optionally, in case we want to change the scale later we can update the mesh's scale:
      // this.shape.mesh.scale.set(this.size.width, this.size.height, this.size.depth);
    }
  }
}