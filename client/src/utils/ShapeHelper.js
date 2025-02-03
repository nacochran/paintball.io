// Import Three.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class Shape {
  constructor(config) {
    this.type = config.type;
    this.size = config.size;
    this.position = config.position || new THREE.Vector3(0, 0, 0);

    // Generate the corresponding mesh using ShapeBuilder's static methods
    this.mesh = ShapeBuilder.shapes[this.type](config);
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);

    this.entity = null;
  }

  translate(x, y, z) {
    this.mesh.position.x += x;
    this.mesh.position.y += y;
    this.mesh.position.z += z;
  }

  scale(x, y, z) {
    this.mesh.scale.x *= x;
    this.mesh.scale.y *= y;
    this.mesh.scale.z *= z;
  }

  rotate(x, y, z) {
    this.mesh.rotation.x += x;
    this.mesh.rotation.y += y;
    this.mesh.rotation.z += z;
  }

  /**
   * Precondition: Assumes entity has a position (Vec3), size (Vec3), and orientation (Vec3)
  **/
  attach(entity) {
    this.entity = entity;
  }

  /**
   * @method Update
   * Precondition: Assumes shape has been attached to entity
   * Applies transformations to shapes mesh in order to match the attached 
   * entities position, size, and orientation 
  **/
  update() {
    if (!this.entity) {
      console.error("Shape is not attached to an entity.");
      return;
    }

    // Center the mesh at origin
    this.mesh.position.set(0, 0, 0);

    // Apply the entity's rotation to the mesh
    if (this.entity.rotation) {
      this.mesh.rotation.set(
        this.entity.rotation.x,
        this.entity.rotation.y,
        this.entity.rotation.z
      );
    }

    // Apply scale based on the entity's size
    if (this.entity.size) {
      const normalizedSize = this.size;
      this.mesh.scale.set(
        this.entity.size.width / normalizedSize.width,
        this.entity.size.height / normalizedSize.height,
        this.entity.size.depth / normalizedSize.depth
      );
    }

    // Translate the mesh to the entity's position
    this.mesh.position.set(
      this.entity.position.x,
      this.entity.position.y,
      this.entity.position.z
    );
  }
}

class ShapeBuilder {
  static shapes = {};

  static registerShape(type, shapeMethod) {
    ShapeBuilder.shapes[type] = shapeMethod;
  }
}

// Register default shapes (cube and sphere)
ShapeBuilder.registerShape('cube', (config) => {
  const size = config.size;

  // Create geometry
  const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);

  // Use a material that supports lighting and shading
  const material = new THREE.MeshStandardMaterial({
    color: config.color || 0xffffff, // Default to white if no color is provided
    roughness: 0.5, // Adjust roughness (for realism)
    metalness: 0.5, // Adjust metalness (for shininess)
  });

  // Create the mesh
  return new THREE.Mesh(geometry, material);
});

ShapeBuilder.registerShape('sphere', (size) => {
  const geometry = new THREE.SphereGeometry(size.radius);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  return new THREE.Mesh(geometry, material);
});

// Register a new shape type for glTF files
ShapeBuilder.registerShape('gltf', (config) => {
  const loader = new GLTFLoader();
  const group = new THREE.Group(); // Placeholder for the model

  loader.load(
    config.url,
    (gltf) => {
      // Add the loaded model to the group
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      group.add(gltf.scene);

      // Apply scaling and position after loading
      group.position.set(
        config.position?.x || 0,
        config.position?.y || 0,
        config.position?.z || 0
      );
      group.scale.set(
        config.size?.width || 1,
        config.size?.height || 1,
        config.size?.depth || 1
      );

      console.log("GLTF Model Loaded:", gltf.scene);
    },
    undefined, // Optional progress callback
    (error) => {
      console.error("Failed to load glTF model:", error);
    }
  );

  return group; // Return the group (placeholder initially)
});

export { ShapeBuilder, Shape };