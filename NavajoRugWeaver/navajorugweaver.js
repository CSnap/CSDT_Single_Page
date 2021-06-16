/* eslint-disable */
let applicationID = 102;
window.cloud = new CloudSaver();

const myCanvas = document.getElementById("myCanvas");

let beadCostume = "./img/bead-default.png";
let wampumCostume = "";
let beadDesign = "point";
let scale = 10;
let beadSize = scale / 2;
let basketSize = scale / 2 / 2;
let basketShadowSize = beadSize - basketSize;
let beads = [];
let beadUndoBuffer = [];
let currBeadLength = 0;
let currBufferLength = 0;

let hideGrid = false;
let showCoordinatesInCorner = false;
let useWampum = false;
let navajoKnots = false;
let basketWeaving = false;

let gridColor = "#e9e9e9";

// constants for switch/case checking representation type
const HEX = 1;
const RGB = 2;
const RGBA = 3;

let globals = {
  projectName: "Untitled",
  userID: -1,
  userName: "",
  loadingText: "",
  projectID: typeof config !== "undefined" ? config.project.id : "",
  loginStatus: false,
  dataSource: beads,
  imageSource: myCanvas,
};

let flags = {
  newProject: true,
  modifiedSinceLastSave: false,
  loggedIn: false,
};

let constants = {
  loginButton: "#login-logout",
  logoutButton: "#logout",
  loginToSaveButton: "#save-cloud-login",
  loginToLoadButton: "#load-cloud-login",
  saveToCloudButton: "#save-cloud",
  loginModal: "#loginModal",
  projectList: "cloud-project",
  alertMessage: "#appAlert",
  alertMessageText: "#appAlert .modal-dialog .alert strong",
  userName: "#userName",
  userPass: "#userPass",
  loadModal: "#cloudLoading",
  saveModal: "#cloudSaving",
  projectName: "#project-name",
};

class Wampum {
  /**
   * @param {number} initPoint
   * @param {string} initColor
   * @param {HTMLElement} canvas
   * @param {string} pattern The design of the bead (bead, wampum, stitch, etc.)
   */
  constructor(initPoint, initColor, canvas, pattern = beadDesign) {
    this._initPoint = {
      x: initPoint.x,
      y: initPoint.y,
    };
    this._initColor = initColor;
    this._ctx = canvas ? canvas.getContext("2d") : undefined;

    this._endPoint = {
      x: 0,
      y: 0,
    };
    this._topPoint = {
      x: 0,
      y: 0,
    };

    this._rows = 0;
    this._iterColor = "#ffffff";

    this._linearRowLength = 0;
    this._linearPreNum = 0;
    this._linearPostNum = 0;

    this._triRowGroup = 0;
    this._triRowPrePost = 0;

    this._direction = 0;

    this._pattern = pattern;
  }

  /** Sets an end point for a line or a rectangle
   *
   * @param {number} endPoint
   */
  setEndPoint(endPoint) {
    this._endPoint = {
      x: endPoint.x,
      y: endPoint.y,
    };
  }

  /** Sets a top and an end point for a triangle
   *
   * @param {number} topPoint
   * @param {number} endPoint
   */
  setTriangle(topPoint, endPoint) {
    this._topPoint = {
      x: topPoint.x,
      y: topPoint.y,
    };

    this._endPoint = {
      x: endPoint.x,
      y: endPoint.y,
    };
  }

  /** Sets the corresponding params for a linear iteration
   *
   * @param {number} rowLength The starting lenght of the row
   * @param {number} pre The value added at the start of each row
   * @param {number} post The value added at the end of each row
   * @param {number} rows Number of rows total
   * @param {string} direction X+, X-, Y+, Y-
   * @param {string} color The additional color for the iteration gradient
   */
  setLinearIteration(rowLength, pre, post, rows, direction, color) {
    this._linearRowLength = rowLength;
    this._linearPreNum = pre;
    this._linearPostNum = post;

    this._rows = rows;
    this._direction = direction;
    this._iterColor = color;
  }

  /** Sets the corresponding params for a triangle iteration
   *
   * @param {number} group The number of rows for each grouping
   * @param {number} num The value added at the start and end of each row
   * @param {number} rows Number of rows total
   * @param {string} direction X+, X-, Y+, Y-
   * @param {string} color The additional color for the iteration gradient
   */
  setTriangleIteration(group, num, rows, direction, color) {
    this._triRowGroup = group;
    this._triRowPrePost = num;

    this._rows = rows;
    this._direction = direction;
    this._iterColor = color;
  }

  /** Stamps the image to the canvas
   *
   * @param {number} [point = this._initPoint] Location of the stamp.
   * @param {string} [color = this._initColor] Applies color to the stamp .
   */
  stamp(point = this._initPoint, color = this._initColor) {
    this._ctx.save();
    this._ctx.scale(1, 1);

    this._ctx.beginPath();

    if (navajoKnots) {
      this._ctx.ellipse(
        point.x,
        point.y,
        beadSize,
        beadSize / 2,
        -0.08 * Math.PI,
        0,
        2 * Math.PI,
        false
      );
      this._ctx.ellipse(
        point.x + beadSize,
        point.y + beadSize,
        beadSize,
        beadSize / 2,
        -0.08 * Math.PI,
        0,
        2 * Math.PI,
        false
      );
      this._ctx.ellipse(
        point.x - beadSize,
        point.y - beadSize,
        beadSize,
        beadSize / 2,
        -0.08 * Math.PI,
        0,
        2 * Math.PI,
        false
      );
      this._ctx.ellipse(
        point.x + beadSize,
        point.y - beadSize,
        beadSize,
        beadSize / 2,
        -0.08 * Math.PI,
        0,
        2 * Math.PI,
        false
      );
      this._ctx.ellipse(
        point.x - beadSize,
        point.y + beadSize,
        beadSize,
        beadSize / 2,
        -0.08 * Math.PI,
        0,
        2 * Math.PI,
        false
      );
    } else if (basketWeaving) {
      let darkenedColor = LightenColor(color, 18);

      // Create gradient
      let grd = this._ctx.createLinearGradient(
        point.x - beadSize,
        point.y - beadSize,
        point.x - beadSize,
        point.y - beadSize + scale
      );
      grd.addColorStop(0, "#" + darkenedColor);
      grd.addColorStop(0.3, color);
      grd.addColorStop(0.7, color);
      grd.addColorStop(1, "#" + darkenedColor);
      this._ctx.fillStyle = grd;
      this._ctx.shadowColor = "#000000";
      this._ctx.shadowBlur = beadSize - 2;
      this._ctx.shadowOffsetX = 0;
      this._ctx.shadowOffsetY = 0;

      if (
        ((point.x / scale) % 2 == 0 && (point.y / scale) % 2 == 0) ||
        ((point.x / scale) % 2 != 0 && (point.y / scale) % 2 != 0)
      ) {
        this._ctx.fillRect(
          point.x - basketSize,
          point.y - beadSize,
          scale - basketSize * 2,
          scale
        );
      } else {
        this._ctx.fillRect(
          point.x - beadSize,
          point.y - basketSize,
          scale,
          scale - basketSize * 2
        );
      }
    } else {
      this._ctx.arc(point.x, point.y, beadSize, 0, Math.PI * 2, false); // Outer circle
      this._ctx.arc(
        point.x - 1.8,
        point.y - 1.8,
        scale / 5,
        0,
        Math.PI * 2,
        true
      );
    }

    this._ctx.fillStyle = color;
    this._ctx.fill();

    this._ctx.restore();
  }

