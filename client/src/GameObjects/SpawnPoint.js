import StaticEntity from "./StaticEntity.js"
import { Shape } from "../utils/ShapeHelper.js";
import BoundingBox from "../utils/BoundingBox.js";
import Player from "./Player.js"
import Gun from "./Gun.js"

export default class SpawnPoint extends StaticEntity
{
    constructor(config, scene)
    {
        super(config);
        //randomized or constant spawn points?

        this.size = { width: 2, height: 2, depth: 2 };
        this.shape = new Shape({
            type: 'cube',
            size: this.size,
            position: this.position,
            color: 0x00ffff
          });
        this.shape.attach(this);
        scene.add(this.shape.mesh);
        this.boundingBox = new BoundingBox(this, scene);
        this.item = config.item;
        this.avail = true;
    }

    changeAvail(val = true) {
      this.avail = val;
      if(this.avail) {
        console.log(this.shape);
        this.shape.mesh.material.color.setHex(0x00ffff);
      }
      else {
        this.shape.mesh.material.color.setHex(0x00ff00);
      }
    }

    handleCollisions(entity) {
      if (entity instanceof Player) {
        //Add this.item.constructor != enitity.weapon.constructor
        if (this.avail)
        {
          console.log("I'm picking something up!");
          entity.weapon=this.item;
          this.changeAvail(false);
          setTimeout(this.changeAvail, 30000);
        }
      }
    }

    update()
    {
        this.shape.update();
        this.boundingBox.update();
    }
}