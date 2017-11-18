let scale = 1;
let topBarMargin = 75;
let sideBarMargin = 5;
let marginR = 280;

let W = window.innerWidth-marginR;
let H = window.innerHeight;
let paused = true;
let drawButton = false;
let resetButton = false;
let homeX = 0;
let homeY = H*0.1;
let mouseX = 0;
let mouseY = 0;
let CanvasOffsetX = W * 0.5;
let CanvasOffsetY = H * 0.5;
let trail = [];
let trails = [];
let mouseStatusDown = false;
let drawNewGrid = true;
let equation = 'y=x * 0.5';

gravity = -0.15;
debugMode = false;
speedVectorContant = 2;
collisionFriction = 0;
collisionVerticalFriction = 0.8;
collisionRadius = 25;

ctxbg = background.getContext('2d'); /* layer for background info and grid*/
ctx = canvas1.getContext('2d'); /* layer for trail*/
ctx2 = canvas2.getContext('2d'); /* layer for object*/
let skateboardpng = new Image();
skateboardpng.src ='skateboarding_images/skateboardman.png';
let skateboardhitpng = new Image();
skateboardhitpng.src ='skateboarding_images/skateboardmanhit.png';
let skateboardfailpng = new Image();
skateboardfailpng.src ='skateboarding_images/skateboardmanfail.png';
let flagpng = new Image();
flagpng.src ='skateboarding_images/flag.png';

/**
 * Creates an instance of Skateboarder.
 *
 * @constructor
 * @author: yanlin
 * @this {Skateboarder}
 */
function Skateboarder() {
    this.x = homeX;
    this.y = homeY;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.angularV = 0;
    this.friction = 0;
    this.collisionR = 40;
    this.valid = true;
    this.hit = 0;
    this.frontWheel = {x: 10, y: -20};
    this.rearWheel = {x: -10, y: -20};
    this.head = {x: 0, y: 20};
};

document.addEventListener('keydown', keyPush);
document.addEventListener('click', mouseClicks);
document.addEventListener('mousemove', mouseMoves);
document.addEventListener('mousedown', function() {
    mouseStatusDown = true;
});
document.addEventListener('mouseup', function() {
    if (trail.length > 2) {
        trails.push(trail);
        trail = [];
    }
    mouseStatusDown = false;
});

document.addEventListener('wheel', mousewheel);

/** translate canvas coordinates to object coordinates
    @param {object} ctxc - the canvas coordinate
    @param {int} ctxc.x - the canvas x-coordinate
    @param {int} ctxc.y - the canvas y-coordinate
    @return {object}
*/
function canvasToObj(ctxc) {
    return {x: ((ctxc.x - CanvasOffsetX)/scale),
    y: -(ctxc.y + CanvasOffsetY - H)/scale};
}

/** translate object coordinates to canvas coordinates
    @param {object} objc - the object coordinate
    @param {int} objc.x - the object x-coordinate
    @param {int} objc.y - the object y-coordinate
    @return {object}
*/
function objToCanvas(objc) {
    return {x: parseInt(scale * objc.x + CanvasOffsetX),
    y: parseInt(H - scale * objc.y - CanvasOffsetY)};
}

/** get mouseclick position
    @param {event} event - the event
*/
function mouseClicks(event) {
    if (event.clientY < topBarMargin) {
        return;
    }
    if (event.clientX > W-sideBarMargin) {
        return;
    }
    mouseX = event.clientX;
    mouseY = event.clientY;
    if (resetButton) {
        let objc = canvasToObj({x: mouseX, y: mouseY});
        homeX = objc.x;
        homeY = objc.y;
        updateScreen();
    }
}

/** get mouseMoves position
@param {event} event - the event
*/
function mouseMoves(event) {
    if (event.clientY < topBarMargin) {
        return;
    }
    if (event.clientX > W-sideBarMargin) {
        return;
    }
    let oldmouseX = mouseX;
    let oldmouseY = mouseY;
    mouseX = event.clientX;
    mouseY = event.clientY;
    let objc = canvasToObj({x: mouseX, y: mouseY});
    if (drawButton && mouseStatusDown) {
        trail.push(objc);
        updateScreen();
        drawTrail(trail);
    }
    if (!drawButton && mouseStatusDown) {
        CanvasOffsetX += mouseX - oldmouseX;
        CanvasOffsetY -= mouseY - oldmouseY;
        drawNewGrid = true;
        updateScreen();
    }
    printMouse(objc);
}

