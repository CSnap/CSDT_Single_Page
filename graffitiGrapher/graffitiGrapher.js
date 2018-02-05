// Setting up the graphs
const graph = document.getElementById('graph');
const drawing = document.getElementById('drawing');
const background = document.getElementById('background');

// Setting up the form itself
const makeShapeBtn = document.getElementById('makeShapeBtn');
const shapeForm = document.getElementById('shapeForm');
const listForm = document.getElementById('listForm');
const ctrlPtConfirm = document.getElementById('ctrlPtConfirm');
const rmvShapeBtn = document.getElementById('rmvShapeBtn');
const goalImg = document.getElementById('goalImg');
const save = document.getElementById('save');

// Set up for changing the background
const prevBackground = document.getElementById('prevBackground');
const nextBackground = document.getElementById('nextBackground');
let imgIndex = 0;
const imageList = [
  'Image0.bmp',
  'Image1.bmp',
  'Image2.bmp',
  'Image3.bmp',
  'Image4.bmp',
  'Image5.bmp',
  'Image6.bmp',
  'Image7.bmp',
  'Image8.bmp',
  'Image9.bmp',
  'Image10.bmp',
];

// The interactive outline
if (graph.getContext) {
  const graphContext = graph.getContext('2d');
  makeGrid(graphContext);

  const backgroundContext = background.getContext('2d');
  addBackground(backgroundContext);

  const state = new CanvasState(drawing);
  ctrlPtConfirm.addEventListener('click', function() {
    shape = new Shape(regularShapeCreator(100, ctrlPts.value));
    state.addShape(shape);
    state.clearShapeForm();
    state.makeShapeForm(shape, state);
  });

  prevBackground.addEventListener('click', function() {
    changeBackground('prev');
    addBackground(backgroundContext);
  });

  nextBackground.addEventListener('click', function() {
    changeBackground('next');
    addBackground(backgroundContext);
  });

  makeShapeBtn.addEventListener('click', function() {});

  rmvShapeBtn.addEventListener('click', function() {
    state.removeShape(state.selection);
  });
  goalImg.addEventListener('mouseenter', function(event) {
    background.style = '';
  });
  goalImg.addEventListener('mouseleave', function(event) {
    background.style = 'display: none;';
  });
  document.getElementById('files').addEventListener('change', function(event) {
    state.loadLocally(event);
  }, false);
  10;
  save.addEventListener('click', function() {
    state.saveLocally();
  });
} else {
  console.log('There is nothing for you here.');
}
/**
 * Creates the grid pattern on the screen
 * @param {context} ctx - The context onto which we are drawing
 */
function makeGrid(ctx) {
  ctx.lineWidth = .5;
  ctx.strokeStyle = 'rgb(211, 211, 211)';
  ctx.beginPath();
  for (i = 0; i <= graph.width; i += 20) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, graph.height);
    ctx.stroke();
  }
  for (i = 0; i <= graph.height; i += 20) {
    ctx.moveTo(0, i);
    ctx.lineTo(graph.width, i);
    ctx.stroke();
  }
  ctx.closePath();
};

/**
 * Changes the image being used as a background
 * @param {string} direction - Takes string indicating the direction the images
 *                             will cycle through
 * TODO: Expand to the smaller viewing screen
 */
function changeBackground(direction) {
  if (direction === 'prev') {
    imgIndex = (imgIndex + imageList.length - 1) % (imageList.length);
  } else {
    imgIndex = (imgIndex + imageList.length + 1) % (imageList.length);
  }
}

/**
 * Adds the background specified by fx.changeBackground to the context
 * @param {context} ctx - The context on which the background is being drawn
 */
function addBackground(ctx) {
  ctx.globalAlpha = 0.2;
  baseImage = new Image();
  baseImage.src = imageList[imgIndex];
  baseImage.onload = function() {
    let ratio;
    if (this.height > this.width) {
      ratio = this.height / background.height;
    } else {
      ratio = this.width / background.width;
    }
    this.width = this.width / ratio;
    this.height = this.height / ratio;
    let xOffset = (background.width - this.width) / 2;
    let yOffset = (background.height - this.height) / 2;
    ctx.clearRect(0, 0, background.width, background.height);
    ctx.drawImage(baseImage, xOffset, yOffset, this.width, this.height);
  };
  goalImg.src = imageList[imgIndex];
};