  /** Creates a line on the canvas
   *
   * @param {number} [start = this._initPoint] Start of the row.
   * @param {number} [end = this._endPoint]    End of the row.
   * @param {string} [color = this._initColor] Applies color to the stamp.
   *
   * @return {currentLine} Returns an array of points that creates the line.
   */
  line(start = this._initPoint, end = this._endPoint, color = this._initColor) {
    let currentLine = {
      points: [],
      steep: false,
    };
    // User enters same point twice
    if (start.x == end.x && start.y == end.y) {
      this.stamp();
      currentLine.points.push(this._initPoint);
    } else if (start.x == end.x) {
      //vertical lines
      for (
        let i = Math.min(start.y, end.y);
        i <= Math.max(start.y, end.y);
        i = i + scale
      ) {
        let current = {
          x: Math.round(start.x / 10) * 10,
          y: Math.round(i / 10) * 10,
        };
        let currentBead = new Wampum(current, color, myCanvas);
        currentBead.stamp();
        currentLine.points.push(current);
      }
    } else if (start.y == end.y) {
      //Horizontal lines
      for (
        let i = Math.min(start.x, end.x);
        i <= Math.max(start.x, end.x);
        i = i + scale
      ) {
        let current = {
          x: Math.round(i / 10) * 10,
          y: Math.round(start.y / 10) * 10,
        };
        let currentBead = new Wampum(current, color, myCanvas);
        currentBead.stamp();
        currentLine.points.push(current);
      }
    } else {
      let m = (end.y - start.y) / (end.x - start.x);
      let b = start.y - m * start.x;

      if (Math.abs(m) <= 1.0) {
        let startX = start.x < end.x ? start.x : end.x;
        let endX = start.x < end.x ? end.x : start.x;

        for (let i = startX; i <= endX; i = i + scale) {
          let doubleY = m * i + b;
          let intY = parseInt(doubleY);
          if (Math.abs(doubleY - intY) >= 0.5) {
            intY = doubleY >= 0.0 ? intY++ : intY--;
            currentLine.steep = true;
          }
          let current = {
            x: round(i / 10) * 10,
            y: round(intY / 10) * 10,
          };

          let currentBead = new Wampum(current, color, myCanvas);
          currentBead.stamp();
          currentLine.points.push(current);
        }
      } else {
        let startY = start.y < end.y ? start.y : end.y;
        let endY = start.y < end.y ? end.y : start.y;
        for (let i = startY; i <= endY; i = i + scale) {
          let doubleX = (i - b) / m;
          let intX = parseInt(doubleX);

          if (Math.abs(doubleX - intX) >= 0.5) {
            intX = doubleX >= 0.0 ? intX++ : intX--;
            currentLine.steep = true;
          }

          let current = {
            x: round(intX / 10) * 10,
            y: round(i / 10) * 10,
          };

          let currentBead = new Wampum(current, color, myCanvas);
          currentBead.stamp();
          currentLine.points.push(current);
        }
      }
    }

    return currentLine;
  }

  /** Creates a rectangle on the canvas
   *
   */
  rectangle() {
    let start = this._initPoint;
    let end = this._endPoint;

    for (
      let i = Math.min(start.y, end.y);
      i <= Math.max(start.y, end.y);
      i = i + scale
    ) {
      for (
        let j = Math.min(start.x, end.x);
        j <= Math.max(start.x, end.x);
        j = j + scale
      ) {
        let current = {
          x: j,
          y: i,
        };
        let currentBead = new Wampum(current, this._initColor, myCanvas);
        currentBead.stamp();
      }
    }
  }

  /** Creates a triangle on the canvas
   *
   */
  triangle() {
    let start = this._initPoint;
    let end = this._endPoint;
    let top = this._topPoint;

    let line1 = this.line(start, top);
    let line2 = this.line(end, top);
    let line3 = this.line(start, end);

    for (let i = -300; i <= 300; i = i + scale) {
      for (let j = -300; j <= 300; j = j + scale) {
        let current = {
          x: j,
          y: i,
        };
        let currentBead = new Wampum(current, this._initColor, myCanvas);
        if (isInside(start, top, end, current)) {
          currentBead.stamp();
        }
      }
    }
  }

  /** Creates a linear iteration on the canvas
   *
   */
  linearIteration() {
    let incY, posDir;
    let gradient = updateSpitter(this._initColor, this._iterColor, this._rows);

    if (this._direction == "+y") {
      incY = true;
      posDir = false;
    } else if (this._direction == "-y") {
      incY = true;
      posDir = true;
    } else if (this._direction == "+x") {
      incY = false;
      posDir = true;
    } else {
      incY = false;
      posDir = false;
    }

    let linePoints = [];
    let start = {
      x: this._initPoint.x,
      y: this._initPoint.y,
    };
    let startLength = this._linearRowLength;
    let inc1 = this._linearPreNum;
    let inc2 = this._linearPostNum;
    let rows = this._rows;

    if (incY) {
      let newX = start.x + startLength * scale - scale;

      for (let i = 0; i < rows; i++) {
        if (newX < start.x) {
          for (let j = newX; j <= start.x; j = j + scale) {
            if (j >= -500 && j <= 500 && start.y >= -500 && start.y <= 500) {
              let current = {
                x: j,
                y: start.y,
              };
              let currentBead = new Wampum(current, gradient[i], myCanvas);
              currentBead.stamp();
              linePoints.push(current);
            }
          }
        } else {
          for (let j = start.x; j <= newX; j = j + scale) {
            if (j >= -500 && j <= 500 && start.y >= -500 && start.y <= 500) {
              let current = {
                x: j,
                y: start.y,
              };
              let currentBead = new Wampum(current, gradient[i], myCanvas);
              currentBead.stamp();
              linePoints.push(current);
            }
          }
        }
        if (posDir) {
          start.y = start.y + scale;
        } else {
          start.y = start.y - scale;
        }
        start.x -= inc1 * scale;
        newX += inc2 * scale;
      }
    } else {
      let newY = start.y + startLength * scale - scale;
      for (let i = 0; i < rows; i++) {
        if (newY < start.y) {
          for (let j = newY; j <= start.y; j = j + scale) {
            if (start.x <= 500 && start.x >= -500 && j <= 500 && j >= -500) {
              let current = {
                x: start.x,
                y: j,
              };
              let currentBead = new Wampum(current, gradient[i], myCanvas);
              currentBead.stamp();
            }
          }
        } else {
          for (let j = start.y; j <= newY; j = j + scale) {
            if (start.x >= -500 && start.x <= 500 && j >= -500 && j <= 500) {
              let current = {
                x: start.x,
                y: j,
              };
              let currentBead = new Wampum(current, gradient[i], myCanvas);
              currentBead.stamp();
            }
          }
        }
        if (posDir) {
          start.x = start.x + scale;
        } else {
          start.x = start.x - scale;
        }
        start.y -= inc1 * scale;
        newY += inc2 * scale;
      }
    }
    return linePoints;
  }