/** get mousewheel movements
    @param {event} event - the event
*/
function mousewheel(event) {
    if (event.clientY < topBarMargin) {
        return;
    }
    if (event.clientX > W-sideBarMargin) {
        return;
    }
    let oMouse = canvasToObj({x: mouseX, y: mouseY});
    let delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
    scale *= (1+0.05*parseFloat(delta));
    cnMouse = objToCanvas(oMouse);
    CanvasOffsetX += mouseX - cnMouse.x;
    CanvasOffsetY -= mouseY - cnMouse.y;
    drawNewGrid = true;
    updateScreen();
}

/** print mouse location on canvas
@param {object} objc - the object coordinate
@param {int} objc.x - the object x-coordinate
@param {int} objc.y - the object y-coordinate
*/
function printMouse(objc) {
    ctxbg.clearRect(100, H-70, 160, 25);
    ctxbg.font = '20px Consolas';
    ctxbg.fillStyle = '#111111';
    ctxbg.fillText('x:'+parseInt(objc.x).toString(), 100, H-50);
    ctxbg.fillText('y:'+parseInt(objc.y).toString(), 180, H-50);
}

/** wait for keypush 
@param {event} evt - the event
*/
function keyPush(evt) {
    switch (evt.keyCode) {
        case 37:
            skateBoarder.vx -= 5;
            break;
        case 38:
            skateBoarder.vy += 5;
            break;
        case 39:
            skateBoarder.vx += 5;
            break;
        case 40:
            skateBoarder.vy -= 5;
            break;
    }
}

/** check for parentheses
@param {String[]} items - the items
@return {int}
*/
function parentheses(items) {// -> [Int]{ find the first parentheses
    let pos = [-1, -1];
    let diff = 0;// the difference between'(' and ')'
    let i = 0;
    while (i < items.length) {
        if (items[i] == '(') {
            pos[0] = i;
        }
        i += 1;
    }

    if (items.length-1 > pos[0]) {
        i = pos[0]+1;
        while (i < items.length) {
            if (items[i] == '(') { // if inner parentheses exists
                diff += 1;
            } else if (items[i] == ')' && diff == 0) {
                pos[1] = i;
                break;
            } else if (items[i] == ')') {
                diff -= 1;
            }
            i += 1;
        }
    }
    return pos;
}

/** calculate the result of an expression
@param {String[]} items - the items
@return {int}
*/
function calculate(items) {
    let section = parentheses(items);
    let sp = []; // the items inside the first parentheses
    let items2 = [];
    let i = 0;
    while (i < items.length) {
        items2.push(items[i]);
        i += 1;
    }
    if (section[1]-section[0] > 1) {
        i = section[1] - 1;
        while (i > section[0]) {
            sp.push(items[i]);
            items2.splice(i, 1);
            i -= 1;
        }
        sp.reverse();
        items2.splice(section[0], 1);
        items2[section[0]] = calculate(sp).toString();
        return calculate(items2);
    } else {
        let i = 0;
        while (i < items2.length) {
            if (items2[i] == '*') {
                items2[i-1] = (parseFloat(items2[i-1]) *
                parseFloat(items2[i+1])).toString();
                items2.splice(i, 1);
                items2.splice(i, 1);
                i -= 1;
            } else if (items2[i] == '/') {
                items2[i-1] = (parseFloat(items2[i-1]) /
                parseFloat(items2[i+1])).toString();
                items2.splice(i, 1);
                items2.splice(i, 1);
                i -= 1;
            }
            i += 1;
        }
        i = 0;
        while (i < items2.length) {
            if (items2[i] == '+') {
                items2[i-1] = (parseFloat(items2[i-1]) +
                parseFloat(items2[i+1])).toString();
                items2.splice(i, 1);
                items2.splice(i, 1);
                i -= 1;
            } else if (items2[i] == '-') {
                items2[i-1] = (parseFloat(items2[i-1]) -
                parseFloat(items2[i+1])).toString();
                items2[i-1] = (parseFloat(items2[i-1]) -
                parseFloat(items2[i+1])).toString();
                items2.splice(i, 1);
                items2.splice(i, 1);
                i -= 1;
            }
            i += 1;
        }
    }
    return items2[0];
}

