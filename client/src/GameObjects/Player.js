import PhysicsEntity from "./PhysicsEntity.js";

export default class Player extends PhysicsEntity {
  constructor(config) {
    super(config);
    this.isSprinting = false;
    this.isCrouching = false;
    this.isSliding = false;
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
  sprint(isSprinting) {
    this.isSprinting = isSprinting;
    console.log(`Player is ${isSprinting ? "sprinting" : "not sprinting"}`);
  }

  // Handle jumping
  jump() {
    console.log("Player jumps!");
  }

  // Handle crouching
  crouch(isCrouching) {
    this.isCrouching = isCrouching;
    console.log(`Player is ${isCrouching ? "crouching" : "not crouching"}`);
  }

  // Handle sliding
  slide() {
    if (this.isSprinting && this.isCrouching) {
      this.isSliding = true;
      console.log("Player is sliding!");
    } else {
      this.isSliding = false;
      console.log("Player cannot slide unless sprinting and crouching.");
    }
  }

  // calls any methods we want to update in the game loop
  update(inputManager) {
    console.log("Testing Player:");
    console.log("x:", this.x, "y:", this.y, "z:", this.z);

    // Example input handling (replace with your inputManager logic later)
    if (inputManager.isKeyPressed("W")) this.move("forward");
    if (inputManager.isKeyPressed("S")) this.move("backward");
    if (inputManager.isKeyPressed("A")) this.move("left");
    if (inputManager.isKeyPressed("D")) this.move("right");
    if (inputManager.isKeyPressed("Space")) this.jump();
    if (inputManager.isKeyPressed("Shift")) this.sprint(true);
    else this.sprint(false);
    if (inputManager.isKeyPressed("Ctrl")) this.crouch(true);
    else this.crouch(false);

    // Sliding logic
    if (this.isSprinting && this.isCrouching) this.slide();
  }
}
