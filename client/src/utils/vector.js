// client/src/utils/vector.js

class Vector {
  constructor() {
    if (new.target === Vector) {
      throw new Error("Vector is an abstract class and cannot be instantiated directly.");
    }
  }

  add(vec) {
    throw new Error("Method 'add' must be implemented.");
  }

  subtract(vec) {
    throw new Error("Method 'subtract' must be implemented.");
  }

  dot(vec) {
    throw new Error("Method 'dot' must be implemented.");
  }

  scale(factor) {
    throw new Error("Method 'scale' must be implemented.");
  }

  magnitude() {
    throw new Error("Method 'magnitude' must be implemented.");
  }

  normalize() {
    throw new Error("Method 'normalize' must be implemented.");
  }
}

class Vec2 extends Vector {
  constructor(x = 0, y = 0) {
    super();
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
  }

  add(vec) {
    return new Vec2(this.x + vec.x, this.y + vec.y);
  }

  subtract(vec) {
    return new Vec2(this.x - vec.x, this.y - vec.y);
  }

  dot(vec) {
    return this.x * vec.x + this.y * vec.y;
  }

  scale(factor) {
    return new Vec2(this.x * factor, this.y * factor);
  }

  magnitude() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  normalize() {
    const mag = this.magnitude();
    return new Vec2(this.x / mag, this.y / mag);
  }
}

class Vec3 extends Vector {
  constructor(x = 0, y = 0, z = 0) {
    super();
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(vec) {
    return new Vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z);
  }

  subtract(vec) {
    return new Vec3(this.x - vec.x, this.y - vec.y, this.z - vec.z);
  }

  dot(vec) {
    return this.x * vec.x + this.y * vec.y + this.z * vec.z;
  }

  cross(vec) {
    return new Vec3(
      this.y * vec.z - this.z * vec.y,
      this.z * vec.x - this.x * vec.z,
      this.x * vec.y - this.y * vec.x
    );
  }

  scale(factor) {
    return new Vec3(this.x * factor, this.y * factor, this.z * factor);
  }

  magnitude() {
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
  }

  normalize() {
    const mag = this.magnitude();
    return new Vec3(this.x / mag, this.y / mag, this.z / mag);
  }
}

export { Vec2, Vec3 };