/** calculate the Y coordinate
@param {int} xc - x coordinate
@return {float}
*/
function calculateY(xc) {
    let equationList = equation.split('=');
    if (equationList.length != 2) {
        document.getElementById('graphOutput').value = 'ERROR: INVALID FORMAT';
        return;
    }
    let expressionList = equationList[1].split(' ');
    expressionList = expressionList.filter(function(str) {
        return /\S/.test(str);
    });
    for (let j=0; j<expressionList.length; j++) {
        expressionList[j] = expressionList[j].trim();
        if (expressionList[j] == 'x') {
            expressionList[j] = xc.toString();
        }
    }
    return parseFloat(calculate(expressionList)).toString();
}

/** draw a man 
@param {int} ox - the x coordinate
@param {int} oy - the y coordinate
*/
function drawFlag(ox, oy) {
    let cxy = objToCanvas({x: ox, y: oy});
    let width2 = flagpng.width/4*scale;
    let height2 = flagpng.height/4*scale;
    ctx.drawImage(flagpng, cxy.x, cxy.y-height2, width2, height2);
}


/** draw a player 
@param {obj} obj - the obj representing a player
*/
function drawPlayer(obj) {
    drawMan(obj, obj.x, obj.y);
    if (debugMode) {
    ctx.beginPath();
    ctx.moveTo(obj.x, obj.y);
    ctx.lineTo(obj.x + 8*speedVectorContant*obj.vx, obj.y +
        8*speedVectorContant*obj.vy);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#de0000';
    ctx.stroke();
    }
}

/*
function drawMan(x, y) {
    if (canvas1.getContext) {
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI*2);
        ctx.fillStyle = '#004a8c';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x*0.997, y*0.997, 14, 0, Math.PI*2);
        ctx.fillStyle = '#0086fc';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x*0.996, y*0.996, 7, 0, Math.PI*2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
}
*/

/** draw a player 
@param {object} obj - the obj representing a player
@param {int} ox - the x coordinate
@param {int} oy - the y coordinate
*/
function drawMan(obj, ox, oy) {
    let cxy = objToCanvas({x: ox, y: oy});
    if (canvas2.getContext) {
        let x2 = cxy.x;
        let y2 = cxy.y;
        let width2 = skateboardpng.width/4;
        let height2 = skateboardpng.height/4;
        width2 *= scale;
        height2 *= scale;
        ctx2.translate(x2, y2);
        ctx2.rotate(obj.angle*Math.PI/180);
        if (obj.valid && obj.hit == 0) {
            ctx2.drawImage(skateboardpng,
            -width2 / 2, -height2 / 2, width2, height2);
        } else if (obj.hit > 0) {
            ctx2.drawImage(skateboardhitpng, -width2 / 2,
            -height2 / 2, width2, height2);
            obj.hit -= 1;
        } else {
            ctx2.drawImage(skateboardfailpng, -width2 / 2,
            -height2 / 2, width2, height2);
        }
        ctx2.rotate(-obj.angle*Math.PI/180);
        ctx2.translate(-x2, -y2);
    }
}

/** draw a trail 
    @param {object[]} oneTrail - single trail
*/
function drawTrail(oneTrail) {
    if (oneTrail.length>0) {
        ctx.beginPath();
        let cxy = objToCanvas({x: parseInt(oneTrail[0].x),
        y: parseInt(oneTrail[0].y)});
        ctx.moveTo(cxy.x, 2+cxy.y);
        for (let i=1; i<oneTrail.length; i++) {
            cxy = objToCanvas({x: parseInt(oneTrail[i].x),
            y: parseInt(oneTrail[i].y)});
            ctx.lineTo(cxy.x, 2+cxy.y);
        }
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#0086fc';
        ctx.stroke();

        ctx.beginPath();
        cxy = objToCanvas({x: parseInt(oneTrail[0].x),
        y: parseInt(oneTrail[0].y)});
        ctx.moveTo(cxy.x, cxy.y);
        for (let i=1; i<oneTrail.length; i++) {
            cxy = objToCanvas({x: parseInt(oneTrail[i].x),
            y: parseInt(oneTrail[i].y)});
            ctx.lineTo(cxy.x, cxy.y);
        }
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
    }
}

