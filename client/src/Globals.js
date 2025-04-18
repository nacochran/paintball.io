import KeyManager from "./EventObjects/KeyManager.js";
import MouseManager from "./EventObjects/MouseManager.js";
import TimeManager from "./EventObjects/TimeManager.js";
import SceneManager from "./EventObjects/SceneManager.js";
import SocketManager from "./utils/Socket.js";

const mouse = new MouseManager({});
const keys = new KeyManager();
const timeManager = new TimeManager();
const sceneManager = new SceneManager({});

const UICanvas = document.getElementById('ui-canvas');

// 'front-end' or 'back-end'
const DEV_MODE = "back-end";

const socketManager = new SocketManager();

export { mouse, keys, sceneManager, timeManager, UICanvas, DEV_MODE, socketManager };