  /** Creates a triangle iteration on the canvas
   *
   */
  triangleIteration() {
    let start = {
      x: this._initPoint.x,
      y: this._initPoint.y,
    };
    let steps = this._triRowGroup;
    let gradientCounter = 0;
    let exSteps = this._triRowPrePost;
    let cycles = this._rows;
    let direction = this._direction;

    let forward, main, back;
    let currentBead;
    let gradient = updateSpitter(
      this._initColor,
      this._iterColor,
      Math.ceil(cycles / steps)
    );
    let inc = 0;

    if (direction == "-y") {
      for (let i = 0; i < this._rows * scale; i = i + scale) {
        if (i % (this._triRowGroup * scale) == 0 && i != 0) {
          inc = inc + exSteps;
          gradientCounter++;
        }

        for (let j = 0; j <= inc; j++) {
          forward = {
            x: start.x + inc * scale,
            y: start.y + i,
          };
          back = {
            x: start.x - inc * scale,
            y: start.y + i,
          };
          main = {
            x: start.x,
            y: start.y + i,
          };
          if (inc == 0) {
            currentBead = new Wampum(main, gradient[gradientCounter], myCanvas);
            currentBead.stamp();
          } else {
            this.line(back, forward, gradient[gradientCounter]);
          }
        }
      }
    } else if (direction == "-x") {
      for (let i = 0; i < this._rows * scale; i = i + scale) {
        if (i % (this._triRowGroup * scale) == 0 && i != 0) {
          inc = inc + exSteps;
          gradientCounter++;
        }

        for (let j = 0; j <= inc; j++) {
          forward = {
            x: start.x - i,
            y: start.y + inc * scale,
          };
          back = {
            x: start.x - i,
            y: start.y - inc * scale,
          };
          main = {
            x: start.x - i,
            y: start.y,
          };
          if (inc == 0) {
            currentBead = new Wampum(main, gradient[gradientCounter], myCanvas);
            currentBead.stamp();
          } else {
            this.line(back, forward, gradient[gradientCounter]);
          }
        }
      }
    } else if (direction == "+y") {
      for (let i = 0; i < this._rows * scale; i = i + scale) {
        if (i % (this._triRowGroup * scale) == 0 && i != 0) {
          inc = inc + exSteps;
          gradientCounter++;
        }
        for (let j = 0; j <= inc; j++) {
          forward = {
            x: start.x + inc * scale,
            y: start.y - i,
          };
          back = {
            x: start.x - inc * scale,
            y: start.y - i,
          };
          main = {
            x: start.x,
            y: start.y - i,
          };
          if (inc == 0) {
            currentBead = new Wampum(main, gradient[gradientCounter], myCanvas);
            currentBead.stamp();
          } else {
            this.line(back, forward, gradient[gradientCounter]);
          }
        }
      }
    } else {
      for (let i = 0; i < this._rows * scale; i = i + scale) {
        if (i % (this._triRowGroup * scale) == 0 && i != 0) {
          inc = inc + exSteps;
          gradientCounter++;
        }

        for (let j = 0; j <= inc; j++) {
          forward = {
            x: start.x + i,
            y: start.y + inc * scale,
          };
          back = {
            x: start.x + i,
            y: start.y - inc * scale,
          };
          main = {
            x: start.x + i,
            y: start.y,
          };
          if (inc == 0) {
            currentBead = new Wampum(main, gradient[gradientCounter], myCanvas);
            currentBead.stamp();
          } else {
            this.line(back, forward, gradient[gradientCounter]);
          }
        }
      }
    }
  }

  /** Based on the pattern name of the curren bead, creates the pattern
   *
   */
  displayBeads() {
    if (this._pattern == "point") {
      this.stamp();
    } else if (this._pattern == "line") {
      this.line();
    } else if (this._pattern == "rectangle") {
      this.rectangle();
    } else if (this._pattern == "triangle") {
      this.triangle();
    } else if (this._pattern == "linear-iteration") {
      this.linearIteration();
    } else if (this._pattern == "triangle-iteration") {
      this.triangleIteration();
    }
  }

  /** Sets the bead's entire params list for loading
   * @param {number} endPoint
   * @param {number} topPoint
   * @param {number} rows
   * @param {string} iterColor
   * @param {number} linearRowLength
   * @param {number} linearPreNum
   * @param {number} linearPostNum
   * @param {number} triRowGroup
   * @param {number} triRowPrePost
   * @param {string} direction
   */
  setAdditionalParams(
    endPoint,
    topPoint,
    rows,
    iterColor,
    linearRowLength,
    linearPreNum,
    linearPostNum,
    triRowGroup,
    triRowPrePost,
    direction
  ) {
    this._endPoint = {
      x: endPoint.x,
      y: endPoint.y,
    };
    this._topPoint = {
      x: topPoint.x,
      y: topPoint.y,
    };

    this._rows = rows;
    this._iterColor = iterColor;

    this._linearRowLength = linearRowLength;
    this._linearPreNum = linearPreNum;
    this._linearPostNum = linearPostNum;

    this._triRowGroup = triRowGroup;
    this._triRowPrePost = triRowPrePost;

    this._direction = direction;
  }

  /** Creates object for saving
   * @return {Object} a serialized version of this bead for saving
   */
  serialize() {
    return {
      initPoint: this._initPoint,
      initColor: this._initColor,
      endPoint: this._endPoint,
      topPoint: this._topPoint,
      rows: this._rows,
      iterColor: this._iterColor,
      linearRowLength: this._linearRowLength,
      linearPreNum: this._linearPreNum,
      linearPostNum: this._linearPostNum,
      triRowGroup: this._triRowGroup,
      triRowPrePost: this._triRowPrePost,
      direction: this._direction,
      pattern: this._pattern,
    };
  }
}

// Helper Functions

/** Calculates the area of a triangle given three points
 *
 * @param {Object} p1 Bead coordinates (x,y) for initPoint
 * @param {Object} p2 Bead coordinates (x,y) for topPoint
 * @param {Object} p3 Bead coordinates (x,y) for endPoint
 *
 * @return {number} The area of the triangle
 */