/** draw all trails 
    @param {object[]} trails - all trails on the canvas
*/
function drawTrails(trails) {
    for (let i=0; i<trails.length; i++) {
        drawTrail(trails[i]);
    }
}

/** draw the grid on the canvas
*/
function drawGrid() {
    ctxbg.clearRect(0, 0, W, H);
    printMouse(canvasToObj({x: mouseX, y: mouseY}));
    /*
    ctxbg.fillStyle = "#F0EDEE";
    ctxbg.beginPath();
    ctxbg.rect(0,0,W,H);
    ctxbg.closePath();
    ctxbg.fill();
    */

    let o00 = canvasToObj({x: 0, y: 0});
    let oWH = canvasToObj({x: W, y: H});
    let corigin = objToCanvas({x: 0, y: 0});

    if (corigin.x <=W && corigin.x >=0) {
        ctxbg.beginPath();
        ctxbg.moveTo(corigin.x, 0);
        ctxbg.lineTo(corigin.x, H);
        ctxbg.lineWidth = 1;
        ctxbg.strokeStyle = '#000000';
        ctxbg.stroke();
    }
    if (corigin.y <=H && corigin.y >=0) {
        ctxbg.beginPath();
        ctxbg.moveTo(0, corigin.y);
        ctxbg.lineTo(W, corigin.y);
        ctxbg.lineWidth = 1;
        ctxbg.strokeStyle = '#000000';
        ctxbg.stroke();
    }

    let gridSize = 1;
    let maxgridsize = W/20/scale;
    for (let c = 0; gridSize <= maxgridsize; c++) {
        if (c % 3 == 1) { // alternate 2, 5, 10
            gridSize *= 1.25;
        }
        gridSize *= 2;
    }
    for (let i = Math.round(o00.x/gridSize);
            i <= Math.round(oWH.x/gridSize); i++) {
        let pt = objToCanvas({x: gridSize*i, y: 0});
        // drawLabel
        let textY = Math.min(H-10, Math.max(corigin.y, 20+topBarMargin));
        ctxbg.font = '16px Consolas';
        ctxbg.fillStyle = '#111111';
        ctxbg.fillText(gridSize*i.toString(), pt.x+1, textY-3);
        // drawGrid
        ctxbg.beginPath();

        ctxbg.moveTo(pt.x, 0);
        ctxbg.lineTo(pt.x, H);
        ctxbg.lineWidth = 0.3;
        ctxbg.strokeStyle = '#000000';
        ctxbg.stroke();
    }
    for (let i = Math.round(oWH.y/gridSize);
            i <= Math.round(o00.y/gridSize); i++) {
        let pt = objToCanvas({x: 0, y: gridSize*i});
        // drawLabel
        let textX = Math.min(W-sideBarMargin-50, Math.max(corigin.x, 0));
        ctxbg.font = '16px Consolas';
        ctxbg.fillStyle = '#111111';
        ctxbg.fillText(gridSize*i.toString(), textX+1, pt.y-3);
        // drawGrid
        ctxbg.beginPath();

        ctxbg.moveTo(0, pt.y);
        ctxbg.lineTo(W, pt.y);
        ctxbg.lineWidth = 0.3;
        ctxbg.strokeStyle = '#000000';
        ctxbg.stroke();
    }
}

/** refresh all changed items on the canvas
*/
function updateScreen() {
    ctx.clearRect(0, 0, W, H);
    ctx2.clearRect(0, 0, W, H);

    /*
    let my_gradient=ctx.createLinearGradient(0,0,0,H);
    my_gradient.addColorStop(0,'#f8effa');
    my_gradient.addColorStop(1,'#9ebbe1');
    ctx.fillStyle=my_gradient;
    ctx.fillRect(0,0,W,H);
    */
    if (!paused) {
        CanvasOffsetX = W * 0.5 -
            parseInt(scale * (skateBoarder.x + 1 * skateBoarder.vx));
        CanvasOffsetY = H * 0.5 -
            parseInt(scale * (skateBoarder.y + 1 * skateBoarder.vy));
        drawNewGrid = true;
    }

    drawFlag(homeX, homeY);
    drawTrails(trails);
    drawPlayer(skateBoarder);


    if (drawNewGrid) {
        drawGrid();
        drawNewGrid = false;
        if (!paused) {

        }
    }
}

