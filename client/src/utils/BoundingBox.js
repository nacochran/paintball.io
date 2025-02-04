import * as THREE from 'three';

export default class BoundingBox {
  constructor(entity) {
    this.entity = entity;
    this.size = new THREE.Vector3(entity.size.width, entity.size.height, entity.size.depth);
    this.position = entity.position;
    this.rotation = entity.rotation || new THREE.Vector3(0, 0, 0);

    this.obb = new THREE.Matrix4(); // Transformation matrix for OBB
    this.corners = []; // Store the 8 corners of the box
    this.update();
  }

  /**
   * Updates the bounding box based on the entity's position, size, and rotation.
   */
  update() {
    // Update size dynamically
    this.size.set(this.entity.size.width, this.entity.size.height, this.entity.size.depth);

    // Update position
    this.position = this.entity.position;

    // Compute rotation quaternion
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(this.entity.rotation.x, this.entity.rotation.y, this.entity.rotation.z)
    );

    // Construct the transformation matrix for OBB
    this.obb.compose(this.position, quaternion, new THREE.Vector3(1, 1, 1));

    // Compute half-size for box
    const halfSize = this.size.clone().multiplyScalar(0.5);

    // Define local-space corners of the box
    const localCorners = [
      new THREE.Vector3(-halfSize.x, -halfSize.y, -halfSize.z),
      new THREE.Vector3(halfSize.x, -halfSize.y, -halfSize.z),
      new THREE.Vector3(-halfSize.x, halfSize.y, -halfSize.z),
      new THREE.Vector3(halfSize.x, halfSize.y, -halfSize.z),
      new THREE.Vector3(-halfSize.x, -halfSize.y, halfSize.z),
      new THREE.Vector3(halfSize.x, -halfSize.y, halfSize.z),
      new THREE.Vector3(-halfSize.x, halfSize.y, halfSize.z),
      new THREE.Vector3(halfSize.x, halfSize.y, halfSize.z),
    ];

    // Transform corners to world space using the OBB matrix
    this.corners = localCorners.map(corner => corner.applyMatrix4(this.obb));
  }

  /**
   * Checks for collisions with another oriented bounding box.
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
        return false; // A separating axis was found, no collision
      }
    }
    return true; // No separating axis found, collision detected
  }

  /**
   * Returns the separating axes to test for SAT.
   */
  getSeparatingAxes(cornersA, cornersB) {
    const axes = [];

    // Compute edge vectors of each box
    const edgesA = [
      cornersA[1].clone().sub(cornersA[0]),
      cornersA[2].clone().sub(cornersA[0]),
      cornersA[4].clone().sub(cornersA[0]),
    ];
    const edgesB = [
      cornersB[1].clone().sub(cornersB[0]),
      cornersB[2].clone().sub(cornersB[0]),
      cornersB[4].clone().sub(cornersB[0]),
    ];

    // Add the face normals of both boxes
    axes.push(...edgesA, ...edgesB);

    // Compute cross products of all edge pairs (creates more separating axes)
    for (const edgeA of edgesA) {
      for (const edgeB of edgesB) {
        const cross = new THREE.Vector3().crossVectors(edgeA, edgeB);
        if (cross.lengthSq() > 1e-6) { // Avoid zero-length axes
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

    // Project all corners onto the axis
    for (const corner of cornersA) {
      const projection = corner.dot(axis);
      minA = Math.min(minA, projection);
      maxA = Math.max(maxA, projection);
    }
    for (const corner of cornersB) {
      const projection = corner.dot(axis);
      minB = Math.min(minB, projection);
      maxB = Math.max(maxB, projection);
    }

    // Check for overlap
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
