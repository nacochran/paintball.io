// client/src/EventObjects/KeyManager.js
import InputManager from "./InputManager.js";

export default class KeyManager extends InputManager {
  constructor() {
    /**
     **** InputManager contains:
     * this.events = []; --> sequentially recorded actions
     * this.current = {}; --> current/active events
    **/
    super();

    // registered actions
    this.actions = {};
  }

  // registers labeled actions: effectively associates a key code 
  // with a string such as "jump"
  register(action, keyCode) {
    this.actions[action] = keyCode;
  }

  // checks if the 'selector' key is being pressed
  pressed(selector) {
    // if selector is string, then it is an action label, and we
    // should get the key code associated with the registration
    selector = (typeof selector === 'string') ? this.actions[selector] : selector;

    // if selector was action label AND it was not registered
    if (!selector) return false;

    return this.current[selector];
  }

  // activates a key
  keyPressed(keyCode) {
    this.current[keyCode] = true;
  }

  // deactivates a key
  keyReleased(keyCode) {
    if (this.current[keyCode]) {
      delete this.current[keyCode];
    }
  }

  // creates event listeners for key events
  handleEvents() {
    window.addEventListener("keydown", (event) => {
      this.keyPressed(event.code);
    });

    window.addEventListener("keyup", (event) => {
      this.keyReleased(event.code);
    });
  }
}