import * as THREE from 'three';

export default class BoundingBox {
  /**
   * @param {Entity} entity - Your custom entity with size/position/rotation.
   * @param {THREE.Scene} scene - The Three.js scene to which we'll add the wireframe.
   * @param {Object} options - Optional settings, e.g. { showWireframe: true }
   */
  constructor(entity, scene, options = {}) {
    this.entity = entity;
    this.scene = scene;
    
    // Default to true unless specified
    this.showWireframe = (options.showWireframe !== undefined) 
      ? options.showWireframe 
      : true;

    this.size = new THREE.Vector3(entity.size.width, entity.size.height, entity.size.depth);
    this.position = entity.position;
    this.rotation = entity.rotation || new THREE.Vector3(0, 0, 0);

    // The OBB (Oriented Bounding Box) transformation matrix.
    this.obb = new THREE.Matrix4();
    this.corners = [];

    // Factor to enlarge the bounding box (1.0 = exact size, 1.1 = 10% larger, etc.)
    this.enlargeFactor = 1.0001;

    // Create the wireframe and add it to the scene.
    this.wireframe = this.createWireframeMesh();
    scene.add(this.wireframe);

    // Toggle visibility based on the boolean
    this.wireframe.visible = this.showWireframe;

    // Initial update to position/scale corners & wireframe
    this.update();
  }

  /**
   * Creates a wireframe mesh for the bounding box.
   * (A unit cube edges geometry, which we'll scale in `update()`.)
   */
  createWireframeMesh() {
    const unitBox = new THREE.BoxGeometry(1, 1, 1);
    const edges = new THREE.EdgesGeometry(unitBox);
    const wireMat = new THREE.LineBasicMaterial({ color: 0xff00ff });
    const wireframeMesh = new THREE.LineSegments(edges, wireMat);

    // We'll manage its world transform ourselves via .matrix
    wireframeMesh.matrixAutoUpdate = false;
    return wireframeMesh;
  }

  /**
   * Toggles the wireframe's visibility at runtime.
   */
  setWireframeVisibility(visible) {
    this.showWireframe = visible;
    this.wireframe.visible = visible;
  }

  /**
   * Updates the bounding box based on the entity's position, size, and rotation,
   * and updates the wireframe mesh in the scene.
   */
  update() {
    // Update size from the entity
    this.size.set(
      this.entity.size.width,
      this.entity.size.height,
      this.entity.size.depth
    );
    this.position = this.entity.position;

    // Convert Euler angles to a Quaternion
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        this.entity.rotation.x,
        this.entity.rotation.y,
        this.entity.rotation.z
      )
    );

    // Compose the OBB transform (pos, rot, scale=1)
    this.obb.compose(this.position, quaternion, new THREE.Vector3(1, 1, 1));

    // Compute half-size, scaled by enlargeFactor
    const factor = this.enlargeFactor;
    const halfSize = this.size.clone().multiplyScalar(0.5 * factor);

    // Define the 8 local corners
    const localCorners = [
      new THREE.Vector3(-halfSize.x, -halfSize.y, -halfSize.z),
      new THREE.Vector3( halfSize.x, -halfSize.y, -halfSize.z),
      new THREE.Vector3(-halfSize.x,  halfSize.y, -halfSize.z),
      new THREE.Vector3( halfSize.x,  halfSize.y, -halfSize.z),
      new THREE.Vector3(-halfSize.x, -halfSize.y,  halfSize.z),
      new THREE.Vector3( halfSize.x, -halfSize.y,  halfSize.z),
      new THREE.Vector3(-halfSize.x,  halfSize.y,  halfSize.z),
      new THREE.Vector3( halfSize.x,  halfSize.y,  halfSize.z),
    ];

    // Transform local corners into world space
    this.corners = localCorners.map(corner => corner.applyMatrix4(this.obb));

    // Update the wireframe transform to match the OBB
    // We scale a unit cube to the bounding box size, then position and rotate it
    const boundingBoxSize = this.size.clone().multiplyScalar(factor);
    const transformMatrix = new THREE.Matrix4().compose(
      this.position,
      quaternion,
      boundingBoxSize
    );
    this.wireframe.matrix.copy(transformMatrix);
  }

  /**
   * Collision detection (OBB vs OBB) using the SAT.
   */
  isColliding(otherBoundingBox) {
    return this.satCollision(this.corners, otherBoundingBox.corners);
  }

  satCollision(cornersA, cornersB) {
    const axes = this.getSeparatingAxes(cornersA, cornersB);
    for (const axis of axes) {
      if (!this.overlapsOnAxis(axis, cornersA, cornersB)) {
        return false; // Found a separating axis => no collision.
      }
    }
    return true; // No separating axis => collision.
  }

  getSeparatingAxes(cornersA, cornersB) {
    const axes = [];
    // Edges of A
    const edgesA = [
      cornersA[1].clone().sub(cornersA[0]),
      cornersA[2].clone().sub(cornersA[0]),
      cornersA[4].clone().sub(cornersA[0]),
    ];
    // Edges of B
    const edgesB = [
      cornersB[1].clone().sub(cornersB[0]),
      cornersB[2].clone().sub(cornersB[0]),
      cornersB[4].clone().sub(cornersB[0]),
    ];

    // Face normals
    axes.push(...edgesA, ...edgesB);

    // Cross every edge of A with every edge of B
    for (const edgeA of edgesA) {
      for (const edgeB of edgesB) {
        const cross = new THREE.Vector3().crossVectors(edgeA, edgeB);
        if (cross.lengthSq() > 1e-6) {
          axes.push(cross.normalize());
        }
      }
    }
    return axes;
  }

  overlapsOnAxis(axis, cornersA, cornersB) {
    let minA = Infinity, maxA = -Infinity;
    let minB = Infinity, maxB = -Infinity;

    for (const corner of cornersA) {
      const proj = corner.dot(axis);
      minA = Math.min(minA, proj);
      maxA = Math.max(maxA, proj);
    }
    for (const corner of cornersB) {
      const proj = corner.dot(axis);
      minB = Math.min(minB, proj);
      maxB = Math.max(maxB, proj);
    }

    return maxA >= minB && maxB >= minA;
  }

  /**
   * Handle collisions with an array of entities that have bounding boxes.
   */
  handleCollisions(entities) {
    const collisions = [];
    for (const entity of entities) {
      if (entity !== this.entity && entity.isCollidable && entity.boundingBox) {
        if (this.isColliding(entity.boundingBox)) {
          collisions.push(entity);
        }
      }
    }
    return collisions;
  }
}