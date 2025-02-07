import StaticEntity from "./StaticEntity.js";
import { Shape } from "../utils/ShapeHelper.js";
import BoundingBox from "../utils/BoundingBox.js";

export default class Block extends StaticEntity {
  constructor(config) {
    super(config);

    this.size = { width: 1, height: 1, depth: 1 };

    this.shape = new Shape({
      type: 'cube',
      size: this.size,
      position: this.position,
      color: 0xaaaaaa
    });
    this.shape.attach(this);

    this.boundingBox = new BoundingBox(this);
  }

  update() {
    // update shape's position, size, and orientation
    this.shape.update();
    this.boundingBox.update();
  }
}