import PhysicsEntity from "./PhysicsEntity.js";
import { keys } from "../Globals.js";
import { Shape } from "../utils/ShapeHelper.js";
import * as THREE from 'three';
import BoundingBox from "../utils/BoundingBox.js";

export default class Player extends PhysicsEntity {
  constructor(config) {
    super(config);

    // Define player size.
    this.size = { width: 50, height: 50, depth: 50 };

    // Starting state.
    this.state = "idle";

    // Movement properties
    this.walkSpeed = 1000;    // Force when walking
    this.sprintSpeed = 2000;  // Force when sprinting.

    // Ensure a defined rotation (an Euler). This will be used for orienting input.
    this.rotation = new THREE.Euler(0, 0, 0);

    // Set up the visual shape.
    this.shape = new Shape({
      type: 'cube',
      size: this.size,
      position: this.position,
      color: 0x00ff00
    });
    this.shape.attach(this);

    // Set up the bounding box for collisions.
    this.boundingBox = new BoundingBox(this);
  }

  /**
   * Handle movement input.
   * Applies a force based on WASD keys and adjusts rotation via LEFT/RIGHT.
   */
  handleMovement() {
    let inputVector = new THREE.Vector3(0, 0, 0);

    // Collect movement input.
    if (keys.pressed("W")) inputVector.z -= 1;
    if (keys.pressed("S")) inputVector.z += 1;
    if (keys.pressed("A")) inputVector.x -= 1;
    if (keys.pressed("D")) inputVector.x += 1;

    // Rotate the input vector by the player's current Y rotation.
    inputVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y);

    // Handle turning.
    if (keys.pressed("LEFT")) {
      this.rotation.y += 0.05;  // Increase turn speed if needed.
    } else if (keys.pressed("RIGHT")) {
      this.rotation.y -= 0.05;
    }

    // If there is movement input, apply a force.
    if (inputVector.length() > 0) {
      inputVector.normalize();
      const speed = (this.state === "sprinting") ? this.sprintSpeed : this.walkSpeed;
      const movementForce = inputVector.multiplyScalar(speed * this.mass);
      this.applyForce(movementForce);
    }

    // Handle jumping.
    if (keys.pressed("Space") && this.isGrounded) {
      console.log("The player is on the ground");
      this.velocity.y = 400;  // Directly set jump velocity
      this.isGrounded = false;
    }
  }

  /**
   * Main update loop for the player.
   * This function should be called once per frame.
   */
  update(entities) {
    // Instead of using a separate timer here, we use the inherited fixed-step update.
    // Accumulate dt and perform one or more fixed updates.
    this.timer.update();
    this.accumulatedTime += this.timer.getDelta();
    while (this.accumulatedTime >= this.fixedDelta) {
      // Process input and apply forces.
      this.handleMovement();

      // Update physics by one fixed step.
      this.fixedUpdate();

      // Handle collisions.
      this.handleCollisions(entities);

      this.accumulatedTime -= this.fixedDelta;
    }

    // Update the visual representation and bounding box.
    this.shape.update();
    this.boundingBox.update();
  }
}