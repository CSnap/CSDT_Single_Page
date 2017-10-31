//simonsarris.com/making-html5-canvas-useful/;

const canv = document.getElementById('canvas');

function Rect(x, y, w, h, fill) {
    console.log("RECT");
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 0;
    this.h = h || 0;
    this.fill = fill || "#AAAAAA";
}

Rect.prototype.draw = function(ctx) {
    console.log("DRAW", this.x, this.y);
    ctx.fillStyle = this.fill;
    ctx.fillRect(this.x, this.y, this.w, this.h);
}

Rect.prototype.contains = function(mx, my) {
    return (this.x <= mx) && (this.x + this.w >= mx) && (this.y <= my) && (this.y + this.h >= my);
}

function CanvasState(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = canvas.getContext('2d');

    // State changes

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
        for (var i = len-1; i >= 0; i--) {
            if (shapes[i].contains(mx, my)) {
                var mySel = shapes[i];
                myState.dragoffx = mx-mySel.x;
                myState.dragoffy = my-mySel.y;
                myState.dragging = true;
                myState.selection = mySel;
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

CanvasState.prototype.addRect = function(shape) {
    this.shapes.push(shape);
    this.nodraw = false;
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
        for (var i = 0; i < 1; i++) {
            var shape = shapes[i];
            if (shape.x > this.width || shape.y > this.height ||
                shape.x + shape.w < 0 || shape.y + shape.h < 0) continue;
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

console.log("Hello!");
var s = new CanvasState(document.getElementById('canvas'));
console.log("HERE");
s.addRect(new Rect(40,40,50,50));
