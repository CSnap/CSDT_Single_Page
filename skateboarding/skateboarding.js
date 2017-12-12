/* Skateboarding app JS*/
let background = document.getElementById('background');
let canvas1 = document.getElementById('canvas1');
let canvas2 = document.getElementById('canvas2');
let ctxbg = background.getContext('2d');
let marginR = 270;
let W = window.innerWidth - marginR;
let H = window.innerHeight;
background.width = W;
background.height = H;
canvas1.width = W;
canvas1.height = H;
canvas2.width = W;
canvas2.height = H;

let scale = 1;
let topBarMargin = 70;
let sideBarMargin = 0;

let paused = true;
let drawButton = false;
let resetButton = false;
let eraseButton = false;
let scaleButton = false;
let homeX = 0;
let homeY = 5;
let mouseX = 0;
let mouseY = 0;
let CanvasOffsetX = W * 0.5;
let CanvasOffsetY = H * 0.5;
let trail = [];
let trails = [];
let mouseStatusDown = false;
let drawNewGrid = true;
let equation = 'y=x * 0.5';
let drawRemain = 2;
let scaleBeginMouse = {x: -1, y: -1};

let epsilon = 0.05;
let epsilonScale = 50;

let gravity = -9.8;
let fps = 60;
let debugMode = false;
let speedVectorContant = 2;
let collisionFriction = 0;

// variables of cloud save
let username;
let userID;

ctxbg = background.getContext('2d'); /* layer for background info and grid*/
ctx = canvas1.getContext('2d'); /* layer for trail*/
ctx2 = canvas2.getContext('2d'); /* layer for object*/
let skateboardpng = new Image();
skateboardpng.src ='images/skateboardman.png';
let skateboardhitpng = new Image();
skateboardhitpng.src ='images/skateboardmanhit.png';
let skateboardfailpng = new Image();
skateboardfailpng.src ='images/skateboardmanfail.png';
let flagpng = new Image();
flagpng.src ='images/flag.png';

/**
 * initial setup for all included files and jQuery
 */
function setup() {
    // include saveToCloud helper file
    let saveCloud = document.createElement('script');
    saveCloud.src = 'saveToCloud.js';
    document.getElementsByTagName('head')[0].appendChild(saveCloud);
    // jQuery setup
    $('html,body').css('cursor', 'move');
    $(window).resize(function() {
location.reload();
});
}


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
    this.vx = 1;
    this.vy = 0;
    this.angle = 0;
    this.angularV = 0;
    this.friction = 0;
    this.collisionR = 0.8;
    this.angularF = 0.9;
    this.valid = true;
    this.hit = 0;
    this.frontWheel = {x: 10, y: -20};
    this.rearWheel = {x: -10, y: -20};
    this.head = {x: 0, y: 20};
    this.onTrack = false;
    this.getSpeed = function() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    };
};


// Get the modal
let modal = document.getElementById('helpPop');
// Get the <span> element that closes the modal
let span = document.getElementsByClassName('closehelp')[0];
// When the user clicks the button, open the modal
/**
 * display the help pop up
 */
function displayHelp() {
    if (!paused) {
        start();
    }
    modal.style.display = 'block';
}
// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = 'none';
};
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
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
    if (scaleButton) {
        scaleBeginMouse.x = -1;
        scaleBeginMouse.y = -1;
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
    return {x: ((ctxc.x - CanvasOffsetX)/ parseFloat(scale*epsilonScale) ),
    y: -(ctxc.y + CanvasOffsetY - H)/ parseFloat(scale*epsilonScale)};
}