/** returns values for the points of a regular shape given a incribed diam and
# of verticies
@param {int} diam - the inscribed diameter of the shape
@param {int} pts - the number of verticies
@return {Points[]} the points of the regular shape
*/
function regularShapeCreator(diam, pts) {
  let coordList = [];
  let angle = 0;
  let angleInc = Math.PI * 2 / pts;
  for (let i = 0; i < pts; i++) {
    coordList.push(new Point(Math.cos(angle) * diam + 200,
      Math.sin(angle) * diam + 200));
    angle += angleInc;
  }
  return coordList;
}

/**
 * Creates a prototype for the state of all "objects" on the canvas
 * @constructor
 * @param {canvas} canvas - The html canvas object we will be drawing on
 */
function CanvasState(canvas) {
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext('2d');

  // State Changes
  this.nodraw = true;
  this.shapes = [];
  this.dragging = false;
  this.distorting = false;
  this.selection = null;
  this.pointSelected = null;
  this.dragoffx = 0;
  this.dragoffy = 0;
  this.interval = 30;

  const myState = this; // Closure

  // Selecting a shape
  canvas.addEventListener('mousedown', function(e) {
    let mouse = myState.getMouse(e);
    let mx = mouse.x;
    let my = mouse.y;
    let shapes = myState.shapes;
    let len = shapes.length;
    for (let i = 0; i < len; i++) {
      myState.selection = shapes[i];
      for (let j = 0; j < shapes[i].coordList.length; j++) {
        if (shapes[i].coordList[j].contains(mx, my)) {
          let point = shapes[i].coordList[j];
          myState.dragoffx = mx - point.x;
          myState.dragoffy = my - point.y;
          myState.distorting = true;
          myState.pointSelected = j;
          return;
        }
      }
      if (shapes[i].contains(mx, my)) {
        let mySelection = shapes[i];
        myState.dragoffx = mx - mySelection.minX;
        myState.dragoffy = my - mySelection.minY;
        myState.dragging = true;
        myState.selection = mySelection;
        myState.nodraw = false;
        myState.clearShapeForm();
        myState.makeShapeForm(mySelection, myState);
        return;
      }
    }
    if (myState.selection) {
      myState.selection = null;
      myState.nodraw = false;
    }
  }, true);

  // Dragging a shape
  canvas.addEventListener('mousemove', function(e) {
    let mouse = myState.getMouse(e);
    let shape = myState.selection;
    if (myState.dragging) {
      for (let i = 0; i < shape.coordList.length; i++) {
        let point = shape.coordList[i];
        point.update(point.x + (mouse.x - shape.minX - myState.dragoffx),
          point.y + (mouse.y - shape.minY - myState.dragoffy));
      }
      myState.dragoffx = mouse.x - shape.minX;
      myState.dragoffy = mouse.y - shape.minY;
      myState.nodraw = false;
      myState.updateShapeForm(shape);
    } else if (myState.distorting) {
      let point = shape.coordList[myState.pointSelected];
      point.update(point.x + (myState.dragoffx),
        point.y + (myState.dragoffy));
      myState.dragoffx = mouse.x - point.x;
      myState.dragoffy = mouse.y - point.y;
      myState.updateShapeForm(shape);
      myState.nodraw = false;
    }
  }, true); // WHAT DOES THIS TRUE MEAN??

  // Releasing a selected shape
  canvas.addEventListener('mouseup', function(e) {
    let shape = myState.selection;
    myState.dragging = false;
    myState.distorting = false;
    myState.dragoffx = 0;
    myState.dragoffy = 0;
    myState.pointSelected = null;
    shape.getBounds();
    shape.updateListCanvas();
  }, true);

  setInterval(function() {
    myState.draw();
  }, myState.interval);
}

