import PhysicsEntity from "./PhysicsEntity.js";
import { keys } from "../Globals.js";
import { Shape } from "../utils/ShapeHelper.js";
import * as THREE from 'three';
import BoundingBox from "../utils/BoundingBox.js";

export default class Player extends PhysicsEntity {
  constructor(config, scene) {
    super(config);

    // Define player size.
    this.size = { width: 1, height: 1, depth: 1 };

    // Starting state.
    this.state = "idle";

    // Maximum speeds.
    this.walkSpeed = 10;    // Maximum horizontal speed (walking)
    this.sprintSpeed = 20;  // Maximum horizontal speed (sprinting)

    // Rotation for orientation.
    this.rotation = new THREE.Euler(0, 0, 0);

    // Set up the visual shape.
    this.shape = new Shape({
      type: 'cube',
      size: this.size,
      position: this.position,
      color: 0x00ff00
    });
    this.shape.attach(this);

    // Set up the bounding box.
    this.boundingBox = new BoundingBox(this, scene);
  }

  /**
   * Process input to set the wish direction and target speed.
   */
  handleMovement() {
    let inputVector = new THREE.Vector3(0, 0, 0);
    if (keys.pressed("W")) inputVector.z -= 1;
    if (keys.pressed("S")) inputVector.z += 1;
    if (keys.pressed("A")) inputVector.x -= 1;
    if (keys.pressed("D")) inputVector.x += 1;
  
    // Rotate input to align with the player's current Y rotation.
    // (Now that mouse controls rotation, this uses the updated rotation.)
    inputVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);
  
    if (inputVector.length() > 1) {
      inputVector.normalize();
    }
    this.wishDir.copy(inputVector);
  
    // Set target speed.
    this.targetSpeed = (this.state === "sprinting") ? this.sprintSpeed : this.walkSpeed;
  
    // Remove or comment out turning via keys:
    // if (keys.pressed("LEFT")) {
    //   this.rotation.y += 0.01;
    // } else if (keys.pressed("RIGHT")) {
    //   this.rotation.y -= 0.01;
    // }
  
    // Handle jumping.
    if (keys.pressed("Space") && this.isGrounded) {
      this.velocity.y = 30;
      this.isGrounded = false;
    }
  } 

  /**
   * Main update loop for the player.
   * Processes input, updates physics, and handles collisions.
   */
  update(entities) {
    this.timer.update();
    this.accumulatedTime += this.timer.getDelta();
    while (this.accumulatedTime >= this.fixedDelta) {
      this.handleMovement();
      this.updatePhysics(this.fixedDelta);
      this.handleCollisions(entities);
      this.accumulatedTime -= this.fixedDelta;
    }
    this.shape.update();
    this.boundingBox.update();
  }
}