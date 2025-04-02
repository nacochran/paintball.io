// Import Three.js and other dependencies
import * as THREE from 'three';
// import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// import BoundingBox from '../utils/BoundingBox.js';
// // Import StaticEntity instead of Entity so that update() is implemented
// import StaticEntity from '../GameObjects/StaticEntity.js';

class Shape {
  constructor(config) {
    this.type = config.type;
    this.size = config.size;
    this.position = config.position || new THREE.Vector3(0, 0, 0);

    // 
    console.log("Testing the configuration of the shape: ");
    console.log("Shape position: ", this.position);
    console.log("Shape size: ", this.size);

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
   * Applies transformations to the shape's mesh to match the attached entity's
   * position, size, and orientation.
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
  const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
  const material = new THREE.MeshStandardMaterial({
    color: config.color || 0xffffff,
    roughness: 0.5,
    metalness: 0.5,
  });
  return new THREE.Mesh(geometry, material);
});

ShapeBuilder.registerShape('sphere', (config) => {
  const geometry = new THREE.SphereGeometry(config.size.radius);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  return new THREE.Mesh(geometry, material);
});

// // Register a new shape type for glTF files with callback and promise support
// ShapeBuilder.registerShape('gltf', (config) => {
//   const loader = new GLTFLoader();
//   const group = new THREE.Group();
//   // Attach an array to hold collision entities
//   group.childEntities = [];

//   // Optionally extract an onLoad callback from the config
//   const onLoadCallback = config.onLoad;

//   // Create a promise and attach it to the group for async handling
//   group.loadPromise = new Promise((resolve, reject) => {
//     loader.load(
//       config.url,
//       (gltf) => {
//         // Traverse the loaded scene to configure each mesh
//         gltf.scene.traverse((child) => {
//           if (child.isMesh) {
//             child.castShadow = true;
//             child.receiveShadow = true;

//             // Compute bounding box for the mesh's geometry
//             child.geometry.computeBoundingBox();
//             let bbox = child.geometry.boundingBox;
//             let size = new THREE.Vector3();
//             bbox.getSize(size);
//             // console.log("DEBUG: Child mesh geometry bounding box:", bbox);
//             // console.log("DEBUG: Computed size before padding:", size);

//             // Add a little extra “padding”
//             size.addScalar(1);
//             // console.log("DEBUG: Size after padding:", size);

//             // Scale the computed size by the config's scale factors
//             const scaleX = (config.size && config.size.width) || 1;
//             const scaleY = (config.size && config.size.height) || 1;
//             const scaleZ = (config.size && config.size.depth) || 1;
//             size.x *= scaleX;
//             size.y *= scaleY;
//             size.z *= scaleZ;
//             // console.log("DEBUG: Size after applying config scale:", size);

//             // Get the mesh's world position (at load time)
//             const worldPos = new THREE.Vector3();
//             child.getWorldPosition(worldPos);
//             // console.log("DEBUG: Child world position:", worldPos);

//             // Create a new collision entity using StaticEntity
//             const collisionEntity = new StaticEntity({
//               x: worldPos.x,
//               y: worldPos.y,
//               z: worldPos.z,
//               shapeType: 'cube',
//               size: { width: size.x, height: size.y, depth: size.z },
//               isCollidable: true
//             });
//             // console.log("DEBUG: Collision entity created with size:", collisionEntity.size, "and position:", collisionEntity.position);

//             // Assign the loaded mesh as the collision entity's shape
//             collisionEntity.shape = { mesh: child };

//             // Create a bounding box for the collision entity
//             collisionEntity.boundingBox = new BoundingBox(collisionEntity, config.scene);
//             // console.log("DEBUG: Collision entity bounding box size:", collisionEntity.boundingBox.size);
//             // console.log("DEBUG: Collision entity bounding box corners:", collisionEntity.boundingBox.corners);

//             // Store the new collision entity for later use
//             group.childEntities.push(collisionEntity);
//           }
//         });

//         // Debug: log group details from config
//         // console.log("DEBUG: Config position:", config.position);
//         // console.log("DEBUG: Config scale (size):", config.size);

//         // Add the loaded scene to our group
//         group.add(gltf.scene);
//         // Apply position and scaling from config to the group
//         group.position.set(
//           (config.position && config.position.x) || 0,
//           (config.position && config.position.y) || 0,
//           (config.position && config.position.z) || 0
//         );
//         group.scale.set(
//           (config.size && config.size.width) || 1,
//           (config.size && config.size.height) || 1,
//           (config.size && config.size.depth) || 1
//         );

//         // console.log("DEBUG: Final group position:", group.position);
//         // console.log("DEBUG: Final group scale:", group.scale);
//         // console.log("DEBUG: Final glTF scene:", gltf.scene);

//         // *** Update collision entities now that the group transform is applied ***
//         group.updateMatrixWorld(true);
//         group.childEntities.forEach(collisionEntity => {
//           // Update the world position from the child mesh
//           const updatedWorldPos = collisionEntity.shape.mesh.getWorldPosition(new THREE.Vector3());
//           collisionEntity.position.copy(updatedWorldPos);

//           // Update the world rotation from the child mesh
//           const updatedWorldQuat = collisionEntity.shape.mesh.getWorldQuaternion(new THREE.Quaternion());
//           // Convert the quaternion to an Euler angle for the entity
//           collisionEntity.rotation = new THREE.Euler().setFromQuaternion(updatedWorldQuat);

//           // Now update the bounding box so that it uses the new position and rotation
//           if (collisionEntity.boundingBox) {
//             collisionEntity.boundingBox.update();
//           }

//           // console.log("DEBUG: Updated collision entity position:", collisionEntity.position);
//           // console.log("DEBUG: Updated collision entity rotation:", collisionEntity.rotation);
//         });

//         // If an onLoad callback was provided in the config, call it now.
//         if (onLoadCallback) {
//           onLoadCallback(group);
//         }

//         // Resolve the promise, indicating the model has finished loading.
//         resolve(group);
//       },
//       undefined, // Optional progress callback
//       (error) => {
//         console.error("Failed to load glTF model:", error);
//         reject(error);
//       }
//     );
//   });

//   return group; // Return the group immediately; it will populate once loaded.
// });

export { ShapeBuilder, Shape };