/** translate object coordinates to canvas coordinates
    @param {object} objc - the object coordinate
    @param {int} objc.x - the object x-coordinate
    @param {int} objc.y - the object y-coordinate
    @return {object}
*/
function objToCanvas(objc) {
    return {x: parseInt( parseFloat(scale*epsilonScale)
        * objc.x + CanvasOffsetX),
    y: parseInt(H - parseFloat(scale*epsilonScale) * objc.y - CanvasOffsetY)};
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
    // scale the canvas by mouse
    if (scaleButton && mouseStatusDown) {
        if (scaleBeginMouse.x == -1 && scaleBeginMouse.y == -1) {
            scaleBeginMouse.x = mouseX;
            scaleBeginMouse.y = mouseY;
        }
        let oMouse = canvasToObj({x: scaleBeginMouse.x, y: scaleBeginMouse.y});
        let delta = Math.max(-5, Math.min(5, (oldmouseY - mouseY)/5));
        if (delta < 0) {
            $('html,body').css('cursor', 'zoom-out');
        }
        if (delta > 0) {
            $('html,body').css('cursor', 'zoom-in');
        }
        scale = Math.min(10, Math.max(
        0.0005, scale*(1+0.05*parseFloat(delta))));
        let cnMouse = objToCanvas(oMouse);
        CanvasOffsetX += scaleBeginMouse.x - cnMouse.x;
        CanvasOffsetY -= scaleBeginMouse.y - cnMouse.y;
        drawNewGrid = true;
        updateScreen();
    }
    // put a new node to the trail
    if (drawButton && mouseStatusDown) {
        trail.push(objc);
        updateScreen();
        drawTrail(trail);
    }
    // erase any trails the mouse touches
    if (eraseButton && mouseStatusDown) {
        for (let i=0; i<trails.length; i++) {
            for (let j=1; j<trails[i].length-1; j++) {
                if (getDistance(objc, trails[i][j]) < epsilon * 10) {
                    trails.splice(i, 1);
                    return;
                }
            }
        }
        updateScreen();
        drawTrail(trail);
    }
    // move the canvas
    if (!drawButton && !eraseButton && !scaleButton && mouseStatusDown) {
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
    scale = Math.min(10, Math.max(0.0005, scale*(1+0.05*parseFloat(delta))));
    let cnMouse = objToCanvas(oMouse);
    CanvasOffsetX += mouseX - cnMouse.x;
    CanvasOffsetY -= mouseY - cnMouse.y;
    drawNewGrid = true;
    updateScreen();
}

/** print mouse location on canvas
@param {object} objc - the object coordinate
@param {float} objc.x - the object x-coordinate
@param {float} objc.y - the object y-coordinate
*/
function printMouse(objc) {
    ctxbg.clearRect(100, H-70, 200, 25);
    ctxbg.font = '20px Consolas';
    ctxbg.fillStyle = '#111111';
    let textSize0 = Math.max(0, 4 - parseInt(Math.abs(objc.x*10)).
        toString().length);
    let textSize1 = Math.max(0, 4 - parseInt(Math.abs(objc.y*10)).
        toString().length);
    ctxbg.fillText('x:'+objc.x.toFixed(textSize0), 100, H-50);
    ctxbg.fillText('y:'+objc.y.toFixed(textSize1), 200, H-50);
}

/** wait for keypush
@param {event} evt - the event
*/
function keyPush(evt) {
    if (evt.ctrlKey && evt.code === 'KeyZ') {
        trails.splice(trails.length-1, 1);
        updateScreen(trails);
    }
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

/** display all sample equations
*/
function clickSample() {
    uncheckAllButtons();
    document.getElementById('sampleEquation').classList.toggle('show');
}

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    let dropdowns = document.getElementsByClassName('dropdown-content');
    let i;
    for (i = 0; i < dropdowns.length; i++) {
      let openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
};

/** list the sample equations
@param {int} id - the id of the sample equation
*/
function listSample(id) {
    if (id == 0) {
        document.getElementById('equationInput').value = 'y=2';
        document.getElementById('equationStartX').value = '-10';
        document.getElementById('equationEndX').value = '10';
    }
    if (id == 1) {
        document.getElementById('equationInput').value = 'y=-0.5x';
        document.getElementById('equationStartX').value = '-15';
        document.getElementById('equationEndX').value = '25';
    }
    if (id == 2) {
        document.getElementById('equationInput').value = 'y=-0.3x-2';
        document.getElementById('equationStartX').value = '-10';
        document.getElementById('equationEndX').value = '30';
    }
    if (id == 3) {
        document.getElementById('equationInput').value = 'y=0.1xx';
        document.getElementById('equationStartX').value = '-10';
        document.getElementById('equationEndX').value = '6';
    }
    if (id == 4) {
        document.getElementById('equationInput').value = 'y=0.05*(x+5)*(x+5)';
        document.getElementById('equationStartX').value = '-17';
        document.getElementById('equationEndX').value = '7';
    }
    drawGraph();
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
@param {float} xc - x coordinate
@return {float}
*/
function calculateY(xc) {
    let expressionList = equation.split(' ');
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

/** draw a graph from an equation. The math equation is read from input
    The result of the equation is then calculated at every x coordinate
    to generate a trail
*/
function drawGraph() {
    uncheckAllButtons();
    equation = document.getElementById('equationInput').value;
    let stax = document.getElementById('equationStartX').value;
    let endx = document.getElementById('equationEndX').value;
    let equationList = equation.split('=');
    if (equationList.length != 2) {
        document.getElementById('graphOutput').value = 'Invalid Equation';
        return;
    }
    equation = equationList[1];
    if (equation[0] == '-') {
        equation = '0' + equation;
    }
    for (let id = 0; id < equation.length; id++) {
        if (equation[id] == '+' || equation[id] == '-' || equation[id] == '*'
        || equation[id] == '/' || equation[id] == ')' || equation[id] == '(') {
            equation = equation.slice(0, id) + ' ' + equation[id]
            + ' ' + equation.slice(id+1, equation.length);
            id += 2;
        } else if (equation[id+1] == 'x') {
            equation = equation.slice(0, id+1) + ' * '
            + equation.slice(id+1, equation.length);
            id += 3;
        }
    }
    for (let xc=parseFloat(stax); xc<parseFloat(endx); xc+= epsilon) {
        trail.push({x: xc, y: calculateY(xc)});
    }
    trails.push(trail);
    trail = [];
    document.getElementById('graphOutput').value = 'Graph Drawn';
    drawRemain += 1;
    updateScreen();
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
        ctx2.rotate(-obj.angle*Math.PI/180);
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
        ctx2.rotate(obj.angle*Math.PI/180);
        ctx2.translate(-x2, -y2);
    }
}

/** draw a trail
    @param {object[]} oneTrail - single trail
*/
function drawTrail(oneTrail) {
    if (oneTrail.length>0) {
        ctx.beginPath();
        let cxy = objToCanvas({x: oneTrail[0].x,
        y: oneTrail[0].y});
        ctx.moveTo(cxy.x, 2+cxy.y);
        for (let i=1; i<oneTrail.length; i++) {
            cxy = objToCanvas({x: oneTrail[i].x,
            y: oneTrail[i].y});
            ctx.lineTo(cxy.x, 2 * scale + cxy.y);
        }
        ctx.lineWidth = 3 * scale;
        ctx.strokeStyle = '#0086fc';
        ctx.stroke();

        ctx.beginPath();
        cxy = objToCanvas({x: oneTrail[0].x,
        y: oneTrail[0].y});
        ctx.moveTo(cxy.x, cxy.y);
        for (let i=1; i<oneTrail.length; i++) {
            cxy = objToCanvas({x: oneTrail[i].x,
            y: oneTrail[i].y});
            ctx.lineTo(cxy.x, cxy.y);
        }
        ctx.lineWidth = 3 * scale;
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

    let gridSize = 0.001;
    let maxgridsize = W/20/(scale*epsilonScale);
    for (let c = 0; gridSize <= maxgridsize; c++) {
        if (c % 3 == 1) { // alternate 2, 5, 10
            gridSize *= 1.25;
        }
        gridSize *= 2;
    }
    let textSize = Math.min(4, parseInt(scale*10).toString().length-1);
    for (let i = Math.round(o00.x/gridSize);
            i <= Math.round(oWH.x/gridSize); i++) {
        let pt = objToCanvas({x: gridSize*i, y: 0});
        // drawLabel
        let textY = Math.min(H-5, Math.max(corigin.y, 20+topBarMargin));
        ctxbg.font = '16px Consolas';
        ctxbg.fillStyle = '#111111';
        ctxbg.fillText((gridSize*i).toFixed(textSize), pt.x+1, textY-3);
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
        let textX = Math.min(W-sideBarMargin-45, Math.max(corigin.x, 0));
        ctxbg.font = '16px Consolas';
        ctxbg.fillStyle = '#111111';
        ctxbg.fillText((gridSize*i).toFixed(textSize), textX+1, pt.y-3);
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
        CanvasOffsetX -= parseInt(Math.min(1, skateBoarder.getSpeed()/10)
        * (scale*epsilonScale) * (skateBoarder.vx/fps));
        CanvasOffsetY -= parseInt(Math.min(1, skateBoarder.getSpeed()/10)
        * (scale*epsilonScale) * (skateBoarder.vy/fps));
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
/** reset every button
*/
function uncheckAllButtons() {
    $('html,body').css('cursor', 'move');
    drawButton = false;
    resetButton = false;
    eraseButton = false;
    scaleButton = false;
}

/** move button
*/
function moveButton() {
    uncheckAllButtons();
}

/** move button
*/
function zoomButton() {
    let before = scaleButton;
    uncheckAllButtons();
    if (before) {
        $('html,body').css('cursor', 'move');
    } else {
        $('html,body').css('cursor', 'zoom-in');
    }
    scaleButton = !before;
}

/** draw button
*/
function drawTrailButton() {
    if (drawRemain <= 0) {
        alert('You have no pencil left!\n\nPencils'
        , 'can be gained from entering math equations.');
    }
    let before = drawButton;
        uncheckAllButtons();
    if (before) {
        $('html,body').css('cursor', 'move');
    } else {
        $('html,body').css('cursor', 'default');
    }
    drawButton = !before;
    drawRemain -= 1;
}

/** erase button
*/
function eraseTrailButton() {
    let before = eraseButton;
        uncheckAllButtons();
    if (before) {
        $('html,body').css('cursor', 'move');
    } else {
        $('html,body').css('cursor', 'default');
    }
    eraseButton = !before;
}

/** start button
*/
function start() {
        uncheckAllButtons();
    paused = !paused;
    if (!paused) {
        simulate();
    }
}

/** restart button
*/
function restartButton() {
        uncheckAllButtons();
    scale = 1;
    CanvasOffsetX = W * 0.5 - homeX * epsilonScale;
    CanvasOffsetY = H * 0.5 - homeY * epsilonScale;
    drawNewGrid = true;
    updateScreen();
    restart();
}

/** restart the game
*/
function restart() {
    uncheckAllButtons();
    skateBoarder = new Skateboarder();
    updateScreen();
    drawPlayer(skateBoarder);
    paused = true;
}

/** reset to start
*/
function reset() {
    let before = resetButton;
    restart();
    if (before) {
        $('html,body').css('cursor', 'move');
    } else {
        $('html,body').css('cursor', 'default');
    }
    resetButton = !before;
}

/** user login
*/
function userLogin() {
    uncheckAllButtons();
    let cloud = new CloudSaver();
    let errorBack;
    cloud.loginPopup(username, errorBack);
    if (!errorBack) {
        alert('The email or password is incorrect');
        return;
    }
    cloud.getUser(userID, errorBack);
    if (!errorBack) {
        alert('Please log in');
    }
}

/** save the trails drawn and spawn location
*/
function saveGameButton() {
    uncheckAllButtons();
    let dt = new Date();
    dt.getDate();
    let pName;
    let saveName = prompt('Please enter the name of the save file:',
    'Save file ' + (parseInt(dt.getMonth())+1).toString() +
    '/' + dt.getDate());

    if (saveName == null || saveName == '') {
        pName = 'Invalid name';
        return;
    } else {
        pName = saveName;
    }
    alert(pName);
    let cloud = new CloudSaver();
    let savefile;
    let callback;
    let errorBack;
    cloud.saveFile(savefile, callback, errorBack);
    if (errorBack) {
        alert('Unable to save the file');
    }
    let projectID;
    let callback;
    cloud.loadProject(projectID, callback, errorBack);
    if (errorBack) {
        cloud.createProject(
        pName, applicationID, dataID, imgID, callback, errorBack);
        projectID = callback;
    } else {
        cloud.updateProject(
        projectID, pName, applicationID, dataID, imgID, callback, errorBack);
    }
}

/** load the trails drawn and spawn location
*/
function loadGameButton() {
    uncheckAllButtons();
    let cloud = new CloudSaver();
    let callback;
    let errorBack;
    cloud.getUser(userID, errorBack);
    if (!errorBack) {
        alert('Please log in');
    }
    cloud.listProject(userID, callback, errorBack);
    if (errorBack) {
        alert('No saved files');
        return;
    } else {
        console.log(callback);
    }
}

/** update the player position based on speed and gravity.
    @param {Skateboarder} obj the player in game
*/
function updatePlayer(obj) {
    obj.x += obj.vx/fps;
    obj.y += obj.vy/fps;
    obj.vy += gravity/fps;
    obj.angle += obj.angularV/fps;
    obj.angularV *= obj.angularF;
    // auto center
    if (obj.hit == 0) {
        obj.angularV += 0.05*(0-obj.angle);
    }
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


 /** find the shortest distance from dot to line
     brief Reflect point p along line through points p0 and p1
     * @param {object} p0 - dot
     * @param {object} p1 - first point of line
     * @param {object} p2 - second point of line
     * @return {object}
     */
function dotLineDistance(p0, p1, p2) {
    // ablsolute distance between dot and line
    let vertDistance = Math.abs(
    (p2.y-p1.y)*p0.x - (p2.x-p1.x)*p0.y + p2.x*p1.y - p2.y*p1.x)
    /Math.sqrt((p2.y-p1.y) * (p2.y-p1.y) + (p2.x-p1.x) * (p2.x-p1.x));
    // let dis0 = getDistance(p0, p1);
    // let dis1 = getDistance(p0, p2);
    return vertDistance;
}


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
    obj.hit = 30;
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
    // new angle after collide with track
    let newangle = (Math.atan2(lineEnd.y-lineStart.y, lineEnd.x-lineStart.x)
        * 180 / Math.PI);

    let vertLen = Math.sqrt(vertLine.x * vertLine.x + vertLine.y * vertLine.y);
    if (dotLineDistance(obj, lineStart, lineEnd) < 0.3 * obj.collisionR) {
        console.log('crashed');
        obj.vx = mirroredVector.x *
        Math.max(0.5, 1-collisionFriction*intensity);
        obj.vy = mirroredVector.y *
        Math.max(0.5, 1-collisionFriction*intensity);
        obj.vx *= (1-obj.friction);
        obj.vy *= (1-obj.friction);
    } else {
        obj.vx += 2 * vertLine.x / vertLen;
        obj.vy += 2 * vertLine.y / vertLen;
    }
    // vertical friction
    if (!obj.onTrack) {
        obj.vx = obj.vx* (1 - 0 * vertLine.x / vertLen);
        obj.vy = obj.vy* (1 - 0 * vertLine.y / vertLen);
    }
    // if ( newangle<-90 || newangle>90){
    //    newangle += 180;
    //
    // newangle = newangle % 180;
    /*
    if ((Math.abs(newangle-obj.angle)%180) > 90){
        obj.valid = false;
        obj.friction = 0.5;
        obj.collisionR = 20;
    }*/
    obj.angularV += 3*(newangle-obj.angle);
    // obj.angle = newangle;
}

 /** check if the player will have collision with any trail
     * @param {Skateboarder} obj - the player
     */
function collision(obj) {
    if (trails.length == 0) return;
    let closestNode = {x: 0, y: 0, distance: W+H, i: -1, j: -1};
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
    if (closestNode.j>0 && closestNode.i>=0) {
        if ((dotLineDistance(obj, trails[closestNode.i][closestNode.j-1],
             trails[closestNode.i][closestNode.j]) < obj.collisionR) &&
            getDistance(closestNode, {x: obj.x+obj.head.x, y: obj.y+obj.head.y})
            < Math.min(getDistance(closestNode, {x: obj.x+obj.frontWheel.x,
                                   y: obj.y+obj.frontWheel.y}),
                       getDistance(closestNode, {x: obj.x+obj.rearWheel.x,
                                   y: obj.y+obj.rearWheel.y}))) {
                collide(obj, trails[closestNode.i][closestNode.j-1],
                        trails[closestNode.i][closestNode.j]);
                obj.onTrack = true;
            return;
        }
    }
    obj.onTrack = false;
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
    displayHelp();
    skateBoarder = new Skateboarder();
    // filthy way to bypass eslint's never used check
    if (false) {
        moveButton();
        zoomButton();
        drawTrailButton();
        eraseTrailButton();
        drawGraph();
        reset();
        restartButton();
        start();
        clickSample();
        listSample();
        saveGameButton();
        loadGameButton();
        userLogin();
    }
    simulate();
}
setup();
gameStart();
