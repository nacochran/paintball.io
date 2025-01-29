import PhysicsEntity from "./PhysicsEntity.js";
import { mouse, keys, sceneManager } from "../Globals.js";
import { Shape } from "../utils/ShapeHelper.js";
import BoundingBox from "../utils/BoundingBox.js";
import * as THREE from 'three';

export default class Player extends PhysicsEntity {
  constructor(config) {
    super(config);

    this.size = { width: 50, height: 50, depth: 50 };

    this.state = "idle";

    // Movement properties
    this.walkSpeed = 5;
    this.sprintSpeed = 10;

    this.shape = new Shape({
      type: 'cube',
      size: this.size,
      position: this.position,
      color: 0x00ff00
    });
    this.shape.attach(this);

    this.boundingBox = new BoundingBox(this);
  }

  /**
   * Handle movement inputs and update velocity.
   */
  handleMovement() {
    // Set velocity direction
    let inputVector = new THREE.Vector3(0, 0, 0);
    if (keys.pressed("W")) inputVector.z -= 1; // Move forward
    if (keys.pressed("S")) inputVector.z += 1; // Move backward
    if (keys.pressed("A")) inputVector.x -= 1; // Move left
    if (keys.pressed("D")) inputVector.x += 1; // Move right 

    inputVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);

    if (keys.pressed("LEFT")) {
      this.rotation.y += 0.005;
    } else if (keys.pressed("RIGHT")) {
      this.rotation.y -= 0.005;
    }



    // Scale Velocity up to walking/sprinting speed
    this.state = "walking";
    const speed = this.state === "sprinting" ? this.sprintSpeed : this.walkSpeed;
    const velocityChange = inputVector.multiplyScalar(speed);
    this.velocity.x = velocityChange.x;
    this.velocity.z = velocityChange.z;

    // Handle jumping
    if (keys.pressed("Space")) {

      if (this.onPlatform) {
        this.velocity.y = 8;
      }
    }
  }

  /**
   * Main update loop for the player.
   */
  update(entities) {

    // Handle movement
    this.handleMovement();

    // Apply physics updates (gravity, friction, etc.)
    this.updatePhysics(entities);

    // update shape and bounding-box to match entities position, orientation, and size
    this.shape.update();
    this.boundingBox.update();

    this.handleCollisions(entities);
  }
}
