"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
const activationColor = exports.activationColor = (value, max) => {
  let power = 1 - Math.min(value / max, 1);
  let color = [255, 255, 0];

  if (power < 0.5) {
    color[0] = 2 * power * 255;
  } else {
    color[1] = (1.0 - 2 * (power - 0.5)) * 255;
  }

  return color;
};

const angleToPoint = exports.angleToPoint = (x1, y1, x2, y2) => {
  let d = distance(x1, y1, x2, y2);
  let dx = (x2 - x1) / d;
  let dy = (y2 - y1) / d;

  let a = Math.acos(dx);
  return dy < 0 ? 2 * Math.PI - a : a;
};

const distance = exports.distance = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));