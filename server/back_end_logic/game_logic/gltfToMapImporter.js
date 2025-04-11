import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Given a path to a GLTF file (e.g. exported from Blender),
 * load it with Three.js, compute bounding boxes for each mesh,
 * and produce a "map" object that your Arena system can use.
 */
export async function convertGltfToMap(gltfPath) {
  // Set up a basic Three.js scene, just for bounding-box calculations
  const scene = new THREE.Scene();
  const loader = new GLTFLoader();

  // Load the GLTF (async)
  const gltf = await loader.loadAsync(gltfPath);

  // Add the loaded scene to our temporary scene
  scene.add(gltf.scene);

  // We'll store all "platform" objects from the GLTF
  const platforms = [];

  // Optionally: for debugging, we'll also keep all Mesh references
  const meshes = [];

  // Traverse the GLTF scene
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      // Compute bounding box
      child.updateMatrixWorld(true);

      // We can clone the geometry so we don't alter the original
      const bbox = new THREE.Box3().setFromObject(child);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      bbox.getSize(size);
      bbox.getCenter(center);

      // Position of the bounding box center in world coords
      // For the "map" format, we'll store positions as x/y/z
      // and size as width/height/depth
      const meshPosition = {
        x: center.x,
        y: center.y,
        z: center.z,
      };
      const meshSize = {
        width: size.x,
        height: size.y,
        depth: size.z,
      };

      // For now, let's define them all as "platforms" or "blocks"
      // so we can run collision on them. We could also add flags
      // if we decide we can use a Blender naming or metadata convention that indicates something else.
      platforms.push({
        type: 'static-block',        // or 'platform'
        position: meshPosition,
        size: meshSize,
        isCollidable: true
      });

      meshes.push(child);
    }
  });

  // Hard-coded: No spawn points from the GLTF (unless you want to specify them).
  // From my research we could define empties/null objects in Blender named "PlayerSpawn"
  // and handle them here if we wanted.
  const player_spawn_points = [];
  const equipment_spawn_points = [];

  // Return a map object that your Arena code expects
  const mapData = {
    platforms,
    player_spawn_points,
    equipment_spawn_points
  };

  return mapData;
}