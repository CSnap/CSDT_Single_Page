// Setting up the graphs
const graph = document.getElementById('graph');
const drawing = document.getElementById('drawing');

// Setting up the form itself
const makeShapeBtn = document.getElementById('makeShapeBtn');
const shapeForm = document.getElementById('shapeForm');
const ctrlPtConfirm = document.getElementById('ctrlPtConfirm');
const shapeList = [];
const rmvShapeBtn = document.getElementById('rmvShapeBtn');

// The interactive outline
if (graph.getContext) {
    const graphContext = graph.getContext('2d');
    makeGrid(graphContext);

    ctrlPtConfirm.addEventListener('click', function() {
        makeInputForm();
    });

    const state = new CanvasState(drawing);
    makeShapeBtn.addEventListener('click', function() {
        state.addShape(new Shape(shapeForm));
    });

    rmvShapeBtn.addEventListener('click', function() {
        state.removeShape(state.selection);
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
    for (i = 0; i <= graph.height; i+= 20) {
        ctx.moveTo(0, i);
        ctx.lineTo(graph.width, i);
        ctx.stroke();
    }
    ctx.closePath();
};

/**
* Creates the input spots on the original page
*/
function makeInputForm() {
    let point;
    let xPoint;
    let yPoint;
    for (i = 0; i < document.getElementById('ctrlPts').value; i++) {
        point = document.createElement('div');
        xPoint = document.createElement('input');
        xPoint.value = 'x';
        xPoint.setAttribute('class', 'coord');
        yPoint = document.createElement('input');
        yPoint.value = 'y';
        yPoint.setAttribute('class', 'coord');
        point.appendChild(xPoint);
        point.appendChild(yPoint);
        shapeForm.appendChild(point);
        shapeList.push(point);
    }
};

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
            if (shapes[i].contains(mx, my)) {
                let mySelection = shapes[i];
                myState.dragoffx = mx - mySelection.minX;
                myState.dragoffy = my - mySelection.minY;
                myState.dragging = true;
                myState.selection = mySelection;
                myState.nodraw = false;
                return;
            }
            for (let j = 0; j < shapes[i].coordList.length; j++) {
                if (shapes[i].coordList[j].contains(mx, my)) {
                    let point = shapes[i].coordList[j];
                    myState.dragoffx = mx - point.x;
                    myState.dragoffy = my - point.y;
                    myState.distorting = true;
                    point.clicked = true;
                    return;
                }
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
                point.update(point.x + (mouse.x-shape.minX-myState.dragoffx),
                    point.y + (mouse.y - shape.minY - myState.dragoffy));
            }
            myState.dragoffx = mouse.x - shape.minX;
            myState.dragoffy = mouse.y - shape.minY;
            myState.nodraw = false;
        } else if (myState.distorting) {
            for (let i = 0; i < shape.coordList.length; i++) {
                let point = shape.coordList[i];
                if (point.clicked) {
                    point.update(point.x + (myState.dragoffx),
                        point.y + (myState.dragoffy));
                    myState.dragoffx = mouse.x - point.x;
                    myState.dragoffy = mouse.y - point.y;
                }
            }            
            myState.nodraw = false;
        }
    }, true); // WHAT DOES THIS TRUE MEAN??

    // Releasing a selected shape
    canvas.addEventListener('mouseup', function(e) {
        let shape = myState.selection;
        shape.minX = shape.coordList[0].x;
        shape.minY = shape.coordList[0].y;
        shape.maxX = shape.coordList[0].x;
        shape.maxY = shape.coordList[0].y;
        for (let i = 0; i < shape.coordList.length; i++) {
            if (shape.coordList[i].x < shape.minX) {
                shape.minX = shape.coordList[i].x;
            }
            if (shape.coordList[i].x > shape.maxX) {
                shape.maxX = shape.coordList[i].x;
            }
            if (shape.coordList[i].y < shape.minY) {
                shape.minY = shape.coordList[i].y;
            }
            if (shape.coordList[i].y > shape.maxY) {
                shape.maxY = shape.coordList[i].y;
            }
            if (shape.coordList[i].clicked) {
                shape.coordList[i].clicked = false;
            }
        }
        myState.dragging = false;
        myState.distorting = false;
        myState.dragoffx = 0;
        myState.dragoffy = 0;
    }, true);

    setInterval(function() {
        myState.draw();
    }, myState.interval);
}

CanvasState.prototype.addShape = function(shape) {
    this.shapes.push(shape);
    this.nodraw = false;
};

CanvasState.prototype.removeShape = function(shape) {
    const index = this.shapes.indexOf(shape);
    this.shapes.splice(index, 1);
    this.nodraw = false;
    this.clear();
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

    return {x: mx, y: my};
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
    this.clicked = false;
};

Point.prototype.draw = function(ctx) {
    ctx.fillRect(this.x-4, this.y-4, 8, 8);
};

Point.prototype.update = function(mx, my) {
    this.x = mx;
    this.y = my;
};

Point.prototype.contains = function(mx, my) {
    if (this.x + 4 >= mx && this.x - 4 <= mx &&
        this.y + 4 >= my && this.y - 4 <= my) {
        return true;
    }
    return false;
}

/**
* Creates a prototype for an interactive polygon
* that will be drawn on the canvas
* @constructor
* @param {list} coordList - A list of ints representing the x and y
*               coordinates of every corner of the polygon
*/
function Shape(coordList) {
    const start = shapeForm.length - document.getElementById('ctrlPts').value*2;
    const end = shapeForm.length;
    this.fill = 'rgba(0, 100, 100, .5)';
    this.coordList = [];
    this.minX = coordList[start].value;
    this.maxX = coordList[start].value;
    this.minY = coordList[start+1].value;
    this.maxY = coordList[start+1].value;
    for (let i = start; i < end; i+=2) {
        let x = parseInt(coordList[i].value);
        let y = parseInt(coordList[i+1].value);
        let point = new Point(x, y);
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
        this.coordList.push(point);
    }
}

Shape.prototype.draw = function(ctx) {
    ctx.fillStyle = this.fill;
    ctx.beginPath();
    ctx.moveTo(this.coordList[0].x, this.coordList[0].y);
    for (let i = 0; i < this.coordList.length; i++) {
        ctx.lineTo(this.coordList[i].x, this.coordList[i].y);
        this.coordList[i].draw(ctx);
    }
    ctx.fill();
    ctx.closePath();
};

Shape.prototype.contains = function(mx, my) {
    if ((mx <= this.maxX) && (mx >= this.minX) &&
        (my <= this.maxY) && (my >= this.minY)) {
        return true;
    }
    return false;
};
