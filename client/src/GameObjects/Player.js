import PhysicsEntity from "./PhysicsEntity.js";
import { keys } from "../Globals.js";
import { Shape } from "../utils/ShapeHelper.js";
import * as THREE from 'three';
import BoundingBox from "../utils/BoundingBox.js";

export default class Player extends PhysicsEntity {
  constructor(config, scene, camera) {
    super(config);

    // Define player size.
    this.size = { width: 1, height: 1, depth: 1 };

    // Save the camera reference for movement calculations.
    this.camera = camera;

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
    // Ensure this.camera exists.
    if (!this.camera) {
      console.error("Camera reference is missing in Player!");
      return;
    }
  
    // Compute the camera’s forward direction.
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0; // flatten the vector so movement stays horizontal
    forward.normalize();
  
    // Compute the camera’s right vector.
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  
    // Initialize a movement vector.
    const move = new THREE.Vector3();
    if (keys.pressed("W")) move.add(forward);
    if (keys.pressed("S")) move.sub(forward);
    if (keys.pressed("A")) move.sub(right);
    if (keys.pressed("D")) move.add(right);
  
    // Normalize if there is movement.
    if (move.lengthSq() > 0) {
      move.normalize();
    }
    
    // Set the player's desired horizontal movement.
    this.wishDir.copy(move);
    this.targetSpeed = (this.state === "sprinting") ? this.sprintSpeed : this.walkSpeed;
  
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