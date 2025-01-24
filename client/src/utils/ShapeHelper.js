// Import Three.js
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import StaticEntity from "../GameObjects/StaticEntity.js";
import PhysicsEntity from "../GameObjects/PhysicsEntity.js";

class ShapeHelper {
  /**
   * Creates a static shape and adds it to the scene.
   * @param {string} shapeType - The type of shape (e.g., 'box', 'sphere', 'plane').
   * @param {Object} config - Configuration for the shape (size, position, material, etc.).
   * @param {THREE.Scene} scene - The Three.js scene to add the shape to.
   * @returns {StaticEntity} - The created StaticEntity instance.
   */
  static ShapeBuilderStatic(shapeType, config, scene) {
    const staticEntity = new StaticEntity(config);

    // Create geometry based on shape type
    const geometry = ShapeHelper.createGeometry(shapeType, config.size || {});
    const material = new THREE.MeshStandardMaterial(config.material || { color: 0xffffff });

    // Create the mesh
    staticEntity.mesh = new THREE.Mesh(geometry, material);
    staticEntity.mesh.position.set(
      config.position?.x || 0,
      config.position?.y || 0,
      config.position?.z || 0
    );
    staticEntity.mesh.rotation.set(
      config.rotation?.x || 0,
      config.rotation?.y || 0,
      config.rotation?.z || 0
    );
    staticEntity.mesh.scale.set(
      config.scale?.x || 1,
      config.scale?.y || 1,
      config.scale?.z || 1
    );

    // Enable shadows
    staticEntity.mesh.castShadow = true;
    staticEntity.mesh.receiveShadow = true;

    // Add to scene
    staticEntity.addToScene(scene);
    return staticEntity;
  }

  /**
   * Creates a physics-enabled shape and adds it to the scene.
   * @param {string} shapeType - The type of shape (e.g., 'box', 'sphere').
   * @param {Object} config - Configuration for the shape (size, position, material, etc.).
   * @param {THREE.Scene} scene - The Three.js scene to add the shape to.
   * @returns {PhysicsEntity} - The created PhysicsEntity instance.
   */
  static ShapeBuilderPhysics(shapeType, config, scene) {
    const physicsEntity = new PhysicsEntity(config);

    // Create geometry based on shape type
    const geometry = ShapeHelper.createGeometry(shapeType, config.size || {});
    const material = new THREE.MeshStandardMaterial(config.material || { color: 0xffffff });

    // Create the mesh
    physicsEntity.mesh = new THREE.Mesh(geometry, material);
    physicsEntity.mesh.position.set(
      config.position?.x || 0,
      config.position?.y || 0,
      config.position?.z || 0
    );
    physicsEntity.mesh.rotation.set(
      config.rotation?.x || 0,
      config.rotation?.y || 0,
      config.rotation?.z || 0
    );
    physicsEntity.mesh.scale.set(
      config.scale?.x || 1,
      config.scale?.y || 1,
      config.scale?.z || 1
    );

    // Enable shadows
    physicsEntity.mesh.castShadow = true;
    physicsEntity.mesh.receiveShadow = true;

    // Add to scene
    physicsEntity.addToScene(scene);
    return physicsEntity;
  }

  /**
   * Creates geometry for a given shape type.
   * @param {string} shapeType - The type of shape to create.
   * @param {Object} size - Size configuration for the geometry.
   * @returns {THREE.Geometry} - The created geometry.
   */
  static createGeometry(shapeType, size) {
    switch (shapeType.toLowerCase()) {
      case "box":
        return new THREE.BoxGeometry(
          size.width || 1,
          size.height || 1,
          size.depth || 1
        );
      case "sphere":
        return new THREE.SphereGeometry(
          size.radius || 1,
          size.widthSegments || 32,
          size.heightSegments || 16
        );
      case "cone":
        return new THREE.ConeGeometry(
          size.radius || 1,
          size.height || 2,
          size.radialSegments || 32
        );
      case "cylinder":
        return new THREE.CylinderGeometry(
          size.radiusTop || 1,
          size.radiusBottom || 1,
          size.height || 2,
          size.radialSegments || 32
        );
      case "torus":
        return new THREE.TorusGeometry(
          size.radius || 1,
          size.tube || 0.4,
          size.radialSegments || 16,
          size.tubularSegments || 100
        );
      case "plane":
        return new THREE.PlaneGeometry(
          size.width || 1,
          size.height || 1
        );
      default:
        throw new Error(`Shape type "${shapeType}" is not supported.`);
    }
  }

  /**
   * Imports a 3D model (GLTF/GLB) and adds it to the scene.
   * @param {string} url - The URL of the model file.
   * @param {THREE.Scene} scene - The Three.js scene to add the model to.
   * @param {Object} options - Options for position, rotation, and scale.
   * @returns {Promise<THREE.Object3D>} - A promise resolving with the loaded model.
   */
  static ImportShape(url, scene, options = {}) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;

          // Set position, rotation, and scale
          model.position.set(
            options.position?.x || 0,
            options.position?.y || 0,
            options.position?.z || 0
          );

          model.rotation.set(
            options.rotation?.x || 0,
            options.rotation?.y || 0,
            options.rotation?.z || 0
          );

          model.scale.set(
            options.scale?.x || 1,
            options.scale?.y || 1,
            options.scale?.z || 1
          );

          // Enable shadows
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Add to the scene
          scene.add(model);
          resolve(model);
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load GLTF model: ${error.message}`));
        }
      );
    });
  }
}

// Nathan (and myself for later) this is an example on how to use the ImportShape() method.
/*
--------------------------------------------------------------------------------------------
    const modelURL = "./path/to/model.glb"; // Replace with the actual path to your model
    ShapeHelper.ImportShape(modelURL, scene, {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: Math.PI / 4, z: 0 },
    scale: { x: 2, y: 2, z: 2 },
    }).then((model) => {
    console.log("Model loaded:", model);

    // Optional: Add additional logic after loading the model
    }).catch((error) => {
    console.error("Failed to load model:", error);
    });
--------------------------------------------------------------------------------------------
*/

export default ShapeHelper;