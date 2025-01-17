import SceneManager from "./SceneManager.js";
import Button from "./EventObjects/Button.js";
import Mouse from "./EventObjects/Mouse.js";
import GameManager from "./GameManager.js";
import { rectToRect, rectToCircle } from "./utils/collision.js";

// Register Button (Shape) Types
Button.registerType('rect', rectToRect);
Button.registerType('circle', rectToCircle);

const mouse = new Mouse({ cursorType: 'default' });
const app = new SceneManager({ mouse: mouse });
const game = new GameManager();

// define setup
app.setup = function () {

  const scene1 = {
    name: "Scene 1",
    init: function () {
      game.setup();
    },
    display: function () {
      console.log("Running Scene 1...");
      game.run();
    },
    buttons: [
      new Button({
        x: 100,
        y: 100,
        width: 100,
        height: 50,
        display: function () {
          if (this.isInside(mouse, this)) {
            // do something
          } else {
            // do something else
          }
          // display button
        },
        onClick: function () {
          sceneTransition('scene2');
        }
      })
    ]
  };

  const scene2 = {
    name: "Scene 2",
    init: function () {
      console.log("Initializing Scene 2...");
    },
    display: function () {
      console.log("Running Scene 2...");
    }
  };

  // Add scenes to the scene manager
  app.addScene("scene1", scene1);
  app.addScene("scene2", scene2);

  // Set initial scene
  app.setScene("scene1");
}

export default app;