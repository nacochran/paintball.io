import { UICanvas } from "../Globals.js";

const UI = {
  ctx: UICanvas.getContext('2d'),
  fillStyle: 'rgb(0, 0, 0)',
  strokeStyle: 'rgb(0, 0, 0)',
  lineWidth: 1,
  fontSize: 20,
  fontStyle: 'Arial',
  textAlignH: "left",
  textAlignV: "top",
  width: window.innerWidth,
  height: window.innerHeight,

  fill(r, g, b) {
    this.fillStyle = `rgb(${r}, ${g}, ${b})`;
  },

  stroke(r, g, b) {
    this.strokeStyle = `rgb(${r}, ${g}, ${b})`;
  },

  strokeWeight(weight) {
    this.lineWidth = weight;
  },

  textSize(size) {
    this.fontSize = size;
  },

  textStyle(style = 'Arial') {
    this.fontStyle = style;
  },

  textAlign(horizontal = "left", vertical = "top") {
    const validH = ["left", "center", "right"];
    const validV = {
      top: "top",
      middle: "middle",
      bottom: "bottom",
      alphabetic: "alphabetic" // Default
    };

    this.textAlignH = validH.includes(horizontal) ? horizontal : "left";
    this.textAlignV = validV[vertical] || "alphabetic"; // Correct mapping
  },

  rect(x, y, width, height, radius = 0) {
    this.ctx.fillStyle = this.fillStyle;
    this.ctx.strokeStyle = this.strokeStyle;
    this.ctx.lineWidth = this.lineWidth;

    this.ctx.beginPath();
    if (radius > 0) {
      // Rounded rectangle
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + width - radius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.ctx.lineTo(x + width, y + height - radius);
      this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      this.ctx.lineTo(x + radius, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
    } else {
      this.ctx.rect(x, y, width, height);
    }
    this.ctx.fill();
    this.ctx.stroke();
  },

  ellipse(x, y, width, height) {
    this.ctx.fillStyle = this.fillStyle;
    this.ctx.strokeStyle = this.strokeStyle;
    this.ctx.lineWidth = this.lineWidth;

    this.ctx.beginPath();
    this.ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
  },

  text(message, x, y) {
    this.ctx.fillStyle = this.fillStyle;
    this.ctx.font = `${this.fontSize}px ${this.fontStyle}`;
    this.ctx.textAlign = this.textAlignH;
    this.ctx.textBaseline = this.textAlignV;

    // Measure text width and height
    //const textWidth = this.ctx.measureText(message).width;
    const textHeight = this.fontSize; // Approximate height

    this.ctx.fillText(message, x, y);
  }
};

export default UI;
