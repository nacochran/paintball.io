import { keys, mouse, timeManager, sceneManager, UICanvas } from "../Globals.js";

export default class SceneManager {
  constructor(config) {
    this.scenes = {};
    this.user = null; // passed from back-end
    this.currentScene = null;
    this.transitioning = false;
    this.loading = false;
    this.targetScene = null;
    this.setup = function () { };

    // extra configuration details to pass to scenes
    this.sceneParameters = config.sceneParameters || {};
  }

  addScene(name, scene) {
    this.scenes[name] = {
      name: scene.name,
      init: scene.init,
      display: scene.display,
      buttons: scene.buttons || []
    };
  }

  setScene(name) {
    // adds this.handleButtons() as callback to mouse.onClick()
    mouse.removeAllCallbacks();
    mouse.onClick(() => {
      this.handleButtons();
    });

    if (this.scenes.hasOwnProperty(name)) {
      this.currentScene = this.scenes[name];
      this.currentScene.init(this.sceneParameters);
    } else {
      console.log(`Scene '${name}' does not exist.`);
    }
  }

  displayScene() {
    if (this.currentScene) {
      this.currentScene.display(this.sceneParameters);

      for (let i = 0; i < this.currentScene.buttons.length; i++) {
        const button = this.currentScene.buttons[i];
        button.display();
      }
    }
  }

  handleButtons() {
    if (!this.transitioning && this.currentScene) {
      for (let i = 0; i < this.currentScene.buttons.length; i++) {
        const button = this.currentScene.buttons[i];
        if (!button.disable) {
          button.handleClick(mouse);
        }
      }
    }
  }

  static openScene(onFinish) {
    timeManager.addInterval({
      callback: function () {
        const canvas = document.getElementById('ui-canvas');
        const ctx = canvas.getContext('2d');

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const w = UICanvas.width;
        const h = UICanvas.height;

        // Calculate the closed amount
        const closed = w / 2 - (this.time / this.duration) * w / 2;

        // Set fill color to black
        ctx.fillStyle = 'red';



        // Draw the closing rectangles
        ctx.fillRect(-w / 2 + closed, 0, w / 2, h);
        ctx.fillRect(w - closed, 0, w / 2, h);
      },
      duration: 25,
      onFinish: onFinish
    });
  }

  static closeScene(onFinish) {
    timeManager.addInterval({
      callback: function () {
        const ctx = UICanvas.getContext('2d');

        const w = UICanvas.width;
        const h = UICanvas.height;

        // Calculate the closed amount
        const closed = 0 + (this.time / this.duration) * w / 2;

        // Set fill color to black
        ctx.fillStyle = 'red';

        // Draw the closing rectangles
        ctx.fillRect(-w / 2 + closed, 0, w / 2, h);
        ctx.fillRect(w - closed, 0, w / 2, h);
      },
      duration: 25,
      onFinish: onFinish
    });
  }


  async createTransition(targetScene, cb = null) {
    // get user data from the back-end
    const user = await fetch('/authenticated-user')
      .then(response => response.json())
      .then(result => {
        if (result.error) {
          return null;
        } else {
          return result.user;
        }
      })
      .catch(error => console.error("AJAX request failed:", error));
    this.user = user;

    sceneManager.transitioning = true;
    SceneManager.closeScene(async function () {
      document.querySelector('.html-content').innerHTML = '';
      sceneManager.setScene(targetScene);
      if (cb != null) cb();
      SceneManager.openScene(function () {
        sceneManager.transitioning = false;
      });
    });
  }
}

