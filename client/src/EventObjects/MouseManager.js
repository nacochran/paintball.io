// client/src/EventObjects/MouseManager.js
import InputManager from "./InputManager.js";

export default class MouseManager extends InputManager {
  constructor(config) {
    super(config);

    // Tracking the state of different mouse actions
    this.actions = {
      moving: false,
      clicking: false,
      releasing: false,
      dragging: false,
      leftClicking: false,
      rightClicking: false
    };

    // Mouse position and shape
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.shape = config.shape || null;
    if (this.shape != null) {
      // hide default cursor
      document.body.style.cursor = 'none';
    }

    // Movement tracking
    this.prevX = 0;
    this.prevY = 0;
    this.xVel = 0;
    this.yVel = 0;
    this.speed = 0;

    // Callbacks for mouse actions (store as arrays to handle multiple functions)
    this.callbacks = {
      onClick: [],
      onRelease: [],
      onDrag: [],
      onMove: [],
      onDoubleClick: []
    };
  }

  // Used for when the mouse shape is not defined
  setCursor(cursorType) {
    if (this.shape == null) {
      document.body.style.cursor = cursorType;
    }
  }

  // Display custom mouse cursor shape if defined
  display() {
    if (this.shape != null) {
      this.shape.display();
    }
  }

  // Perform actions
  move(x, y) {
    this.x = x;
    this.y = y;

    this.actions.moving = true;
    this.callbacks.onMove.forEach(callback => callback(x, y));
  }

  // button is used to determine left/right clicks
  click(button) {
    this.actions.clicking = true;
    if (button === 0) {
      this.actions.leftClicking = true;
    } else if (button === 2) {
      this.actions.rightClicking = true;
    }

    this.callbacks.onClick.forEach(callback => callback(button));
  }

  release(button) {
    this.actions.releasing = true;
    this.callbacks.onRelease.forEach(callback => callback(button));
  }

  drag() {
    this.actions.dragging = true;
    this.callbacks.onDrag.forEach(callback => callback(this.x, this.y));
  }

  // Set up event listeners for mouse events
  handleEvents() {
    if (!this.listenerAdded) {
      document.addEventListener('mousemove', (event) => {
        this.move(event.clientX, event.clientY);
      });

      document.addEventListener('mousedown', (event) => {
        // event.button determines left/right clicking
        // 0 is left, 2 is right
        this.click(event.button);
        this.drag();
      });

      document.addEventListener('mouseup', (event) => {
        this.release();
      });
    }
  }

  // Resets actions to false
  resetActions() {
    for (let action in this.actions) {
      this.actions[action] = false;
    }
  }

  // Remove all callback methods
  removeAllCallbacks() {
    this.callbacks.onClick = [];
    this.callbacks.onRelease = [];
    this.callbacks.onDrag = [];
    this.callbacks.onMove = [];
    this.callbacks.onDoubleClick = [];
  }

  // Boolean-checking methods for mouse actions
  moving() {
    return this.actions.moving;
  }

  clicking() {
    return this.actions.clicking;
  }

  releasing() {
    return this.actions.releasing;
  }

  dragging() {
    return this.actions.dragging;
  }

  leftClicking() {
    return this.actions.leftClicking;
  }

  rightClicking() {
    return this.actions.rightClicking;
  }

  // Methods to register callbacks for each action
  onClick(callback) {
    this.callbacks.onClick.push(callback);
  }

  onRelease(callback) {
    this.callbacks.onRelease.push(callback);
  }

  onDrag(callback) {
    this.callbacks.onDrag.push(callback);
  }

  onMove(callback) {
    this.callbacks.onMove.push(callback);
  }

  onDoubleClick(callback) {
    this.callbacks.onDoubleClick.push(callback);
  }
}