CanvasState.prototype.addShape = function(shape) {
  this.shapes.push(shape);
  this.nodraw = false;
  this.addToList(shape);
};

CanvasState.prototype.addToList = function(shape, num) {
  div = document.createElement('div');
  div.setAttribute('class', 'row');
  div.setAttribute('style', 'display: inline;');
  radio = document.createElement('input');
  radio.setAttribute('type', 'radio');
  radio.setAttribute('value', 'radio');
  radio.setAttribute('id', 'test');
  radio.setAttribute('value', '1');
  label = document.createElement('label');
  label.setAttribute('for', 'test');
  img = document.createElement('canvas');
  img.setAttribute('width', '100');
  img.setAttribute('height', '100');
  description = document.createTextNode('thisIsAShape');
  label.appendChild(img);
  label.appendChild(description);
  div.appendChild(radio);
  div.appendChild(label);
  listForm.appendChild(div);
  shape.listItem = div;
  shape.updateListCanvas();
};

CanvasState.prototype.removeFromList = function(shape) {
  listForm.removeChild(shape.listItem);
};

CanvasState.prototype.removeShape = function(shape) {
  const index = this.shapes.indexOf(shape);
  this.shapes.splice(index, 1);
  this.nodraw = false;
  this.clear();
  this.removeFromList(shape);
};

CanvasState.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.width, this.height);
};

CanvasState.prototype.draw = function() {
  if (!this.nodraw) {
    const ctx = this.ctx;
    const shapes = this.shapes;
    this.clear();

    const len = shapes.length;
    for (let i = 0; i < len; i++) {
      let shape = shapes[i];
      if (shape.maxX < 0 || shape.minX > this.width ||
        shape.maxY < 0 || shape.minY > this.height) {
        continue;
      }
      shape.draw(ctx);
    }
  }
  this.nodraw = true;
};

CanvasState.prototype.getMouse = function(e) {
  const element = this.canvas;
  mx = e.pageX - element.offsetLeft;
  my = e.pageY - element.offsetTop;

  return {
    x: mx,
    y: my,
  };
};

CanvasState.prototype.saveLocally = function() {
  let blob = new Blob([JSON.stringify(this.shapes, null, 2)], {
    type: 'application/json',
  });
  saveAs(blob, 'text.json', false);
};

CanvasState.prototype.loadLocally = function(evt) {
  let file = evt.target.files[0];
  if (!file.type.match('application/json')) {
    console.log('bad file type');
    return;
  }

  let reader = new FileReader();
  let myself = this;
  reader.onload = (function(theFile) {
    return function(e) {
      let newList = JSON.parse(e.target.result);
      let oldList = myself.shapes;
      for (let i = 0; i < oldList.length; i++) {
        myself.removeShape(oldList[i]);
      }
      for (let i = 0; i < newList.length; i++) {
        let coords = [];
        let shape = newList[i];
        for (let j = 0; j < shape.coordList.length; j++) {
          coords.push(new Point(shape.coordList[j].x, shape.coordList[j].y));
        }
        myself.addShape(new Shape(coords));
      }
    };
  })(file);

  // Read in the image file as a data URL.
  reader.readAsText(file);
};

CanvasState.prototype.makeShapeForm = function(shape, state) {
  for (i = 0; i < shape.coordList.length; i++) {
      (function () {
        let myself = shape.coordList[i];
        let point = document.createElement('div');
        let xPoint = document.createElement('input');
        xPoint.setAttribute('width', '50px');
        xPoint.value = myself.x;
        xPoint.setAttribute('class', 'coord');
        myself.xLabel = xPoint;
        let yPoint = document.createElement('input');
        yPoint.setAttribute('width', '50px');
        yPoint.value = myself.y;
        yPoint.setAttribute('class', 'coord');
        myself.yLabel = yPoint;
        xPoint.onchange = function() {
          myself.update(Number(myself.xLabel.value),Number(myself.yLabel.value));
          shape.getBounds();
          shape.updateListCanvas();
          state.nodraw = false;
        }
        yPoint.onchange = function() {
          myself.update(Number(myself.xLabel.value),Number(myself.yLabel.value));
          shape.getBounds();
          shape.updateListCanvas();
          state.nodraw = false;
        }
        point.appendChild(xPoint);
        point.appendChild(yPoint);
        shapeForm.appendChild(point);
    }());
  }
};

