const globalShim = globalThis as Record<string, unknown>;

if (typeof globalShim.DOMMatrix === "undefined") {
  globalShim.DOMMatrix = class DOMMatrix {
    constructor(init?: unknown) {
      Object.assign(this, { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, init as object);
    }
    multiply() {
      return this;
    }
    translate() {
      return this;
    }
    scale() {
      return this;
    }
    rotate() {
      return this;
    }
    invert() {
      return this;
    }
  };
}

if (typeof globalShim.ImageData === "undefined") {
  globalShim.ImageData = class ImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    constructor(
      data: Uint8ClampedArray | number,
      width?: number,
      height?: number
    ) {
      if (typeof data === "number") {
        this.width = data;
        this.height = width ?? 0;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      } else {
        this.data = data;
        this.width = width ?? 0;
        this.height = height ?? (data.length / (this.width * 4 || 1));
      }
    }
  };
}

if (typeof globalShim.Path2D === "undefined") {
  globalShim.Path2D = class Path2D {};
}
