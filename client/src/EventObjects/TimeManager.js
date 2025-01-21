
class TimedInterval {
  constructor(config) {
    this.callback = config.callback || function () { };
    this.time = 0;
    this.duration = config.duration;
    this.onFinish = config.onFinish || function () { };
  }

  execute() {
    this.callback();
    this.time++;
    if (this.time >= this.duration) {
      this.onFinish();
      return true;
    }
    return false;
  }
}

export default class TimeManager {
  constructor() {
    // Existing intervals functionality
    this.intervals = [];

    // Delta time tracking
    this.lastTime = performance.now(); // Track the last frame's timestamp
    this.deltaTime = 0; // Time elapsed since the last frame
  }

  /**
   * Updates delta time. Call this once per frame in your game loop.
   */
  updateTime() {
    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000; // Calculate deltaTime in seconds
    this.lastTime = currentTime; // Update the last frame time
  }

  /**
   * Returns the current delta time (time since the last frame).
   */
  getDeltaTime() {
    return this.deltaTime;
  }

  /**
   * Runs all registered timed intervals.
   */
  runIntervals() {
    for (let i = this.intervals.length - 1; i >= 0; i--) {
      const currentInterval = this.intervals[i];
      if (currentInterval.execute()) {
        this.intervals.splice(i, 1);
      }
    }
  }

  /**
   * Adds a new interval to the manager.
   * @param {Object} config - Configuration for the interval
   */
  addInterval(config) {
    this.intervals.push(new TimedInterval(config));
  }
}
