// Import Three.js and other dependencies
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import BoundingBox from '../utils/BoundingBox.js';
import StaticEntity from '../GameObjects/StaticEntity.js';

class Shape {
  constructor(config) {
    this.type = config.type;
    this.size = config.size;
    this.position = config.position || new THREE.Vector3(0, 0, 0);
    this.mesh = ShapeBuilder.shapes[this.type](config);
    this.mesh.position.copy(this.position);
    this.entity = null;

    // metadata used for detecting collisions
    this.mesh.userData.shape = this;
  }

  translate(x, y, z) {
    this.mesh.position.add(new THREE.Vector3(x, y, z));
  }

  scale(x, y, z) {
    this.mesh.scale.multiply(new THREE.Vector3(x, y, z));
  }

  rotate(x, y, z) {
    this.mesh.rotation.x += x;
    this.mesh.rotation.y += y;
    this.mesh.rotation.z += z;
  }

  attach(entity) {
    this.entity = entity;
  }

  update() {
    if (!this.entity) return;

    this.mesh.position.copy(this.entity.position);

    if (this.entity.rotation) {
      this.mesh.rotation.set(
        this.entity.rotation.x,
        this.entity.rotation.y,
        this.entity.rotation.z
      );
    }

    if (this.entity.size) {
      const normalizedSize = this.size;
      this.mesh.scale.set(
        this.entity.size.width / normalizedSize.width,
        this.entity.size.height / normalizedSize.height,
        this.entity.size.depth / normalizedSize.depth
      );
    }
  }
}

class ShapeBuilder {
  static shapes = {};

  static registerShape(type, shapeMethod) {
    ShapeBuilder.shapes[type] = shapeMethod;
  }
}

// Cube
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

// Sphere
ShapeBuilder.registerShape('sphere', (config) => {
  const geometry = new THREE.SphereGeometry(config.size.radius);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  return new THREE.Mesh(geometry, material);
});

// GLTF
ShapeBuilder.registerShape('gltf', (config) => {
  const loader = new GLTFLoader();
  const group = new THREE.Group();
  group.childEntities = [];

  const onLoadCallback = config.onLoad;

  // 🔍 Debug fetch of file to verify MIME and format
  fetch(config.url)
    .then(res => res.text())
    .then(text => {
      console.warn("🧪 Preview of glTF file (first 100 chars):", text.slice(0, 100));
    })
    .catch(err => {
      console.error("⚠️ Could not preview glTF file:", err);
    });

  group.loadPromise = new Promise((resolve, reject) => {
    loader.load(
      config.url,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.visible = true;
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              if (child.material.transparent && child.material.opacity < 1) {
                child.material.opacity = 1;
                child.material.transparent = false;
              }

              child.material.side = THREE.FrontSide;

              if (child.material.map) {
                child.material.map.encoding = THREE.sRGBEncoding;
              }
            }

            child.geometry.computeBoundingBox();

            if (config.collidable !== false) {
              const bbox = child.geometry.boundingBox;
              const size = new THREE.Vector3();
              bbox.getSize(size).addScalar(1);

              const scale = config.size || { width: 1, height: 1, depth: 1 };
              size.set(size.x * scale.width, size.y * scale.height, size.z * scale.depth);

              const worldPos = new THREE.Vector3();
              child.getWorldPosition(worldPos);

              const collisionEntity = new StaticEntity({
                x: worldPos.x,
                y: worldPos.y,
                z: worldPos.z,
                shapeType: 'cube',
                size: { width: size.x, height: size.y, depth: size.z },
                isCollidable: true
              });

              collisionEntity.shape = { mesh: child };
              collisionEntity.boundingBox = new BoundingBox(collisionEntity, config.scene);
              group.childEntities.push(collisionEntity);
            }
          } else if (child.isObject3D) {
            child.visible = true;
          }
        });

        group.add(gltf.scene);
        group.position.set(config.position?.x || 0, config.position?.y || 0, config.position?.z || 0);
        group.scale.set(config.size?.width || 1, config.size?.height || 1, config.size?.depth || 1);
        group.updateMatrixWorld(true);

        if (group.childEntities.length > 0) {
          group.childEntities.forEach((entity) => {
            const updatedPos = entity.shape.mesh.getWorldPosition(new THREE.Vector3());
            const updatedQuat = entity.shape.mesh.getWorldQuaternion(new THREE.Quaternion());
            entity.position.copy(updatedPos);
            entity.rotation = new THREE.Euler().setFromQuaternion(updatedQuat);
            entity.boundingBox?.update();
          });
        }

        if (config.debugAddToScene && config.scene) {
          config.scene.add(group);
          console.warn("⚠️ Debug: glTF model added directly to scene.");
        }

        if (onLoadCallback) onLoadCallback(group);
        resolve(group);
      },
      undefined,
      (error) => {
        console.error("❌ Failed to load glTF model:", error);
        if (config.onError) config.onError(error);
        reject(error);
      }
    );
  });

  return group;
});

export { ShapeBuilder, Shape };