import PhysicsEntity from "./PhysicsEntity.js";
import { Shape } from "../utils/ShapeHelper.js";

export default class OpponentPlayer extends PhysicsEntity {
  constructor(config) {
    super(config);

    this.shape = config.shape || new Shape({
      type: 'cube',
      size: this.size,
      position: this.position,
      color: 0xaaaaaa
    });

    // additional configurations
    this.shape.mesh.castShadow = true;
    this.shape.mesh.receiveShadow = true;

    this.shape.attach(this);

    this.targetPos = this.position;
  }

  update() {
    console.log("Testing: the opponent's update is being called.");
    // update shape's position, size, and orientation
    this.shape.update();

    // TODO: use interpolation
    // for now just set entiti pos to target pos
    this.position = this.targetPos;
  }
}