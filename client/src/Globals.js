import KeyManager from "./EventObjects/KeyManager.js";
import MouseManager from "./EventObjects/MouseManager.js";
import TimeManager from "./EventObjects/TimeManager.js";
import SceneManager from "./EventObjects/SceneManager.js";

const mouse = new MouseManager({});
const keys = new KeyManager();
const timeManager = new TimeManager();
const sceneManager = new SceneManager({});

const UICanvas = document.getElementById('ui-canvas');

export { mouse, keys, sceneManager, timeManager, UICanvas };