function triangleArea(p1, p2, p3) {
  return Math.abs(
    (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2.0
  );
}

/** Checks whether a point is inside or outside a triangle's area
 *
 * @param {Object} p1 Bead coordinates for initPoint
 * @param {Object} p2 Bead coordinates for topPoint
 * @param {Object} p3 Bead coordinates for endPoint
 * @param {Object} p  Bead coordinates for a given point
 *
 * @return{boolean} Returns if the given bead is within the triangle
 */
function isInside(p1, p2, p3, p) {
  let area = triangleArea(p1, p2, p3); //area of (init, top, end)
  let area1 = triangleArea(p, p2, p3); //area of (point, top, end)
  let area2 = triangleArea(p1, p, p3); //area of (init, point, end)
  let area3 = triangleArea(p1, p2, p); //area of (init, top, point)

  return area == area1 + area2 + area3; //
}

/**Rounding fix for negative numbers
 *
 * @param {number} v The number to round.
 *
 * @return {number} The number being rounded
 */
function round(v) {
  return (v >= 0 || -1) * Math.round(Math.abs(v));
}

/** Get's the type of color for iteration gradients
 *
 * source: https://codepen.io/BangEqual/pen/VLNowO
 *
 * @param{string} val Color value ('#ffffff)
 *
 * @return {string} The type of color value being passed (HEX/RGB/RGBA)
 *
 */
function getType(val) {
  if (val.indexOf("#") > -1) return "HEX";
  if (val.indexOf("rgb(") > -1) return "RGB";
  if (val.indexOf("rgba(") > -1) return "RGBA";
}

/** Process the value irrespective of representation type for the gradients
 *
 * source: https://codepen.io/BangEqual/pen/VLNowO
 *
 * @param{string} type Color type (HEX/RGB/RGBA)
 * @param{string} val Color value ('#ffffff)
 *
 * @return {array} ProcessValue returning the processed value based on type
 *
 */
function processValue(type, value) {
  switch (type) {
    case "HEX": {
      return processHEX(value);
    }
    case "RGB": {
      return processRGB(value);
    }
    case "RGBA": {
      return processRGB(value);
    }
  }
}

/** Return a workable RGB int array [r,g,b] from rgb/rgba representation
 *
 * source: https://codepen.io/BangEqual/pen/VLNow
 * @param{string} val Color value ('#ffffff)
 *
 * @return {array} Returning the processed value based on RGB
 *
 */
function processRGB(val) {
  var rgb = val.split("(")[1].split(")")[0].split(",");
  alert(rgb.toString());
  return [parseInt(rgb[0], 10), parseInt(rgb[1], 10), parseInt(rgb[2], 10)];
}

/** Return a workable RGB int array [r,g,b] from hex representation
 *
 * source: https://codepen.io/BangEqual/pen/VLNow
 * @param{string} val Color value
 *
 * @return {array} Returning the processed value based on HEX
 *
 */
function processHEX(val) {
  //does the hex contain extra char?
  var hex = val.length > 6 ? val.substr(1, val.length - 1) : val;
  // is it a six character hex?
  if (hex.length > 3) {
    //scrape out the numerics
    var r = hex.substr(0, 2);
    var g = hex.substr(2, 2);
    var b = hex.substr(4, 2);

    // if not six character hex,
    // then work as if its a three character hex
  } else {
    // just concat the pieces with themselves
    var r = hex.substr(0, 1) + hex.substr(0, 1);
    var g = hex.substr(1, 1) + hex.substr(1, 1);
    var b = hex.substr(2, 1) + hex.substr(2, 1);
  }
  // return our clean values
  return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)];
}

/** Creates array of colors stepping between two colors
 *
 * source: https://codepen.io/BangEqual/pen/VLNow
 * @param{string} val1El Initial Color
 * @param{string} val2E1 Iteration Color
 * @param{number} stepsEl Number of steps between the colors
 *
 * @return {array} Returning the list of colors stepping from the user's initColor to iterColor
 *
 */
function updateSpitter(val1El, val2El, stepsEl) {
  //attach start value
  var hasSpun = 0;
  var val1RGB = processValue(getType(val1El), val1El);
  var val2RGB = processValue(getType(val2El), val2El);
  var colors = [
    // somewhere to dump gradient
  ];
  // the pre element where we spit array to user
  var spitter = document.getElementById("spitter");

  //the number of steps in the gradient
  var stepsInt = parseInt(stepsEl - 2, 10);
  //the percentage representation of the step
  var stepsPerc = 100 / (stepsInt + 1);

  // diffs between two values
  var valClampRGB = [
    val2RGB[0] - val1RGB[0],
    val2RGB[1] - val1RGB[1],
    val2RGB[2] - val1RGB[2],
  ];

  // build the color array out with color steps
  for (var i = 0; i < stepsInt; i++) {
    var clampedR =
      valClampRGB[0] > 0
        ? pad(
            Math.round((valClampRGB[0] / 100) * (stepsPerc * (i + 1))).toString(
              16
            ),
            2
          )
        : pad(
            Math.round(
              val1RGB[0] + (valClampRGB[0] / 100) * (stepsPerc * (i + 1))
            ).toString(16),
            2
          );

    var clampedG =
      valClampRGB[1] > 0
        ? pad(
            Math.round((valClampRGB[1] / 100) * (stepsPerc * (i + 1))).toString(
              16
            ),
            2
          )
        : pad(
            Math.round(
              val1RGB[1] + (valClampRGB[1] / 100) * (stepsPerc * (i + 1))
            ).toString(16),
            2
          );

    var clampedB =
      valClampRGB[2] > 0
        ? pad(
            Math.round((valClampRGB[2] / 100) * (stepsPerc * (i + 1))).toString(
              16
            ),
            2
          )
        : pad(
            Math.round(
              val1RGB[2] + (valClampRGB[2] / 100) * (stepsPerc * (i + 1))
            ).toString(16),
            2
          );
    colors[i] = ["#", clampedR, clampedG, clampedB].join("");
  }
  colors.unshift(val1El);
  colors.push(val2El);
  return colors;
}

/** Padding function for splitterd
 * ==================================
 * source: http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
 */
