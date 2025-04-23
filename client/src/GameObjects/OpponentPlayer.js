import PhysicsEntity from "./PhysicsEntity.js";
import { Shape } from "../utils/ShapeHelper.js";

export default class OpponentPlayer extends PhysicsEntity {
  constructor(config) {
    super(config);
    this.entityType = 'opponent-player';

    this.shape = config.shape || new Shape({
      type: 'cube',
      size: this.size,
      position: this.position,
      color: 0x228B22
    });

    // additional configurations
    this.shape.mesh.castShadow = true;
    this.shape.mesh.receiveShadow = true;
    this.shape.mesh.userData.entityType = 'opponent';
    this.shape.mesh.userData.opponent = this;

    this.shape.attach(this);

    this.targetPos = this.position;

    this.name = config.name || "Test User";
    this.health = 100;
  }

  update() {
    // update shape's position, size, and orientation
    this.shape.update();

    // TODO: use interpolation
    // for now just set entiti pos to target pos
    this.position = this.targetPos;
  }
}