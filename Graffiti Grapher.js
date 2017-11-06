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

const canvas = document.getElementById('tutorial');
if (canvas.getContext) {
    const context = canvas.getContext('2d');
    draw(context);
}

/** Fxn that draws VALERIE using a variety of shapes and lines
* @param {RenderingContext} ctx - The canvas context being drawn upon.
*/ 
function draw(ctx) {
    ctx.beginPath();
    ctx.moveTo(65, 100); // V outer
    ctx.lineTo(115, 275);
    ctx.lineTo(165, 100);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(90, 100); // V cutout 
    ctx.lineTo(140, 100);
    ctx.lineTo(115, 200);
    ctx.fillStyle = 'rgba(255, 255, 255, 100)';
    ctx.fill();
    ctx.closePath();
    ctx.beginPath(); // A outer      
    ctx.fillStyle = 'rgba(0, 0, 0, 100)';
    ctx.moveTo(175, 150);
    ctx.lineTo(125, 275);
    ctx.lineTo(225, 275);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath(); // A Inner Clear        
    ctx.fillStyle = 'rgba(255, 255, 255, 100)';
    ctx.moveTo(175, 210);
    ctx.lineTo(150, 275);
    ctx.lineTo(200, 275);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath(); // A Crossbar   
    ctx.fillStyle = 'rgba(0, 0, 0, 100)';
    ctx.fillRect(150, 240, 50, 25);
    ctx.fillRect(225, 150, 75, 125); // L    
    ctx.clearRect(250, 150, 50, 100);
    ctx.fillRect(310, 150, 25, 125); // E    
    ctx.fillRect(310, 150, 75, 25);
    ctx.fillRect(310, 200, 65, 25);
    ctx.fillRect(310, 250, 75, 25);
    ctx.moveTo(310, 145); // Accent  
    ctx.lineTo(385, 135);
    ctx.lineTo(375, 120);
    ctx.fill();
    ctx.closePath();
    ctx.fillRect(390, 150, 25, 125); // R Stem       
    ctx.beginPath();
    ctx.arc(415, 190, 40, (Math.PI/180)*90, (Math.PI/180)*270, 1); // R Arc
    ctx.fill();
    ctx.closePath();
    ctx.beginPath(); // R Inner Arc  
    ctx.fillStyle = 'rgba(255, 255, 255, 100)';
    ctx.arc(415, 190, 15, (Math.PI/180)*90, (Math.PI/180)*270, 1);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 0, 0, 100)';
    ctx.moveTo(390, 230);
    ctx.lineTo(455, 230);
    ctx.lineTo(455, 275);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(460, 150);
    ctx.lineTo(460, 275);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(460, 130, 10, 0, (Math.PI/180)*360, 0);
    ctx.fill();
    ctx.fillRect(470, 150, 25, 125); // E    
    ctx.fillRect(470, 150, 75, 25);
    ctx.fillRect(470, 200, 65, 25);
    ctx.fillRect(470, 250, 75, 25);
}