function pad(n, width, z) {
  z = z || "0";
  n = n + "";
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

/**
 * Download a text string as a file
 * Adapted from
 * https://github.com/CSDTs/CSDT_Single_Page/blob/master/Rhythm%20Wheels/rhythm_wheels.js
 * @param {string} filename
 * @param {string} text
 */
function download(filename, text) {
  let element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

/**
 * Load a project into memory
 * @param {string} text a JSON string
 */
function loadFromJSON(text) {
  beads.length = 0;
  currBeadLength = -1;

  JSON.parse(text).forEach((obj) => {
    beads.push(new Wampum(obj.initPoint, obj.initColor, myCanvas, obj.pattern));
    ++currBeadLength;
    beads[currBeadLength].setAdditionalParams(
      obj.endPoint,
      obj.topPoint,
      obj.rows,
      obj.iterColor,
      obj.linearRowLength,
      obj.linearPreNum,
      obj.linearPostNum,
      obj.triRowGroup,
      obj.triRowPrePost,
      obj.direction
    );
  });

  for (var i = 0; i < beads.length; i++) {
    beads[i].displayBeads();
  }
  if (beads.length === 0) {
    // setInputsToDefaults();
  } else {
    // setParamsForBead(Beads[currBeadIndex]);
  }

  // loadCanvas();
  currBeadLength++;
  $("#loadingProject").modal("hide");
  updateCanavs();
}

function LightenColor(color, percent) {
  var num = parseInt(color, 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    B = ((num >> 8) & 0x00ff) + amt,
    G = (num & 0x0000ff) + amt;

  return (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (B < 255 ? (B < 1 ? 0 : B) : 255) * 0x100 +
    (G < 255 ? (G < 1 ? 0 : G) : 255)
  )
    .toString(16)
    .slice(1);
}

// JQuery Event Handlers
$("#clear-local").on("click", function () {
  clearCanvas();
});

$(".bead-img").on("click", (e) => {
  currentGoal = e.target.getAttribute("src");
  $("#goal-image").attr("src", currentGoal);
  $("#beadModal").modal("hide");
});

$("#myCanvas").on("mousemove", (e) => {
  updateCanavs();

  const ctx = myCanvas.getContext("2d");
  const x = e.offsetX - 2;
  const y = e.offsetY - 2;
  let currentX = ((x - myCanvas.width / 2) / scale).toFixed(0);
  currentX == -0 ? (currentX = 0) : currentX;
  let currentY = ((y - myCanvas.width / 2) / scale).toFixed(0) * -1;
  currentY == -0 ? (currentY = 0) : currentY;

  if (!showCoordinatesInCorner) {
    ctx.font = "12px Arial";

    if (!basketWeaving) {
      ctx.fillStyle = "#ffffff";
    } else {
      ctx.fillStyle = "#f8eac5";
    }

    ctx.fillRect(x - myCanvas.width / 2, y - myCanvas.width / 2 - 12, 45, 15);
    ctx.fillStyle = "#000000";
    ctx.fillText(
      "(" + currentX + "," + currentY + ")",
      x - myCanvas.width / 2,
      y - myCanvas.width / 2
    );
    mouseText = {
      x,
      y,
    };
    $("#showCoordinates").text("");
    $("#showCoordinates").removeClass("coordinate-backing");
  } else {
    $("#showCoordinates").text("[ x= " + currentX + ", y= " + currentY + "]");
    $("#showCoordinates").addClass("coordinate-backing");
  }
});

$("#save-local").click(() => {
  let name = $("#project-name").val();
  download(name + ".json", JSON.stringify(beads.map((b) => b.serialize())));
  $("#cloudSaving").modal("hide");
});

$("#load-local").on("change", (e) => {
  let file = e.target.files[0];
  if (!file) {
    return;
  }
  let reader = new FileReader();
  reader.onload = (e) => {
    loadFromJSON(e.target.result);
  };
  reader.readAsText(file);
  $("#cloudLoading").modal("hide");
});

$(".undo").click(() => {
  if (beads.length > 0) {
    let current = beads.pop();
    beadUndoBuffer[currBufferLength] = current;
    currBufferLength++;
    currBeadLength--;
    updateCanavs();
  } else {
    alert("There is nothing else you can undo");
  }
});

$("#redo").click(() => {
  if (beadUndoBuffer.length > 0) {
    let current = beadUndoBuffer.pop();
    beads[currBeadLength] = current;
    currBeadLength++;
    currBufferLength--;
    updateCanavs();
  } else {
    alert("There is nothing else you can redo");
  }
});

$("#print-file").click(() => {
  window.print();
});

$("#hideGrid").click(() => {
  hideGrid = !hideGrid;
  updateCanavs();
  $("#hideGrid").text(hideGrid ? "Show Grid" : "Hide Grid");
});

$("#showCoordinatesOption").click(() => {
  showCoordinatesInCorner = !showCoordinatesInCorner;
  updateCanavs();
  $("#showCoordinatesOption").text(
    showCoordinatesInCorner ? "XY Follow Me" : "XY Stay in Corner"
  );
});

$("#switchToWampum").click(() => {
  useWampum = !useWampum;
  updateCanavs();
  $("#switchToWampum").text(useWampum ? "Use Beads" : "Use Wampum");
});

// Creates the bead design / collects and sets user input
function createPoint() {
  const startX1 = parseFloat($("#start-x1").val());
  const startY1 = parseFloat($("#start-y1").val() * -1);
  const color = $("#color").val();

  let initPoint = {
    x: startX1 * scale,
    y: startY1 * scale,
  };

  beads[currBeadLength] = new Wampum(initPoint, color, myCanvas);
  beads[currBeadLength].stamp();
  currBeadLength++;
}

function createLine() {
  const startX1 = parseInt($("#start-x1").val());
  const startY1 = parseInt($("#start-y1").val() * -1);
  const startX2 = parseInt($("#start-x2").val());
  const startY2 = parseInt($("#start-y2").val() * -1);
  const color = $("#color").val();

  let initPoint = {
    x: startX1 * scale,
    y: startY1 * scale,
  };

  let endPoint = {
    x: startX2 * scale,
    y: startY2 * scale,
  };

  beads[currBeadLength] = new Wampum(initPoint, color, myCanvas);
  beads[currBeadLength].setEndPoint(endPoint);
  beads[currBeadLength].line();
  currBeadLength++;
}

function createRectangle() {
  const startX1 = parseFloat($("#start-x1").val());
  const startY1 = parseFloat($("#start-y1").val() * -1);
  const startX2 = parseFloat($("#start-x2").val());
  const startY2 = parseFloat($("#start-y2").val() * -1);
  const color = $("#color").val();

  let initPoint = {
    x: startX1 * scale,
    y: startY1 * scale,
  };

  let endPoint = {
    x: startX2 * scale,
    y: startY2 * scale,
  };

  beads[currBeadLength] = new Wampum(initPoint, color, myCanvas);
  beads[currBeadLength].setEndPoint(endPoint);
  beads[currBeadLength].rectangle();
  currBeadLength++;
}

function createTriangle() {
  const startX1 = parseInt($("#start-x1").val());
  const startY1 = parseInt($("#start-y1").val() * -1);
  const startX2 = parseInt($("#start-x2").val());
  const startY2 = parseInt($("#start-y2").val() * -1);
  const startX3 = parseInt($("#start-x3").val());
  const startY3 = parseInt($("#start-y3").val() * -1);
  const color = $("#color").val();

  let initPoint = {
    x: startX1 * scale,
    y: startY1 * scale,
  };

  let endPoint = {
    x: startX3 * scale,
    y: startY3 * scale,
  };

  let topPoint = {
    x: startX2 * scale,
    y: startY2 * scale,
  };

  beads[currBeadLength] = new Wampum(initPoint, color, myCanvas);
  beads[currBeadLength].setTriangle(topPoint, endPoint);
  beads[currBeadLength].triangle();
  currBeadLength++;
}

function createLinearIteration() {
  const x = parseFloat($("#x1-iter").val());
  const y = parseFloat($("#y1-iter").val() * -1);

  const color1 = $("#color").val();
  const color2 = $("#color2").val();

  const rows = parseInt($("#rows").val());

  const rowLength = parseInt($("#row-length").val());

  const startNum = parseInt($("#first-num").val());
  const endNum = parseInt($("#second-num").val());
  const direction = $("#linear-iter-form input:radio:checked").val();

  let initPoint = {
    x: x * scale,
    y: y * scale,
  };
  beads[currBeadLength] = new Wampum(initPoint, color1, myCanvas);
  beads[currBeadLength].setLinearIteration(
    rowLength,
    startNum,
    endNum,
    rows,
    direction,
    color2
  );
  beads[currBeadLength].linearIteration();
  currBeadLength++;
}

function createTriangleIteration() {
  const x = parseInt($("#x1-iterT").val());
  const y = parseInt($("#y1-iterT").val() * -1);

  const color1 = $("#color").val();
  const color2 = $("#color2").val();

  const rows = parseInt($("#rows-tri").val());

  const group = parseInt($("#grouping").val());

  const num = parseInt($("#num").val());

  const direction = $("#triangle-iter-form input:radio:checked").val();

  let initPoint = {
    x: x * scale,
    y: y * scale,
  };

  beads[currBeadLength] = new Wampum(initPoint, color1, myCanvas);
  beads[currBeadLength].setTriangleIteration(
    group,
    num,
    rows,
    direction,
    color2
  );
  beads[currBeadLength].triangleIteration();
  currBeadLength++;
}

function create() {
  switch (beadDesign) {
    case "point":
      createPoint();
      break;
    case "line":
      createLine();
      break;
    case "rectangle":
      createRectangle();
      break;
    case "triangle":
      createTriangle();
      break;
    case "linear-iteration":
      createLinearIteration();
      break;
    case "triangle-iteration":
      createTriangleIteration();
      break;
    default:
      createPoint();
  }
}

/** Creates the grid based on global scaling and window size
 *
 */
function createGrid() {
  const ctx = myCanvas.getContext("2d");

  var grid_size = scale;

  var x_axis_starting_point = {
    number: 1,
    suffix: "",
  };
  var y_axis_starting_point = {
    number: 1,
    suffix: "",
  };

  var canvas_width = Math.floor(myCanvas.width / 100) * 100;
  var canvas_height = Math.floor(myCanvas.width / 100) * 100;

  var num_lines_x = Math.floor(canvas_height / grid_size);
  var num_lines_y = Math.floor(canvas_width / grid_size);

  var adjust_x = (myCanvas.height % 100) / 2;
  var adjust_y = (myCanvas.width % 100) / 2;

  var x_axis_distance_grid_lines = parseInt(num_lines_x / 2);
  var y_axis_distance_grid_lines = parseInt(num_lines_y / 2);

  ctx.translate(adjust_x, adjust_y);

  // Draw grid lines along X-axis
  for (var i = 0; i <= num_lines_x; i++) {
    ctx.beginPath();
    ctx.lineWidth = 1;

    // If line represents X-axis draw in different color
    if (i == x_axis_distance_grid_lines) ctx.strokeStyle = "#000000";
    else ctx.strokeStyle = gridColor;

    if (i == num_lines_x) {
      ctx.moveTo(0, grid_size * i);

      ctx.lineTo(canvas_width, grid_size * i);
    } else {
      ctx.moveTo(0, grid_size * i + 0.5);

      ctx.lineTo(canvas_width, grid_size * i + 0.5);
    }
    ctx.stroke();
  }

  // Draw grid lines along Y-axis
  for (i = 0; i <= num_lines_y; i++) {
    ctx.beginPath();
    ctx.lineWidth = 1;

    // If line represents X-axis draw in different color
    if (i == y_axis_distance_grid_lines) ctx.strokeStyle = "#000000";
    else ctx.strokeStyle = gridColor;

    if (i == num_lines_y) {
      ctx.moveTo(grid_size * i, 0);
      ctx.lineTo(grid_size * i, canvas_height);
    } else {
      ctx.moveTo(grid_size * i + 0.5, 0);
      ctx.lineTo(grid_size * i + 0.5, canvas_height);
    }
    ctx.stroke();
  }

  // Translate to the new origin. Now Y-axis of the canvas is opposite to the Y-axis of the graph. So the y-coordinate of each element will be negative of the actual
  ctx.translate(
    y_axis_distance_grid_lines * grid_size,
    x_axis_distance_grid_lines * grid_size
  );

  // Ticks marks along the positive X-axis
  for (i = 5; i < num_lines_y - y_axis_distance_grid_lines; i = i + 5) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";

    // Draw a tick mark 6px long (-3 to 3)
    ctx.moveTo(grid_size * i + 0.5, -3);
    ctx.lineTo(grid_size * i + 0.5, 3);
    ctx.stroke();

    // Text value at that point
    ctx.font = "9px Arial";
    ctx.textAlign = "start";
    ctx.fillText(
      x_axis_starting_point.number * i + x_axis_starting_point.suffix,
      grid_size * i - 2,
      15
    );
  }

  // Ticks marks along the negative X-axis
  for (i = 5; i < y_axis_distance_grid_lines; i = i + 5) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";

    // Draw a tick mark 6px long (-3 to 3)
    ctx.moveTo(-grid_size * i + 0.5, -3);
    ctx.lineTo(-grid_size * i + 0.5, 3);
    ctx.stroke();

    // Text value at that point
    ctx.font = "9px Arial";
    ctx.textAlign = "end";
    ctx.fillText(
      -x_axis_starting_point.number * i + x_axis_starting_point.suffix,
      -grid_size * i + 3,
      15
    );
  }

  // Ticks marks along the positive Y-axis
  // Positive Y-axis of graph is negative Y-axis of the canvas
  for (i = 5; i < num_lines_x - x_axis_distance_grid_lines; i = i + 5) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";

    // Draw a tick mark 6px long (-3 to 3)
    ctx.moveTo(-3, grid_size * i + 0.5);
    ctx.lineTo(3, grid_size * i + 0.5);
    ctx.stroke();

    // Text value at that point
    ctx.font = "9px Arial";
    ctx.textAlign = "start";
    ctx.fillText(
      -y_axis_starting_point.number * i + y_axis_starting_point.suffix,
      8,
      grid_size * i + 3
    );
  }

  // Ticks marks along the negative Y-axis
  // Negative Y-axis of graph is positive Y-axis of the canvas
  for (i = 5; i < x_axis_distance_grid_lines; i = i + 5) {
    ctx.beginPath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";

    // Draw a tick mark 6px long (-3 to 3)
    ctx.moveTo(-3, -grid_size * i + 0.5);
    ctx.lineTo(3, -grid_size * i + 0.5);
    ctx.stroke();

    // Text value at that point
    ctx.font = "9px Arial";
    ctx.textAlign = "start";
    ctx.fillText(
      y_axis_starting_point.number * i + y_axis_starting_point.suffix,
      8,
      -grid_size * i + 3
    );
  }
}

