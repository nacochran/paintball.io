import StaticEntity from "./StaticEntity.js";
import { Shape } from "../utils/ShapeHelper.js";
import BoundingBox from "../utils/BoundingBox.js";

export default class Block extends StaticEntity {
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
    // update shape's position, size, and orientation
    this.shape.update();

    // for consistency, we need targetpos for static
    // elements as well
    // but in practice this assignment will be redundant
    this.position = this.targetPos;
  }
}