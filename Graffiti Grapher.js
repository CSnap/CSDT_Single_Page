const graph = document.getElementById('graph');
const drawing = document.getElementById('drawing');

const makeShapeBtn = document.getElementById('makeShapeBtn');

const shapeForm = document.getElementById('shapeForm');

const ctrlPtConfirm = document.getElementById('ctrlPtConfirm');

if (graph.getContext) {
    const graphContext = graph.getContext('2d');
    makeGrid(graphContext);
    console.log("Here");
    const drawContext = drawing.getContext('2d');  
    ctrlPtConfirm.addEventListener('click', function() {
        makeInputForm();
    });
    makeShapeBtn.addEventListener('click', function() {
        makeShape(drawContext);
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

function makeShape(ctx) {
    console.log("SHAPEFORM", shapeForm);
    console.log("MADE SHAPE");
    const start = shapeForm.length - (document.getElementById('ctrlPts').value * 2);
    console.log(start);
    const end = shapeForm.length;
    console.log(end);
    ctx.beginPath();
    ctx.moveTo(shapeForm[start].value, shapeForm[start+1].value);
    for (i = start+2; i < end-1; i+=2) {
        console.log(i);
        ctx.lineTo(shapeForm[i].value, shapeForm[i+1].value);
    }
    if ((document.getElementById('ctrlPts').value*2) < 5) {
        ctx.stroke();
    }
    else {
        ctx.fill();
    }
    ctx.closePath();
}
