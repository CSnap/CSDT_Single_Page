// Setting up the graphs
const graph = document.getElementById('graph');
const drawing = document.getElementById('drawing');

// Setting up the form itself
const makeShapeBtn = document.getElementById('makeShapeBtn');
const shapeForm = document.getElementById('shapeForm');
const ctrlPtConfirm = document.getElementById('ctrlPtConfirm');

// The interactive outline
if (graph.getContext) {
    const graphContext = graph.getContext('2d');
    makeGrid(graphContext);

    ctrlPtConfirm.addEventListener('click', function() {
        makeInputForm();
    });

    var state = new CanvasState(drawing)
    makeShapeBtn.addEventListener('click', function() {
        state.addShape(new Shape([[200, 100], [200, 200], [300, 150]]))
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
    }
}

function CanvasState(canvas) {
    //console.log("Initialize the canvas");
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
        console.log("Clicked on a shape?");
        var mouse = myState.getMouse(e);
        console.log("OG", mouse);
        var mx = mouse.x;
        var my = mouse.y;
        var shapes = myState.shapes;
        var len = shapes.length;
        for (var i = len-1; i >= 0; i--) {
            if (shapes[i].contains(mx, my)) {
                console.log("Si, el tiene");
                var mySelection = shapes[i];
                myState.dragoffx = mx - mySelection.minX;
                myState.dragoffy = my - mySelection.minY;
                myState.changing = true;
                myState.selection = mySelection;
                myState.nodraw = false;
            }
        }
    }); 

    // Dragging a shape
    canvas.addEventListener('mousemove', function(e) {
        //console.log("Move a shape?");
        if (myState.changing) {
            //console.log("YES, something is changing.");
            var mouse = myState.getMouse(e);
            // console.log("MOUSE", mouse);
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
        console.log("Be free!");
        var shape = myState.selection;
        /*console.log(myState.selection);
        console.log(shape);*/
        shape.minX = shape.coordList[0].x;
        shape.minY = shape.coordList[0].y;
        shape.maxX = shape.coordList[0].x;
        shape.maxY = shape.coordList[0].y;
        //console.log(shape);
        //console.log(myState.selection);
        for (var i = 0; i < shape.coordList.length; i++) {
            console.log(shape.coordList[i].x, shape.minX, shape.maxX);
            if (shape.coordList[i].x < shape.minX) { shape.minX = shape.coordList[i].x; }
            if (shape.coordList[i].x > shape.maxX) { shape.maxX = shape.coordList[i].x; }
            if (shape.coordList[i].y < shape.minY) { shape.minY = shape.coordList[i].y; }
            if (shape.coordList[i].y > shape.maxY) { shape.maxY = shape.coordList[i].y; }
        }
        console.log(shape.minX, shape.maxX);
        console.log(shape.minY, shape.maxY);
        myState.changing = false;
    }, true);

    setInterval(function() {myState.draw();}, myState.interval);
}

CanvasState.prototype.addShape = function(shape) {
    //console.log("Add a new shape!");
    this.shapes.push(shape);
    this.nodraw = false;
}

CanvasState.prototype.clear = function() {/*
    console.log("HEIGHT", this.height);*/
    this.ctx.clearRect(0, 0, this.width, this.height);
}

CanvasState.prototype.draw = function() {
    //console.log("Should we draw?");
    if (!this.nodraw) {
        // console.log("Yes, we should!");
        var ctx = this.ctx;
        var shapes = this.shapes;
        this.clear();

        var len = shapes.length;
        for (var i = 0; i < len; i++) {
            // console.log("D");
            var shape = shapes[i];
            if (shape.maxX < 0 || shape.minX > this.width ||
                shape.maxY < 0 || shape.minY > this.height) { 
                console.log("NAH Fuck that");
                continue; } 
            // console.log("Redraw", )
            shape.draw(ctx);
        }
        if (this.selection != null) {
            //console.log("Updated", this.selection.coordList[0].x, this.selection.coordList[0].y);
            this.selection.draw(ctx);
        }
    }
    this.nodraw = true;
}

CanvasState.prototype.getMouse = function(e) {
    var element = this.canvas; //, offsetX = 0, offsetY = 0, mx, my;

    /*if (element.offsetParent != undefined) {
        do {
            offsetX += element.offsetLeft;
            offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }
    console.log("Got the mouse,", mx, my);*/
/*
    offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
    offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;
*/
    mx = e.pageX - element.offsetLeft;
    my = e.pageY - element.offsetTop;

    return {x: mx, y: my};
}

function Point(x, y) {
    this.x = x || 0;
    this.y = y || 0;
    this.string = "ALOHA";
}

Point.prototype.draw = function(ctx) {
    ctx.fillRect(this.x-3, this.y-3, 6, 6);
}

Point.prototype.update = function(mx, my) {
    // console.log("old points", this.x, this.y);
    this.x = mx;
    this.y = my;
    // console.log("new points", this.x, this.y);
}

function Shape(coordList) { 
    this.fill = 'rgba(0, 100, 100, .5)';
    this.coordList = [];
    this.minX = coordList[0][0];
    this.maxX = coordList[0][0];
    this.minY = coordList[0][1];
    this.maxY = coordList[0][1];
    for (var i = 0; i < coordList.length; i++) {
        var point = new Point(coordList[i][0], coordList[i][1]);
        if (coordList[i][0] < this.minX) { this.minX = coordList[i][0]; }
        else if (coordList[i][0] > this.maxX) { this.maxX = coordList[i][0]; }
        if (coordList[i][1] < this.minY) { this.minY = coordList[i][1]; }
        else if (coordList[i][1] > this.maxY) { this.maxY = coordList[i][1]; }
        this.coordList.push(point);
    }
    //console.log(this.coordList);
}

Shape.prototype.draw = function(ctx) {
    ctx.fillStyle = this.fill;
    ctx.beginPath();
    ctx.moveTo(this.coordList[0].x, this.coordList[0].y);
    for (var i = 0; i < this.coordList.length; i++) {
        ctx.lineTo(this.coordList[i].x, this.coordList[i].y);
        //this.coordList[i].draw(ctx);
    }
    ctx.fill();
    ctx.closePath();
}

Shape.prototype.contains = function(mx, my) {
    console.log("Check containment");
    for (var i = 0; i < this.coordList.length; i++) {
        if (mx == this.coordList[i].x && my == this.coordList[i].y) { 
            var point = this.coordList[i];
            point.clicked = true;
            point.update();
            return true; }
    }
    if ((mx <= this.maxX) && (mx >= this.minX) && (my <= this.maxY) && (my >= this.minY)) {
        console.log("It contains this point");
        return true;
    }
    return false;
}