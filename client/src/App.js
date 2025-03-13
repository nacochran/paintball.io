import Button from "./EventObjects/Button.js";
import { mouse, keys, timeManager, sceneManager, UICanvas } from "./Globals.js";
import { rectToRect, rectToCircle } from "./utils/collision.js";

// Import Scenes
import playScene from "./Scenes/Play.js";
import menuScene from "./Scenes/Menu.js";
import loginScene from "./Scenes/Login.js";
import signupScene from "./Scenes/Signup.js";
import personalProfileScene from "./Scenes/PersonalProfile.js";
import publicProfileScene from "./Scenes/PublicProfile.js";
import settingsScene from "./Scenes/Settings.js";
import arenasScene from "./Scenes/Arenas.js";

// Register action labels for key codes
keys.register("W", "KeyW");
keys.register("A", "KeyA");
keys.register("S", "KeyS");
keys.register("D", "KeyD");
keys.register("UP", "ArrowUp");
keys.register("DOWN", "ArrowDown");
keys.register("LEFT", "ArrowLeft");
keys.register("RIGHT", "ArrowRight");
keys.register("Space", "Space");
keys.register("Shift", "ShiftLeft");
keys.register("Ctrl", "ControlLeft");
keys.register("C", "KeyC");
keys.register("LeftMouseButton", 0)

// Register Button (Shape) Types
Button.registerType('rect', rectToRect);
Button.registerType('circle', rectToCircle);

// Register Scenes
sceneManager.addScene("menu", menuScene);
sceneManager.addScene("login", loginScene);
sceneManager.addScene("signup", signupScene);
sceneManager.addScene("personal-profile", personalProfileScene);
sceneManager.addScene("public-profile", publicProfileScene);
sceneManager.addScene("settings", settingsScene);
sceneManager.addScene("play", playScene);
sceneManager.addScene("arenas", arenasScene);


let lastFrameTime = 0; // Tracks the time of the last frame

function app(currentTime) {
  // Calculate delta time (in seconds)
  const deltaTime = (currentTime - lastFrameTime) / 1000;
  lastFrameTime = currentTime;

  // Clear UI canvas
  const ctx = UICanvas.getContext('2d');
  ctx.clearRect(0, 0, UICanvas.width, UICanvas.height);

  // Reset mouse cursor to default
  mouse.setCursor('default');

  // Update and render the scene
  sceneManager.displayScene(deltaTime);

  // Run time intervals
  timeManager.runIntervals(deltaTime);

  // Queue the next frame
  requestAnimationFrame(app);
}

// on app startup
(async () => {
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
  sceneManager.user = user;

  sceneManager.setScene("menu");

  // Start the animation loop
  requestAnimationFrame(app);

  keys.handleEvents();
  mouse.handleEvents();
})();

export default app;