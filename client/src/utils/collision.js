function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  var area = 0.5 * (-y2 * x3 + y1 * (-x2 + x3) + x1 * (y2 - y3) + x2 * y3);
  var s = 1 / (2 * area) * (y1 * x3 - x1 * y3 + (y3 - y1) * px + (x1 - x3) * py);
  var t = 1 / (2 * area) * (x1 * y2 - y1 * x2 + (y1 - y2) * px + (x2 - x1) * py);
  return s > 0 && t > 0 && 1 - s - t > 0;
}

function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
  var ua, ub, denominator;
  denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denominator === 0) {
    return false;
  }
  ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

function rectToRect(rect1, rect2) {
  return (
    rect1.x + rect1.width > rect2.x &&
    rect1.x < rect2.x + rect2.width &&
    rect1.y + rect1.height > rect2.y &&
    rect1.y < rect2.y + rect2.height
  );
}

function rectToCircle(rect, circle) {
  var closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  var closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  return distance(circle.x, circle.y, closestX, closestY) <= circle.radius;
}

var rectToEllipse = function (rect, ellipse) {
  var halfW = ellipse.width * 0.5;
  var halfH = ellipse.height * 0.5;
  if (rect.x + rect.width < ellipse.x - halfW || rect.x > ellipse.x + halfW ||
    rect.y + rect.height < ellipse.y - halfH || rect.y > ellipse.y + halfH) {
    return false;
  }
  var angX = (rect.x < ellipse.x) ? acos((rect.x + rect.width - ellipse.x) / halfW) : acos((rect.x - ellipse.x) / halfW);
  var distY = sin(angX) * halfH;
  var r = rect.y < ellipse.y + distY && rect.y + rect.height > ellipse.y - distY;
  return r;
};

var rectToLine = function (r, b) {
  if (!rectToRect(r, { x: b.x1, y: b.y1, width: abs(b.x2 - b.x1), height: abs(b.y2 - b.y1) })) {
    return false;
  }
  var rc = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  var slope = (b.y2 - b.y1) / (b.x2 - b.x1);
  if (rc.y > map(rc.x, b.x1, b.x2, b.y1, b.y2)) {
    var cc = { y: r.y };
    cc.x = (slope > 0) ? (r.x + r.width) : (r.x);
    if (cc.y < map(cc.x, b.x1, b.x2, b.y1, b.y2)) {
      return map(cc.x, b.x1, b.x2, b.y1, b.y2);
    }
  } else {
    var cc = { y: r.y + r.height };
    cc.x = (slope > 0) ? (r.x) : (r.x + r.width);
    if (cc.y > map(cc.x, b.x1, b.x2, b.y1, b.y2)) {
      return map(cc.x, b.x1, b.x2, b.y1, b.y2) - r.height;
    }
  }
  return false;
};

function rectToTriangle(rect, triangle) {
  var rectCorners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x, y: rect.y + rect.height },
    { x: rect.x + rect.width, y: rect.y + rect.height }
  ];

  for (var i = 0; i < rectCorners.length; i++) {
    if (pointInTriangle(rectCorners[i].x, rectCorners[i].y, triangle.x1, triangle.y1, triangle.x2, triangle.y2, triangle.x3, triangle.y3)) {
      return true;
    }
  }

  var triangleVertices = [
    { x: triangle.x1, y: triangle.y1 },
    { x: triangle.x2, y: triangle.y2 },
    { x: triangle.x3, y: triangle.y3 }
  ];

  for (var j = 0; j < triangleVertices.length; j++) {
    if (triangleVertices[j].x >= rect.x && triangleVertices[j].x <= rect.x + rect.width &&
      triangleVertices[j].y >= rect.y && triangleVertices[j].y <= rect.y + rect.height) {
      return true;
    }
  }

  return false;
}

export { rectToRect, rectToCircle };