/** Catches if user resizes the screen
 *
 */
function updateCanavs() {
  const ctx = myCanvas.getContext("2d");

  if (basketWeaving) {
    $("#myCanvas").css("background-color", "#f8eac5");
  } else {
    $("#myCanvas").css("background-color", "#ffffff");
  }
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);

  // Dynamically resizes canvas and data form
  if ($(window).width() < 992 && $("#canvas-container").hasClass("col-6")) {
    $("#canvas-container").toggleClass("col-6 col-12");
    $("#data-container").toggleClass("col-6 col-12");
  } else if (
    $(window).width() >= 992 &&
    $("#canvas-container").hasClass("col-12")
  ) {
    $("#canvas-container").toggleClass("col-12 col-6");
    $("#data-container").toggleClass("col-12 col-6");
  }

  myCanvas.width = parseInt(window.getComputedStyle(myCanvas).width) - 4;
  myCanvas.height = myCanvas.width;

  // let beadWidth = myCanvas.width / 2;

  if (!hideGrid) {
    createGrid();
    // expandGrid();
  } else {
    var canvas_width = Math.floor(myCanvas.width / 100) * 100;
    var canvas_height = Math.floor(myCanvas.width / 100) * 100;

    var num_lines_x = Math.floor(canvas_height / scale);
    var num_lines_y = Math.floor(canvas_width / scale);

    var adjust_x = (myCanvas.height % 100) / 2;
    var adjust_y = (myCanvas.width % 100) / 2;

    var x_axis_distance_grid_lines = num_lines_x / 2;
    var y_axis_distance_grid_lines = num_lines_y / 2;
    ctx.translate(adjust_x, adjust_y);
    ctx.translate(
      y_axis_distance_grid_lines * scale,
      x_axis_distance_grid_lines * scale
    );
  }

  for (var i = 0; i < beads.length; i++) {
    beads[i].displayBeads();
  }
}

