
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
    this.intervals = [];
  }

  runIntervals() {
    for (let i = this.intervals.length - 1; i >= 0; i--) {
      const currentInterval = this.intervals[i];
      if (currentInterval.execute()) {
        this.intervals.splice(i, 1);
      }
    }
  }

  addInterval(config) {
    this.intervals.push(new TimedInterval(config));
  }
}