/** draw button
*/
function drawTrailButton() {
    drawButton = !drawButton;
}

/** erase button
*/
function eraseTrailButton() {
    drawButton = false;
    trails = [];
    updateScreen();
}

/** start button
*/
function start() {
    drawButton = false;
    resetButton = false;
    paused = !paused;
    if (!paused) {
        simulate();
    }
}

/** restart button
*/
function restartButton() {
    scale = 1;
    drawButton = false;
    resetButton = false;
    CanvasOffsetX = W * 0.5 -homeX;
    CanvasOffsetY = H * 0.5 -homeY;
    drawNewGrid = true;
    updateScreen();
    restart();
}

/** restart the game
*/
function restart() {
    skateBoarder = new Skateboarder();
    updateScreen();
    drawPlayer(skateBoarder);
    paused = true;
}

/** reset to start 
*/
function reset() {
    drawButton = false;
    resetButton = !resetButton;
    restart();
}

/** draw a graph from an equation. The math equation is read from input
    The result of the equation is then calculated at every x coordinate
    to generate a trail
*/
function drawGraph() {
    equation = document.getElementById('equationInput').value;
    let stax = document.getElementById('equationStartX').value;
    let endx = document.getElementById('equationEndX').value;

    for (let id = 0; id < equation.length; id++) {
        if (equation[id] == '+' || equation[id] == '-' || equation[id] == '*'
        || equation[id] == '/' || equation[id] == ')' || equation[id] == '(') {
            equation = equation.slice(0, id) + ' ' + equation[id]
            + ' ' + equation.slice(id+1, equation.length);
            id += 2;
        }
    }

    for (let xc=parseInt(stax); xc<parseInt(endx); xc++) {
        trail.push({x: xc, y: calculateY(xc)});
    }
    trails.push(trail);
    trail = [];
    updateScreen();
}

/** update the player position based on speed and gravity.
    @param {Skateboarder} obj the player in game
*/
function updatePlayer(obj) {
    obj.x += obj.vx;
    obj.y += obj.vy;
    obj.vy += gravity;
    obj.angle += obj.angularV;
    obj.angularV *= 0.98;
}

/** get the distance between two nodes
    @param {object} a - the first node
    @param {object} b - the second node
    @return {float}
*/
function getDistance(a, b) {
    return Math.sqrt((a.x-b.x) * (a.x-b.x) + (a.y-b.y) * (a.y-b.y));
}

/** get the dot product of two vectors
    @param {object} lineAStart - the first node of first line
    @param {object} lineAEnd - the second node of first line
    @param {object} lineBStart - the first node of second line 
    @param {object} lineBEnd - the second node of second line 
    @return {float}
*/
function dotProduct(lineAStart, lineAEnd, lineBStart, lineBEnd) {
    let lineAX = lineAEnd.x - lineAStart.x;
    let lineAY = lineAEnd.y - lineAStart.y;
    let lineBX = lineBEnd.x - lineBStart.x;
    let lineBY = lineBEnd.y - lineBStart.y;
    return lineAX*lineBX + lineAY*lineBY;
}

