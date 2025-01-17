
export default class SceneManager {
  constructor(config) {
    this.scenes = {};
    this.currentScene = null;
    this.transitioning = false;
    this.targetScene = null;
    this.setup = function () { };
    this.mouse = config.mouse;
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
    if (this.scenes.hasOwnProperty(name)) {
      this.currentScene = this.scenes[name];
      this.currentScene.init();
    } else {
      console.log(`Scene '${name}' does not exist.`);
    }
  }

  displayScene() {
    if (this.currentScene) {
      this.currentScene.display();

      // displaying buttons
      for (let i = 0; i < this.currentScene.buttons.length; i++) {
        const button = this.currentScene.buttons[i];
        button.display();
      }

      // clicking buttons
      this.mouse.onClick(() => {
        for (let i = 0; i < this.currentScene.buttons.length; i++) {
          const button = this.currentScene.buttons[i];
          button.handleClick();
        }
      });
    }
  }

  handleButtons(mouse) {
    if (!this.transitioning && this.currentScene) {
      for (let i = 0; i < this.currentScene.buttons.length; i++) {
        const button = this.currentScene.buttons[i];
        button.handleClick(mouse);
      }
    }
  }
}


