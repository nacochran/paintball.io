import PhysicsEntity from "./PhysicsEntity.js";

export default class Player extends PhysicsEntity {
  constructor(config) {
    super(config);
  }

  // add other methods to test


  // calls any methods we want to update in the game loop
  update() {
    console.log("Testing Player:");
    console.log("x:", this.x, "\ny:", this.y, "\nz:", + this.z);
    let a = [];
    console.log(typeof a);
  }
}