/** Clears all beads from the canvas.
 *
 */
function clearCanvas() {
  const ctx = myCanvas.getContext("2d");
  if (confirm("WARNING, this will delete all weaves")) {
    ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);

    // Dynamically resizes canvas and data form
    if ($(window).width() < 992 && $("#canvas-container").hasClass("col-6")) {
      $("#canvas-container").toggleClass("col-6 col-12");
      $("#data-container").toggleClass("col-6 col-12");
    } else if (
      $(window).width() >= 992 &&
      $("#canvas-container").hasClass("col-12")
    ) {
      $("#canvas-container").toggleClass("col-12 col-6");
      $("#data-container").toggleClass("col-12 col-6");
    }

    myCanvas.width = parseInt(window.getComputedStyle(myCanvas).width) - 2;
    myCanvas.height = myCanvas.width;

    createGrid();
    beads = [];
    currBeadLength = 0;
  }
}

/** Sets the bead pattern and sets up the gui based on the user's choice
 *
 * @param {number} val The pattern to create for the current bead.
 */
function selectBeadPattern(val) {
  beadDesign = val;
  let url = "./img/" + val + ".png";
  $("#pattern-image").attr("src", url);
  $("#third-point").hide();
  $("#second-point").hide();
  $("#color2").hide();
  $("#init-form").hide();

  if (val == "linear-iteration") {
    $("#linear-iter-form").show();
    $("#init-form").hide();
    $("#color2").show();
  } else {
    $("#linear-iter-form").hide();
    $("#init-form").show();
  }

  if (val == "triangle-iteration") {
    $("#triangle-iter-form").show();
    $("#init-form").hide();
    $("#color2").show();
  } else {
    $("#triangle-iter-form").hide();
    $("#init-form").show();
  }

  if (val == "rectangle" || val == "line") {
    $("#second-point").show();
  }
  if (val == "triangle") {
    $("#second-point").show();
    $("#third-point").show();
  }

  if (
    val == "point" ||
    val == "line" ||
    val == "rectangle" ||
    val == "triangle"
  ) {
    $("#init-form").show();
  } else {
    $("#init-form").hide();
  }
  setDefaultParams();
}

/** Set's the default values for each bead pattern
 *
 */
function setDefaultParams() {
  if (beadDesign == "point") {
    $("#start-x1").val(2).attr("placeholder", 2);
    $("#start-y1").val(2).attr("placeholder", 2);
  } else if (beadDesign == "line") {
    $("#start-x1").val(-3).attr("placeholder", -3);
    $("#start-y1").val(-3).attr("placeholder", -3);
    $("#start-x2").val(3).attr("placeholder", 3);
    $("#start-y2").val(3).attr("placeholder", 3);
  } else if (beadDesign == "rectangle") {
    $("#start-x1").val(-3).attr("placeholder", -3);
    $("#start-y1").val(-3).attr("placeholder", -3);
    $("#start-x2").val(3).attr("placeholder", 3);
    $("#start-y2").val(3).attr("placeholder", 3);
  } else if (beadDesign == "triangle") {
    $("#start-x1").val(-3).attr("placeholder", -3);
    $("#start-y1").val(1).attr("placeholder", 1);
    $("#start-x2").val(0).attr("placeholder", 0);
    $("#start-y2").val(4).attr("placeholder", 4);
    $("#start-x3").val(3).attr("placeholder", 3);
    $("#start-y3").val(1).attr("placeholder", 1);
  } else if (beadDesign == "linear-iteration") {
    $("#x1-iter").val(-3).attr("placeholder", -3);
    $("#y1-iter").val(1).attr("placeholder", 1);

    $("#rows").val(4).attr("placeholder", 4);

    $("#row-length").val(7).attr("placeholder", 7);

    $("#first-num").val(-1).attr("placeholder", -1);
    $("#second-num").val(1).attr("placeholder", 1);
    $("#pos-y").prop("checked", true);
  } else if (beadDesign == "triangle-iteration") {
    $("#x1-iterT").val(0).attr("placeholder", 0);
    $("#y1-iterT").val(0).attr("placeholder", 0);

    $("#rows-tri").val(9).attr("placeholder", 9);
    $("#grouping").val(3).attr("placeholder", 3);
    $("#num").val(1).attr("placeholder", 1);
    $("#neg-y2").prop("checked", true);
  }
}

function setToWeaver() {
  basketWeaving = true;
  gridColor = "#b3a683";
  updateCanavs();
}

function setToRug() {
  navajoKnots = true;
  // gridColor ='#b3a683';
  updateCanavs();
}

function initOnline() {
  // Check for login
  checkUserLogin();
  checkProjectStatus();
  // Check for config
}

let checkUserLogin = function () {
  let success = function (data) {
    if (data.id === null) {
      // User is not logged in
      globals.userID = -1;
      flags.loggedIn = false;
      updateUserGUI();
      getUserProjects();
    } else {
      // User is logged in
      globals.userID = data.id;
      globals.userName = data.username;
      flags.loggedIn = true;
      updateUserGUI();
      getUserProjects();
    }
  };
  let error = function (data) {
    console.error(data);
  };

  cloud.getUser(success, error);
};

let checkProjectStatus = function () {
  // load project
  try {
    if (Number.isInteger(Number(config.project.id))) {
      loadFromCloud(config.project.id);
      updateURL(config.project.id);
    }
  } catch (err) {}
};

let updateURL = function (URL) {
  if (window.history !== undefined && window.history.pushState !== undefined) {
    window.history.pushState({}, "", "/projects/" + URL + "/run");
  }
};

// Cloud saving
// Helper function, kindly donated by http://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata
function dataURItoBlob(dataURI, type) {
  var binary;
  if (dataURI.split(",")[0].indexOf("base64") >= 0)
    binary = atob(dataURI.split(",")[1]);
  else binary = unescape(dataURI.split(",")[1]);
  //var binary = atob(dataURI.split(',')[1]);
  var array = [];
  for (var i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], {
    type: type,
  });
}
let dataToBlob = function (data, type) {
  let data_str;
  if (type.includes("image")) {
    data_str = data.toDataURL();
    return dataURItoBlob(data_str, "image/png");
  } else {
    data_str = serializeData(data);
    return new Blob([data_str], {
      type: "application/json",
    });
  }
};

