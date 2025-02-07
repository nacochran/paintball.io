import * as THREE from 'three';

export default class BoundingBox {
  constructor(entity) {
    this.entity = entity;
    this.size = new THREE.Vector3(entity.size.width, entity.size.height, entity.size.depth);
    this.position = entity.position;
    this.rotation = entity.rotation || new THREE.Vector3(0, 0, 0);

    // The OBB (Oriented Bounding Box) transformation matrix.
    this.obb = new THREE.Matrix4();
    this.corners = []; // Will store the 8 world-space corners of the bounding box.

    // Factor to enlarge the bounding box (1.0 = exactly the entity's size; 1.1 = 10% larger)
    this.enlargeFactor = 1.1;

    this.update();
  }

  /**
   * Updates the bounding box based on the entity's position, size, and rotation.
   */
  update() {
    // Update size dynamically from the entity.
    this.size.set(this.entity.size.width, this.entity.size.height, this.entity.size.depth);

    // Use the entity's current position.
    this.position = this.entity.position;

    // Create a quaternion from the entity's rotation (assuming Euler angles).
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        this.entity.rotation.x,
        this.entity.rotation.y,
        this.entity.rotation.z
      )
    );

    // Compose the transformation matrix (position, rotation, and uniform scale of 1).
    this.obb.compose(this.position, quaternion, new THREE.Vector3(1, 1, 1));

    // Compute half-size, then enlarge it by the desired factor.
    const factor = this.enlargeFactor;
    const halfSize = this.size.clone().multiplyScalar(0.5 * factor);

    // Define the 8 local-space corners of the box.
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

    // Transform the local corners to world space using the OBB matrix.
    this.corners = localCorners.map(corner => corner.applyMatrix4(this.obb));
  }

  /**
   * Checks for collisions with another oriented bounding box using SAT.
   */
  isColliding(otherBoundingBox) {
    return this.satCollision(this.corners, otherBoundingBox.corners);
  }

  /**
   * Separating Axis Theorem (SAT) collision detection for OBBs.
   */
  satCollision(cornersA, cornersB) {
    const axes = this.getSeparatingAxes(cornersA, cornersB);

    for (const axis of axes) {
      if (!this.overlapsOnAxis(axis, cornersA, cornersB)) {
        return false; // Found a separating axis—no collision.
      }
    }
    return true; // No separating axis found—collision detected.
  }

  /**
   * Returns the separating axes to test for SAT.
   */
  getSeparatingAxes(cornersA, cornersB) {
    const axes = [];

    // Compute edge vectors for the first box.
    const edgesA = [
      cornersA[1].clone().sub(cornersA[0]),
      cornersA[2].clone().sub(cornersA[0]),
      cornersA[4].clone().sub(cornersA[0]),
    ];
    // Compute edge vectors for the second box.
    const edgesB = [
      cornersB[1].clone().sub(cornersB[0]),
      cornersB[2].clone().sub(cornersB[0]),
      cornersB[4].clone().sub(cornersB[0]),
    ];

    // Add the face normals (the edge vectors) of both boxes.
    axes.push(...edgesA, ...edgesB);

    // Compute the cross products of each pair of edges from both boxes.
    for (const edgeA of edgesA) {
      for (const edgeB of edgesB) {
        const cross = new THREE.Vector3().crossVectors(edgeA, edgeB);
        if (cross.lengthSq() > 1e-6) { // Ignore near-zero-length axes.
          axes.push(cross.normalize());
        }
      }
    }

    return axes;
  }

  /**
   * Checks if two sets of corners overlap along a given axis.
   */
  overlapsOnAxis(axis, cornersA, cornersB) {
    let minA = Infinity, maxA = -Infinity;
    let minB = Infinity, maxB = -Infinity;

    // Project all corners of box A onto the axis.
    for (const corner of cornersA) {
      const projection = corner.dot(axis);
      minA = Math.min(minA, projection);
      maxA = Math.max(maxA, projection);
    }
    // Project all corners of box B onto the axis.
    for (const corner of cornersB) {
      const projection = corner.dot(axis);
      minB = Math.min(minB, projection);
      maxB = Math.max(maxB, projection);
    }

    // Check if the projections overlap.
    return maxA >= minB && maxB >= minA;
  }

  /**
   * Handles collision detection with all collidable entities.
   */
  handleCollisions(entities) {
    let collisions = [];

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