/** check if two lines intersect
    @param {object} lineAStart - the first node of first line
    @param {object} lineAEnd - the second node of first line
    @param {object} lineBStart - the first node of second line 
    @param {object} lineBEnd - the second node of second line
    @return {boolean}
*/
/*
function intersect(lineAStart, lineAEnd, lineBStart, lineBEnd) {
    if (debugMode) {
        ctx.beginPath();
        ctx.moveTo(lineAStart.x, lineAStart.y);
        ctx.lineTo(lineAEnd.x, lineAEnd.y);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#00ff00';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lineBStart.x, lineBStart.y);
        ctx.lineTo(lineBEnd.x, lineBEnd.y);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#00ff00';
        ctx.stroke();
    }
    let lineAX = lineAEnd.x - lineAStart.x;
    let lineAY = lineAEnd.y - lineAStart.y;
    let lineBX = lineBEnd.x - lineBStart.x;
    let lineBY = lineBEnd.y - lineBStart.y;
    let s = (-lineAY * (lineAStart.x - lineBEnd.x) + lineAX *
        (lineAStart.y - lineBStart.y)) / (-lineBX * lineAY + lineAX * lineBY);
    let t = ( lineBX * (lineAStart.y - lineBStart.y) - lineBY *
        (lineAStart.x - lineBStart.x)) / (-lineBX * lineAY + lineAX * lineBY);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        return true; // Collision detected
    }
    return false; // No collision
}
*/
 /** mirror two dots
     brief Reflect point p along line through points p0 and p1
     * @param {object} p - point to reflect
     * @param {object} p0 - first point for reflection line
     * @param {object} p1 - second point for reflection line
     * @return {object}
     */
function mirrorPoint(p, p0, p1) {
    let dx = p1.x - p0.x;
    let dy = p1.y - p0.y;
    let a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
    let b = 2 * dx * dy / (dx * dx + dy * dy);
    let x = a * (p.x - p0.x) + b * (p.y - p0.y) + p0.x;
    let y = parseFloat(b) * parseFloat(p.x - p0.x) -
        parseFloat(a) * parseFloat(parseFloat(p.y) - p0.y) + parseFloat(p0.y);
    return {x: x, y: y};
}

/** mirror two vectors 
     Reflect vector p along line through points p0 and p1
     * @param {object} v - vector to reflect
     * @param {object} p0 - first point for reflection line
     * @param {object} p1 - second point for reflection line
     * @return {object}
*/
function mirrorVector(v, p0, p1) {
    let startP = {x: 0, y: 0};
    let endP = {x: v.x, y: v.y};
    let mstartP = mirrorPoint(startP, p0, p1);
    let mendP = mirrorPoint(endP, p0, p1);
    return {x: mendP.x-mstartP.x, y: mendP.y-mstartP.y};
}

 /** change the player status after collision
     * @param {Skateboarder} obj - the player
     * @param {objectp} lineStart - first point for reflection line
     * @param {object} lineEnd - second point for reflection line
     */
function collide(obj, lineStart, lineEnd) {
    obj.hit = 10;
    let mirroredVector = mirrorVector({x: obj.vx, y: obj.vy},
        lineStart, lineEnd);
    let intensity = Math.sqrt((mirroredVector.x-obj.vx) *
        (mirroredVector.x-obj.vx) + (mirroredVector.y-obj.vy) *
        (mirroredVector.y-obj.vy));
    let vertLine = {x: lineStart.y-lineEnd.y, y: lineEnd.x-lineStart.x};
    if (dotProduct( {x: 0, y: 0}, vertLine, {x: 0, y: 0}, mirroredVector) < 0) {
        vertLine.x = -vertLine.x;
        vertLine.y = -vertLine.y;
    }
    let vertLen = Math.sqrt(vertLine.x * vertLine.x + vertLine.y * vertLine.y);
    obj.vx = mirroredVector.x * Math.max(0.5, 1-collisionFriction*intensity);
    obj.vy = mirroredVector.y * Math.max(0.5, 1-collisionFriction*intensity);
    obj.vx *= (1-obj.friction);
    obj.vy *= (1-obj.friction);
    // vertical friction
    obj.vx = obj.vx* (1 - 0 * vertLine.x / vertLen);
    obj.vy = obj.vy* (1 - 0 * vertLine.y / vertLen);

    /* let newangle = (180 + Math.atan2(lineEnd.y-lineStart.y,
        lineEnd.x-lineStart.x) * 180 / Math.PI) % 180;*/
    // if ( newangle<-90 || newangle>90){
    //    newangle += 180;
    // }
    // newangle = newangle % 180;
    /*
    if ((Math.abs(newangle-obj.angle)%180) > 90){
        obj.valid = false;
        obj.friction = 0.5;
        obj.collisionR = 20;
    }*/
    // obj.angularV = (newangle-obj.angle)/20;
    // obj.angle = -(newangle-90);

    if (debugMode) {
        let vertStart={x: parseFloat(lineStart.x) +
            2000*(lineEnd.y-lineStart.y), y: parseFloat(lineStart.y) -
            2000*(lineEnd.x-lineStart.x)};
        let vertEnd={x: parseFloat(lineStart.x) -
            2000*(lineEnd.y-lineStart.y), y: parseFloat(lineStart.y) +
            2000*(lineEnd.x-lineStart.x)};
        ctx.beginPath();
        ctx.moveTo(vertStart.x, vertStart.y);
        ctx.lineTo(parseInt(vertEnd.x), parseInt(vertEnd.y));
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ff0000';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(obj.x, obj.y, intensity*5, 0, Math.PI*2);
        ctx.fillStyle = '#ff8000';
        ctx.fill();
    }
}

 /** check if the player will have collision with any trail
     * @param {Skateboarder} obj - the player
     */
