export default class Mouse {
  constructor(config) {
    // Default configuration for mouse properties
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.width = config.width || 0;
    this.height = config.height || 0;
    this.prevX = this.x;
    this.prevY = this.y;
    this.moving = false;
    this.events = [];
    this.cursorType = config.cursorType || "default"; // Default cursor behavior
    // Custom cursor: object should contain 'state' and 'display' function
    this.cursor = config.cursor || { state: "auto", display: () => { } };

    // If custom cursor is defined, hide the default browser cursor
    if (this.cursorType !== "default") {
      document.body.style.cursor = 'none';
    }

    // Update the mouse position on mousemove
    document.addEventListener('mousemove', (event) => {
      this.setPosition(event.pageX, event.pageY);
      this.update();
    });
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    // Track whether the mouse is moving
    this.moving = (this.x !== this.prevX || this.y !== this.prevY);
    this.prevX = this.x;
    this.prevY = this.y;
  }

  display() {
    // If custom cursor is defined, display it at mouse.x, mouse.y
    if (this.cursorType !== "default") {
      this.cursor.display(this.x, this.y, this.width, this.height);
    }
  }

  onMove(callback) {
    const moveEvent = () => {
      if (this.moving) {
        callback();
      }
    };
    this.events.push(moveEvent);
  }

  onClick(callback) {
    // Register a click event handler
    window.addEventListener('click', callback);
  }

  handleEvents() {
    // Execute all registered events
    this.events.forEach(event => event());
  }

  update() {
    // Update the mouse position and handle events
    this.setPosition(mouseX, mouseY);
    this.display();
    this.handleEvents();
  }
}