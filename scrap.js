
	
		<input id="numControl" type="text" value="2"/ >

 /*makeLine.addEventListener('click', function() {
        drawLine(drawContext);
    });
    makePoly.addEventListener('click', function() {
        drawPoly(drawContext);
    });*/

upBtn.addEventListener('click', function() {
        numCtrlPts.value = parseInt(numCtrlPts.value)+1;
    });
    downBtn.addEventListener('click', function() {
        numCtrlPts.value = parseInt(numCtrlPts.value)-1;
    });

    function drawLine(ctx) {
    console.log("HERE");
    var x1 = lineForm[0].value;
    var y1 = lineForm[1].value;
    var x2 = lineForm[2].value;
    var y2 = lineForm[3].value;
    console.log("HEY :LOOKK HERE BITHC");
    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.closePath();
}

function drawPoly(ctx) {
    console.log("BAS ICS HAPES, BASIC SHAPES");
    var x1 = polyForm[0].value;
    var y1 = polyForm[1].value;
    var x2 = polyForm[2].value;
    var y2 = polyForm[3].value;
    var x3 = polyForm[4].value;
    var y3 = polyForm[5].value;
    var x4 = polyForm[6].value;
    var y4 = polyForm[7].value;

    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.fill();
    ctx.closePath();
    ctx.clearRect(x1, y1, 50, 50);
}




const graph = document.getElementById('graph');
const drawing = document.getElementById('drawing');

const makeShapeBtn = document.getElementById('makeShapeBtn');

const shapeForm = document.getElementById('shapeForm');

const ctrlPtConfirm = document.getElementById('ctrlPtConfirm');

if (graph.getContext) {
    const graphContext = graph.getContext('2d');
    makeGrid(graphContext);
    const s = new CanvasState(drawing)
    console.log("Here");
    const drawContext = drawing.getContext('2d');  
    ctrlPtConfirm.addEventListener('click', function() {
        makeInputForm();
    });
    makeShapeBtn.addEventListener('click', function() {
        s.addShape(new Shape(10, 10));
    })
}
else {
    console.log("There is nothing for you here.");
}

function makeGrid(ctx) {
    ctx.lineWidth = .5;
    ctx.strokeStyle = "rgb(211,211,211)";
    ctx.beginPath();
    for (i=0; i <= graph.width; i += 20) { // Horizontal Lines
    ctx.moveTo(i, 0);
    ctx.lineTo(i, graph.height);
    ctx.stroke();
    }
    for (i=0; i <= graph.height; i += 20) { // Vertical Lines
    ctx.moveTo(0, i);
    ctx.lineTo(graph.width, i);
    ctx.stroke();
    }
    ctx.closePath();
}

function makeInputForm() {
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
        point.appendChild(xPoint)
        point.appendChild(yPoint);
        shapeForm.appendChild(point);
    }
}

function Shape(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

Shape.prototype.draw = function(ctx) {
    const start =shapeForm.length - (document.getElementById('ctrlPts').value * 2);
    const end = shapeForm.length;

    ctx.beginPath();
    ctx.moveTo(shapeForm[i].value, shapeForm[start+1].value);
    for (i = start+2; i < end-1; i+=2) {
        ctx.lineTo(shapeForm[i].value, shapeForm[start+1].value)
    }
    if ((document.getElementById('ctrlPts').value*2) < 5) {
        ctx.stroke();
    }
    else {
        ctx.fill();
    }
    ctx.closePath();
}

Shape.prototype.contains = function(mx, my) {
    return (this.x-10 <= mx) && (this.x+10 >= mx) && (this.y-10 <= my) && (this.y+10 <= my);
}

function CanvasState(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = canvas.getContext('2d');

    this.nodraw = false;
    this.shapes = [];
    this.dragging = false;
    this.selection = null;
    this.dragoffx = 0;
    this.dragoffy = 0;

    var myState = this;

    canvas.addEventListener('mousedown', function(e) {
        var mouse = myState.getMouse(e);
        var mx = mouse.x;
        var my = mouse.y;
        var shapes = myState.shapes;
        var len = shapes.length;
        for (var i = len-1; i>=0; i--) {
            if (shapes[i].contains(mx, my)) {
                var mySelection = shapes[i];
                myState.dragoffx = mx - mySelection.x;
                myState.dragoffy = my - mySelection.y;
                myState.dragging = true;
                myState.selection = mySelection;
                myState.nodraw = false;
                return;
            }
        }
    });

    canvas.addEventListener('mousemove', function(e) {
        if (myState.dragging) {
            var mouse = myState.getMouse(e);
            myState.selection.x = mouse.x;
            myState.selection.y = mouse.y;
            myState.nodraw = false;
        }
    }, true);

    canvas.addEventListener('mouseup', function(e) {
        myState.dragging = false;
    }, true);

    setInterval(function() {myState.draw();}, myState.interval);
}

CanvasState.prototype.addShape = function(shape) {
    this.shapes.push(shape);
    this.nodraw = false;
}

CanvasState.prototype.clear = function() {
    this.ctx.clearRect(0,0, this.width, this.height);
}

CanvasState.prototype.draw = function() {
    if (!this.nodraw) {
        var ctx = this.ctx;
        var shapes = this.shapes;
        this.clear();

        var len = shapes.length;
        for (var i = 0; i < 1; i++) {
            var shape = shapes[i];
            if (shape.x > this.width || shape.y > this.height ||
                shape.x+10 < 0 || shape.y+10<0) continue;
                shapes[i].draw(ctx);
        }
    }
    this.nodraw = true;
}

CanvasState.prototype.getMouse = function(e) {
    var element = this.canvas, mx, my;

    mx = e.pageX;
    my = e.pageY;

    return {x: mx, y: my};
}