function collision(obj) {
    if (trails.length == 0) return;
    let closestNode = {x: 0, y: 0, distance: W+H, i: 0, j: 0};
    let i;
    let j;
    for (i=0; i<trails.length; i++) {
        for (j=1; j<trails[i].length-1; j++) {
            let closestDistance = getDistance(obj, trails[i][j]);
            if (closestNode.distance >= closestDistance &&
                dotProduct(obj, {x: trails[i][j].x, y: trails[i][j].y},
                           obj, {x: obj.x + speedVectorContant * obj.vx,
                           y: obj.y + speedVectorContant * obj.vy}) >= 0) {
                closestNode.distance = closestDistance;
                closestNode.x = trails[i][j].x;
                closestNode.y = trails[i][j].y;
                closestNode.i = i;
                closestNode.j = j;
            }
        }
    }
    if (debugMode) {
        if (closestNode.x!=0 && closestNode.y!=0) {
            ctx.beginPath();
            ctx.moveTo(obj.x, obj.y);
            ctx.lineTo(closestNode.x, closestNode.y);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#000000';
            ctx.stroke();
        }
    }
    /*
    let speed = Math.sqrt(obj.x * obj.x + obj.y * obj.y);
    if (trails.length > 0){
        let thisTrail = trails[closestNode.i];
        let pos = closestNode.j;
        for (let offset=0; offset<2+parseInt(speed)/100; offset++){
            if (intersect(thisTrail[Math.max(0, pos-offset-1)], 
                          thisTrail[Math.max(0, pos-offset)], obj, 
                          {x:obj.x + speedVectorContant * obj.vx, 
                          y:obj.y + speedVectorContant * obj.vy})){
                collide(obj, thisTrail[Math.max(0, pos-offset-1)], 
                thisTrail[Math.max(0, pos-offset)]);
                return;
            }
            if (intersect(thisTrail[Math.min(thisTrail.length-1,
            pos+offset)], 
                          thisTrail[Math.min(thisTrail.length-1,
                          pos+offset+1)], obj, 
                          {x:obj.x + speedVectorContant * obj.vx,
                          y:obj.y + speedVectorContant * obj.vy})){
                collide(obj, thisTrail[Math.min(thisTrail.length-1,
                pos+offset)], thisTrail[Math.min(thisTrail.length-1,
                pos+offset+1)]);
                return;
            }
        }
    }
    */
    if ((getDistance(closestNode, obj) < obj.collisionR) && obj.vy < 0) {
        if (j+1>=trails[closestNode.i].length) {
            collide(obj, trails[closestNode.i][closestNode.j-1],
                trails[closestNode.i][closestNode.j]);
        } else {
            collide(obj, trails[closestNode.i][closestNode.j],
                trails[closestNode.i][closestNode.j+1]);
        }
        return;
    }
}

 /** do one frame in the simulation
 */
function simulate() {
    updateScreen();
    drawPlayer(skateBoarder);
    updatePlayer(skateBoarder);
    collision(skateBoarder);

    if (!paused) {
        window.requestAnimationFrame(simulate);
    }
}

 /** start the simulation
 */
function gameStart() {
    skateBoarder = new Skateboarder();
    drawTrailButton();
    eraseTrailButton();
    drawGraph();
    reset();
    restartButton();
    start();
    simulate();
}

gameStart();
