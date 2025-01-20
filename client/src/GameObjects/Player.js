import PhysicsEntity from "./PhysicsEntity.js";
import { mouse, keys, sceneManager } from "../Globals.js";

export default class Player extends PhysicsEntity {
  constructor(config) {
    super(config);

    // temp
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
  sprint() {
    console.log('Player is sprinting');
    this.isSprinting = true;
  }

  // Handle jumping
  jump() {
    console.log("Player jumps!");
  }

  // Handle crouching
  crouch() {
    console.log("Player is crouching");
    this.isCrouching = true;
  }

  // Handle sliding
  slide() {
    console.log("Player is sliding!");
    this.isSliding = true;
  }

  // calls any methods we want to update in the game loop
  update(inputManager) {
    console.log("Testing Player:");
    //console.log("x:", this.x, "y:", this.y, "z:", this.z);

    if (keys.pressed("W")) this.move("forward");
    if (keys.pressed("S")) this.move("backward");
    if (keys.pressed("A")) this.move("left");
    if (keys.pressed("D")) this.move("right");
    if (keys.pressed("Space")) this.jump();

    if (keys.pressed("Shift")) this.sprint();

    if (keys.pressed("Ctrl")) this.crouch();

    // Sliding logic
    if (this.isSprinting && this.isCrouching) this.slide();
    this.isSliding = false;
    this.isCrouching = false;
    this.isSprinting = false;
  }
}
