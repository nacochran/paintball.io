export default class TimeManager {
  static intervals = [];

  constructor(config) {
    this.callback = config.callback || function () { };
    this.time = 0;
    this.duration = config.duration;
    this.onFinish = config.onFinish || function () { };
  }

  static runIntervals() {
    for (let i = 0; i < TimeManager.intervals.length; i++) {
      const currentInterval = TimeManager.intervals[i];
      currentInterval.execute(i);
    }
  }

  static addInterval(interval) {
    TimeManager.intervals.push(new TimeManager({
      callback: interval.callback,
      duration: interval.duration,
      onFinish: interval.onFinish
    }));
  }

  execute(index) {
    this.callback();
    if (++this.time >= this.duration) {
      this.onFinish();
      TimeManager.intervals.splice(index, 1);
    }
  }
}