let serializeData = function (data) {
  return JSON.stringify(data.map((b) => b.serialize()));
};

// Load From Cloud

let loadFromCloud = function (id) {
  cloud.getCSRFToken();
  updateModal(constants.loadModal, false);
  updateAlert("Loading project...");

  let success = function (data) {
    globals.projectID = id;
    loadFromJSON(data);
    updateURL(globals.projectID);
    updateAlert("Project Loaded!", true, 1000);
  };

  let error = function (data) {
    console.error(data);
    updateAlert("An error has occured. Please try again.", true, 2000);
  };

  cloud.loadProject(id, success, error);
};

//Save to Cloud
let saveToCloud = function () {
  cloud.getCSRFToken();

  updateModal(constants.saveModal, false);
  updateAlert("Saving project...");

  let dataID_;
  let imgID_ = 1000;
  let applicationID_ = applicationID;
  let projectName_ = $(constants.projectName).val();

  globals.projectName = projectName_;

  let projectData = dataToBlob(globals.dataSource, "application/json");
  let imageData = dataToBlob(globals.imageSource, "image/png");

  let projectForm = new FormData();
  let imageForm = new FormData();

  projectForm.append("file", projectData);
  imageForm.append("file", imageData);

  let successImageSave = function (data) {
    imgID_ = data.id;

    let successDataSave = function (data) {
      dataID_ = data.id;

      let success = function (data) {
        globals.projectID = data.id;
        updateURL(globals.projectID);
        updateAlert("Project Saved!", true, 2000);
        getUserProjects();
      };

      let error = function (data) {
        updateAlert("An error has occured. Please try again.", true, 2000);
      };

      if (flags.newProject) {
        cloud.createProject(
          projectName_,
          applicationID_,
          dataID_,
          imgID_,
          success,
          error
        );
      } else {
        cloud.updateProject(
          globals.projectID,
          projectName_,
          applicationID_,
          dataID_,
          imgID_,
          success,
          error
        );
      }
    };
    let errorDataSave = function (data) {
      console.error("Error with data save.");
      console.error(data);
    };

    cloud.saveFile(projectForm, successDataSave, errorDataSave);
  };

  let errorImageSave = function (data) {
    console.error("Error with image save.");
    console.error(data);
  };

  cloud.saveFile(imageForm, successImageSave, errorImageSave);
};

// Project Listing
let getUserProjects = function () {
  let err = function (data) {
    // No projects are available for user
    // console.error(data);
    updateUserProjects([]);
  };
  let suc = function (data) {
    // Update the list of projects
    updateUserProjects(data);
  };

  cloud.listProject(globals.userID, suc, err);
};

let updateUserProjects = function (projects) {
  let projectListDiv = document.getElementById(constants.projectList);

  if (projects.length == 0) {
    projectListDiv.innerHTML = "<option selected>Choose...</option>";
  } else {
    projectListDiv.innerHTML = "";

    // projects will be sorted first here
    projects.forEach(function (project) {
      if (project.application == applicationID) {
        let projectDiv = document.createElement("option");
        projectDiv.innerText = project.name;
        projectListDiv.appendChild(projectDiv);

        projectDiv.value = project.id;
        if (projectDiv.value == globals.projectID) {
          let att = document.createAttribute("selected");
          projectDiv.setAttributeNode(att);
        }

        projectDiv.addEventListener("click", function (e) {
          loadFromCloud(project.id);
        });
      }
    });

    $("<option selected>Choose...</option>").prependTo(
      $("#" + constants.projectList)
    );
  }
};

// Updates
let updateAlert = function (message, timeOut = false, timeLength = 1000) {
  $(constants.alertMessageText).html(message);
  if (!timeOut) {
    $(constants.alertMessage).modal("show");
  } else {
    setTimeout(function () {
      $(constants.alertMessage).modal("hide");
    }, timeLength);
  }
};

let updateModal = function (modal, state, timeOut = false, timeLength = 1000) {
  if (!timeOut) {
    $(modal).modal(state ? "show" : "hide");
  } else {
    setTimeout(function () {
      $(modal).modal(state ? "show" : "hide");
    }, timeLength);
  }
};

let updateUserGUI = function () {
  let base = globals.userName == "" ? "LOGIN" : globals.userName.toUpperCase();
  let loginURL = globals.userID != -1 ? "/users/" + globals.userID : "";

  //Updates the login button
  $(constants.loginButton).html("<i class='fas fa-user'></i>&nbsp; " + base);

  // Update login button functionality
  if (flags.loggedIn) {
    $(constants.loginButton).attr("href", loginURL);
    $(constants.loginButton).attr("data-toggle", "");
    $(constants.loginButton).attr("data-target", "");
  } else {
    $(constants.loginButton).removeAttr("href");
    $(constants.loginButton).attr("data-toggle", "modal");
    $(constants.loginButton).attr("data-target", constants.loginModal);
  }

  // Updates the logout button
  $(constants.logoutButton).attr("hidden", !flags.loggedIn);

  // If the user is not logged in, this button appears to log the user in before saving to cloud
  $(constants.loginToSaveButton).attr("hidden", flags.loggedIn);
  $(constants.saveToCloudButton).attr("hidden", !flags.loggedIn);

  // If the user is not logged in, the projects are disabled and the login to load button appears
  $(constants.loginToLoadButton).attr("hidden", flags.loggedIn);
  $("#" + constants.projectList).attr("disabled", !flags.loggedIn);
  $(constants.logoutButton).on("click", function () {
    logout();
  });
};

// Login Logout

let submitLogin = function (cb) {
  cloud.getCSRFToken();
  let username = $(constants.userName).val();
  let password = $(constants.userPass).val();

  let success = function (data) {
    globals.userID = data.id;
    globals.userName = data.username;
    return cb(null, {
      success: true,
    });
  };

  let error = function (data) {
    return cb(data, {
      success: false,
    });
  };

  cloud.login(
    username,
    password,
    function (data) {
      cloud.getUser(success, error);
    },
    error
  );
};

let login = (this.login = function () {
  $(constants.loginModal).modal("hide");
  updateAlert("Logging you in...");

  submitLogin(function (err0, res0) {
    if (!err0) {
      flags.loggedIn = true;
      getUserProjects();
      updateAlert("You are now logged in!", true, 1000);
      updateUserGUI();
    } else {
      flags.loggedIn = false;
      console.error(err0);
      updateAlert(
        "Incorrect username or password. Please try again.",
        true,
        2000
      );
      updateModal(constants.loginModal, true, true, 2000);
    }
  });
});

let logout = (this.logout = function () {
  cloud.getCSRFToken();

  updateAlert("Logging you out...");

  let signOut = function () {
    let succ0 = function (data) {
      globals.userID = -1;
      globals.userName = "";
      globals.projectID = "";
      flags.loggedIn = false;
      updateAlert("Successfully Logged Out!", true, 1000);
      updateUserGUI();
    };
    let err0 = function (data) {
      updateAlert("Error signing you out. Please try again.", true, 2000);
      console.error(data);
    };
    cloud.logout(succ0, err0);
  };

  signOut();
});

initOnline();
updateCanavs();
selectBeadPattern("point"); //Set's point by default
