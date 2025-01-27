import Button from "./EventObjects/Button.js";
import { mouse, keys, timeManager, sceneManager, UICanvas } from "./Globals.js";
import { rectToRect, rectToCircle } from "./utils/collision.js";

// Import Scenes
import playScene from "./Scenes/Play.js";
import menuScene from "./Scenes/Menu.js";

// Register action labels for key codes
keys.register("W", "KeyW");
keys.register("A", "KeyA");
keys.register("S", "KeyS");
keys.register("D", "KeyD");
keys.register("Space", "Space"); // unnecessary
keys.register("Shift", "ShiftLeft");
keys.register("Ctrl", "ControlLeft");

// Register Button (Shape) Types
Button.registerType('rect', rectToRect);
Button.registerType('circle', rectToCircle);

// Register Scenes
sceneManager.addScene("menu", menuScene);
sceneManager.addScene("play", playScene);
sceneManager.setScene("play");

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

// Start the animation loop
requestAnimationFrame(app);


keys.handleEvents();
mouse.handleEvents();

export default app;