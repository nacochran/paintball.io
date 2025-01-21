import PhysicsEntity from "./PhysicsEntity.js";
import { mouse, keys, sceneManager } from "../Globals.js";

export default class Player extends PhysicsEntity {
  constructor(config) {
    super(config);

    // Player-specific states
    this.isSprinting = false;
    this.isCrouching = false;
    this.isSliding = false;

    // Movement properties
    this.walkSpeed = 5; // Speed while walking
    this.sprintSpeed = 10; // Speed while sprinting
  }

  // Handle shooting
  shoot() {
    console.log("Player shoots!");
  }

  // Handle movement
  move(direction) {
    console.log(`Player moves ${direction}`);
  }

  // Handle sprinting
  sprint() {
    console.log("Player is sprinting");
  }

  // Handle jumping
  jump() {
    if (this.onGround) {
      this.velocity.y = 15; // Apply upward velocity for jump
      this.onGround = false; // Leave the ground
      console.log("Player jumps!");
    }
  }

  // Handle crouching
  crouch() {
    console.log("Player is crouching");
  }

  // Handle sliding
  slide() {
    console.log("Player is sliding!");
  }

  // Handle movement inputs and update physics
  handleMovement(deltaTime) {
    let inputVector = { x: 0, z: 0 };

    // Process movement inputs
    if (keys.pressed("W")) inputVector.z -= 1; // Move forward
    if (keys.pressed("S")) inputVector.z += 1; // Move backward
    if (keys.pressed("A")) inputVector.x -= 1; // Move left
    if (keys.pressed("D")) inputVector.x += 1; // Move right

    // Normalize the input vector to prevent faster diagonal movement
    const length = Math.sqrt(inputVector.x ** 2 + inputVector.z ** 2);
    if (length > 0) {
      inputVector.x /= length;
      inputVector.z /= length;
    }

    // Determine speed (walking or sprinting)
    const speed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;

    // Apply velocity based on input direction and speed
    this.velocity.x = inputVector.x * speed;
    this.velocity.z = inputVector.z * speed;

    console.log(`Input Vector: x=${inputVector.x}, z=${inputVector.z}, Speed: ${speed}`);
  }

  // Update method called in the game loop
  update(inputManager) {
    const deltaTime = inputManager.getDeltaTime(); // Get time since last frame

    // Handle movement
    this.handleMovement(deltaTime);

    // Apply physics updates (gravity, friction, etc.)
    super.update(deltaTime);

    // Prevent player from falling below the ground
    if (this.y < 0) {
      this.y = 0; // Reset position to ground level
      this.velocity.y = 0; // Reset vertical velocity
      this.onGround = true; // Ensure player is flagged as on the ground
    }

    // Process other inputs
    if (keys.pressed("Space")) this.jump(); // Handle jumping
    if (keys.pressed("Shift")) this.isSprinting = true; // Sprint toggle
    else this.isSprinting = false;

    if (keys.pressed("Ctrl")) this.isCrouching = true; // Crouch toggle
    else this.isCrouching = false;

    // Sliding logic
    if (this.isSprinting && this.isCrouching) this.slide();

    // Log player position for debugging
    console.log(`Player position: (${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)})`);
  }
}
