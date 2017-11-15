// Setting up the graphs
const graph = document.getElementById('graph');
const drawing = document.getElementById('drawing');

// Setting up the form itself
const makeShapeBtn = document.getElementById('makeShapeBtn');
const shapeForm = document.getElementById('shapeForm');
const ctrlPtConfirm = document.getElementById('ctrlPtConfirm');
const shapeList = []
const rmvShapeBtn = document.getElementById('rmvShapeBtn');

// The interactive outline
if (graph.getContext) {
    const graphContext = graph.getContext('2d');
    makeGrid(graphContext);

    ctrlPtConfirm.addEventListener('click', function() {
        makeInputForm();
    });

    var state = new CanvasState(drawing)
    makeShapeBtn.addEventListener('click', function() {
        state.addShape(new Shape(shapeForm));
    });

    rmvShapeBtn.addEventListener('click', function() {
        console.log("SELECAO", state.selection);
        state.removeShape(state.selection);
    });
}
else {
    console.log("There is nothing for you here.");
}

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

function makeInputForm(ctx) {
    var point;
    var xPoint;
    var yPoint;
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

function CanvasState(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = canvas.getContext('2d');

    // State Changes
    this.nodraw = true;
    this.shapes = [];
    this.changing = false;
    this.selection = null;
    this.dragoffx = 0;
    this.dragoffy = 0;
    this.interval = 30;

    var myState = this; // Closure

    // Selecting a shape 
    canvas.addEventListener('mousedown', function(e) {
        var mouse = myState.getMouse(e);
        var mx = mouse.x;
        var my = mouse.y;
        var shapes = myState.shapes;
        var len = shapes.length;
        for (var i = 0; i < len; i++) {
            if (shapes[i].contains(mx, my)) {
                var mySelection = shapes[i];
                myState.dragoffx = mx - mySelection.minX;
                myState.dragoffy = my - mySelection.minY;
                myState.changing = true;
                myState.selection = mySelection;
                myState.nodraw = false;
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
        if (myState.changing) {
            var mouse = myState.getMouse(e);
            var shape = myState.selection;
            for (var i = 0; i < shape.coordList.length; i++) {
                var point = shape.coordList[i];
                point.update(point.x + (mouse.x - shape.minX - myState.dragoffx), point.y + (mouse.y - shape.minY - myState.dragoffy));
            }
            myState.dragoffx = mouse.x - shape.minX;
            myState.dragoffy = mouse.y - shape.minY;
            myState.nodraw = false;
        }
    }, true); // WHAT DOES THIS TRUE MEAN??

    // Releasing a selected shape
    canvas.addEventListener('mouseup', function(e) {
        var shape = myState.selection;
        shape.minX = shape.coordList[0].x;
        shape.minY = shape.coordList[0].y;
        shape.maxX = shape.coordList[0].x;
        shape.maxY = shape.coordList[0].y;
        for (var i = 0; i < shape.coordList.length; i++) {
            if (shape.coordList[i].x < shape.minX) { shape.minX = shape.coordList[i].x; }
            if (shape.coordList[i].x > shape.maxX) { shape.maxX = shape.coordList[i].x; }
            if (shape.coordList[i].y < shape.minY) { shape.minY = shape.coordList[i].y; }
            if (shape.coordList[i].y > shape.maxY) { shape.maxY = shape.coordList[i].y; }
        }
        myState.changing = false;
    }, true);

    setInterval(function() { myState.draw(); }, myState.interval);
}

CanvasState.prototype.addShape = function(shape) {
    this.shapes.push(shape);
    this.nodraw = false;
}

CanvasState.prototype.removeShape = function(shape) {
    var index = this.shapes.indexOf(shape);
    this.shapes.splice(index, 1);
    console.log(this.shapes);
    this.nodraw = false;
    this.clear();
}

CanvasState.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
}

CanvasState.prototype.draw = function() {
    if (!this.nodraw) {
        var ctx = this.ctx;
        var shapes = this.shapes;
        this.clear();

        var len = shapes.length;
        for (var i = 0; i < len; i++) {
            var shape = shapes[i];
            if (shape.maxX < 0 || shape.minX > this.width ||
                shape.maxY < 0 || shape.minY > this.height) { 
                continue; 
            } 
            shape.draw(ctx);
        }
    }
    this.nodraw = true;
}

CanvasState.prototype.getMouse = function(e) {
    var element = this.canvas; 
    mx = e.pageX - element.offsetLeft;
    my = e.pageY - element.offsetTop;

    return {x: mx, y: my};
}

function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Point.prototype.draw = function(ctx) {
    ctx.fillRect(this.x-3, this.y-3, 6, 6);
}

Point.prototype.update = function(mx, my) {
    this.x = mx;
    this.y = my;
}

function Shape(coordList) { 
    const start = shapeForm.length - document.getElementById('ctrlPts').value*2;
    const end = shapeForm.length;
    this.fill = 'rgba(0, 100, 100, .5)';
    this.coordList = [];
    this.minX = coordList[start].value;
    this.maxX = coordList[start].value;
    this.minY = coordList[start+1].value;
    this.maxY = coordList[start+1].value;
    for (var i = start; i < end; i+=2) {
        var x = parseInt(coordList[i].value);
        var y = parseInt(coordList[i+1].value);
        var point = new Point(x, y);
        if (x < this.minX) {
            this.minX = x;
        }
        else if (x > this.maxX) {
            this.maxX = x;
        }
        if (y < this.minY) { this.minY = y; }
        else if (y > this.maxY) { this.maxY = y; }
        this.coordList.push(point);
    }
}

Shape.prototype.draw = function(ctx) {
    ctx.fillStyle = this.fill;
    ctx.beginPath();
    ctx.moveTo(this.coordList[0].x, this.coordList[0].y);
    for (var i = 0; i < this.coordList.length; i++) {
        ctx.lineTo(this.coordList[i].x, this.coordList[i].y);
    }
    ctx.fill();
    ctx.closePath();
}

Shape.prototype.contains = function(mx, my) {
    for (var i = 0; i < this.coordList.length; i++) {
        if (mx == this.coordList[i].x && my == this.coordList[i].y) { 
            var point = this.coordList[i];
            point.clicked = true;
            point.update();
            return true; }
    }
    if ((mx <= this.maxX) && (mx >= this.minX) && (my <= this.maxY) && (my >= this.minY)) {
        return true;
    }
    return false;
}