/**
 * Takes a shape and updates the points in shape form
 @param {Shape} shape - used to assign the coord values
 */
CanvasState.prototype.updateShapeForm = function (shape) {
  let coords = shape.coordList;
  for (i = 0; i < coords.length && i < shapeForm.length; i++) {
    shapeForm.children[i].children[0].value = coords[i].x;
    shapeForm.children[i].children[1].value = coords[i].y;
  }
};


/**
 * Creates the input spots on the original page
 */
CanvasState.prototype.clearShapeForm = function () {
  while (shapeForm.children.length > 0) {
    child = shapeForm.children[0];
    shapeForm.removeChild(child);
  }
};

/**
 * Creates a prototype for the draggable corner objects of Shapes
 * @constructor
 * @param {int} x - the x-coordinate of the point
 * @param {int} y - the y-coordinate of the point
 */
function Point(x, y) {
  this.x = x || 0;
  this.y = y || 0;
  this.detectionDistance = 30;
  this.xLabel = null;
  this.yLabel = null;
};

Point.prototype.draw = function(ctx) {
  ctx.fillRect(this.x - 4, this.y - 4, 8, 8);
};

Point.prototype.update = function(mx, my) {
  this.x = mx;
  this.y = my;
};

Point.prototype.contains = function(mx, my) {
  if (Math.sqrt((this.x - mx) ** 2 + (this.y - my) ** 2) <=
    this.detectionDistance) {
    return true;
  }
  return false;
};

/**
 * Creates a prototype for an interactive polygon
 * that will be drawn on the canvas
 * @constructor
 * @param {list} coordList - A list of ints representing the x and y
 *               coordinates of every corner of the polygon
 */
function Shape(coordList) {
  this.fill = 'rgba(0, 100, 100, .5)';
  this.coordList = coordList;
  this.getBounds();
  this.listItem = null;
}

Shape.prototype.draw = function(ctx, optionalScale = 1, optionalXOffset = 0, optionalYOffset = 0) {
  ctx.fillStyle = this.fill;
  ctx.beginPath();
  ctx.moveTo((this.coordList[0].x + optionalXOffset) * optionalScale,
    (this.coordList[0].y + optionalYOffset) * optionalScale);
  for (let i = 0; i < this.coordList.length; i++) {
    ctx.lineTo((this.coordList[i].x + optionalXOffset) * optionalScale,
      (this.coordList[i].y + optionalYOffset) * optionalScale);
    this.coordList[i].draw(ctx);
  }
  ctx.fill();
  ctx.closePath();
};

Shape.prototype.getBounds = function() {
  this.minX = this.coordList[0].x;
  this.maxX = this.coordList[0].x;
  this.minY = this.coordList[0].y;
  this.maxY = this.coordList[0].y;
  for (let i = 1; i < this.coordList.length; i += 1) {
    let x = this.coordList[i].x;
    let y = this.coordList[i].y;
    if (x < this.minX) {
      this.minX = x;
    } else if (x > this.maxX) {
      this.maxX = x;
    }
    if (y < this.minY) {
      this.minY = y;
    } else if (y > this.maxY) {
      this.maxY = y;
    }
  }
};

Shape.prototype.contains = function(mx, my) {
  if ((mx <= this.maxX) && (mx >= this.minX) &&
    (my <= this.maxY) && (my >= this.minY)) {
    return true;
  }
  return false;
};

Shape.prototype.updateListCanvas = function() {
  let canvas = this.listItem.children[1].children[0];
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let scale = 60/Math.max(this.maxX - this.minX, this.maxY - this.minY);
  let yOffset = - this.minY + 50 * scale;
  let xOffset = - this.minX + 50 * scale;
  this.draw(ctx, scale, xOffset, yOffset);
}
