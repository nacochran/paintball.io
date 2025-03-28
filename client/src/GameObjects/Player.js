import PhysicsEntity from "./PhysicsEntity.js";
import { keys, socketManager } from "../Globals.js";
import { Shape } from "../utils/ShapeHelper.js";
import * as THREE from 'three';
import BoundingBox from "../utils/BoundingBox.js";

export default class Player extends PhysicsEntity {
  constructor(config) {
    super(config);

    this.camera = config.camera;

    this.targetPos = this.position;

    // default player size
    this.size = { width: 1, height: 2, depth: 1 };

    // player stats
    this.health = 100;

    // input management
    this.inputs = {};
    this.t = 0;
  }

  /**
   * Process input to set the wish direction and target speed.
   * Also handles jumping and, if sliding, triggers a long jump.
   */
  handleMovement() {
    if (++this.t > 5) {
      const camera = this.camera;

      // send inputs back to server
      // ALSO: pass back camera right/forward vectors for movement calculations
      socketManager.send_inputs(this.inputs, { quaternion: { x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w } });

      // clear inputs
      this.inputs = {};

      // reset counter
      this.t = 0;
    }

    if (keys.pressed("W")) this.inputs['move_forward'] = true;
    if (keys.pressed("S")) this.inputs['move_backward'] = true;
    if (keys.pressed("A")) this.inputs['move_left'] = true;
    if (keys.pressed("D")) this.inputs['move_right'] = true;
    if (keys.pressed("Space")) this.inputs['jump'] = true;
  }

  /**
   * Main update loop for the player.
   * Processes input, updates physics, handles collisions,
   * and updates rotation and transforms for both the shape and bounding box.
   */
  update(entities) {
    // TODO send rotation info to back-end.... or mouse movements...
    this.handleMovement();

    // TODO: use interpolation
    // for now just set entiti pos to target pos
    this.position = this.targetPos;
  }
}