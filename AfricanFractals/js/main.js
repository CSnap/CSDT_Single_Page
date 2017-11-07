/** the main app*/
function canvasApp() { // eslint-disable-line no-unused-vars
    if (!canvasSupport()) {
        return;
    }

    let theCanvas = document.getElementById('editGrid');
    let context = theCanvas.getContext('2d');

    let button1 = document.getElementById('upRight');
    button1.addEventListener('click', setUpRight, false);
    let button2 = document.getElementById('downRight');
    button2.addEventListener('click', setDownRight, false);
    let button3 = document.getElementById('upLeft');
    button3.addEventListener('click', setUpLeft, false);
    let button4 = document.getElementById('downLeft');
    button4.addEventListener('click', setDownLeft, false);
    let button5 = document.getElementById('inactive');
    button5.addEventListener('click', setInactive, false);
    let button6 = document.getElementById('invisible');
    button6.addEventListener('click', setInvisible, false);
    let button7 = document.getElementById('generate');
    let buttonArray = [button1,button2,button3,button4,button5,button6];

    button7.addEventListener('click', generate, false);
    theCanvas.addEventListener('dblclick', doubleClickListener, false);

    let outputCanvas = document.getElementById('outputCanvas');
    let d = outputCanvas.getContext('2d');

    let dragIndex;
    let dragging;
    let mouseX;
    let mouseY;
    let dragHoldX;
    let dragHoldY;
    let timer;
    let targetX;
    let targetY;
    let resolution = 20;
    let objects;
    let gameState;
    let easeAmount = 1;
    let deletingPoint = false;
    let radius = 7;
    let lineType =-1;

    let totallength;

    init();
    /** Start the application*/
    function init() {
        objects = [];
        gameState = [];
        loadObjects();
        fractal = [];
        drawScreen();
        theCanvas.addEventListener('mousedown', mouseDownListener, false);
    }

    /** Load all of the points*/
    function loadObjects() {
        let tempX1;
        let tempY1;
        let tempX2;
        let tempY2;
        let tempType = 1;
        let tempXCoords = [80, 180, 240, 300, 400];
        let tempYCoords = [200, 200, 80, 200, 200];
        let tempRad = radius;
        let tempPoint = new Point(tempXCoords[0], tempYCoords[0], tempRad);
        objects.push(tempPoint);

        for (i = 0; i < tempXCoords.length - 1; i++) {
            tempX1 = tempXCoords[i];
            tempY1 = tempYCoords[i];
            tempX2 = tempXCoords[i + 1];
            tempY2 = tempYCoords[i + 1];

            tempSegment = new Segment(tempX1, tempY1, tempX2, tempY2, tempType);
            objects.push(tempSegment);
            tempPoint = new Point(tempX2, tempY2, tempRad);
            objects.push(tempPoint);
        }
        duplicateGameState();
    }

    /** Copy the whole game*/
    function duplicateGameState() {
        // deep copy objects
        let i;
        gameState.splice(0, gameState.length);
        for (i = 0; i < objects.length - 1; i++) {
            gameState.push(objects[i]);
        }
    }

    /** Draw screen with grid and lines*/
    function drawScreen() {
        context.fillStyle = '#fff';
        context.fillRect(0, 0, theCanvas.width, theCanvas.height);
        drawGrid();
        drawObjects();
    }

    /** Draw grid*/
    function drawGrid() {
        let w = theCanvas.width;
        let h = theCanvas.height;
        context.strokeStyle = 'lightgray';
        context.lineWidth = 1;
        for (x = 0; x <= w; x += 20) {
            for (y = 0; y <= h; y += 20) {
                context.beginPath();
                context.moveTo(x, 0);
                context.lineTo(x, h);
                context.stroke();
                context.moveTo(0, y);
                context.lineTo(w, y);
                context.stroke();
            }
        }
    }

    /** Draw the lines*/
    function drawObjects() {
        let i;
        // updateObjects();
        for (i = 0; i < objects.length; i++) {
            if (objects[i] instanceof Segment) {
                objects[i].drawToContext(context);
            }
        }
        for (i = 0; i < objects.length; i++) {
            if (objects[i] instanceof Point) {
                objects[i].drawToContext(context);
            }
        }
    }

    /** Set line type 1*/
    function setUpRight() {
        clearClasses();
        lineType = 1;
        button1.className = 'active';
    }

    /** Set line type 2*/
    function setDownRight() {
        clearClasses();
        lineType = 2;
        button2.className = 'active';
    }

    /** Set line type 3*/
    function setUpLeft() {
        clearClasses();
        lineType = 3;
        button3.className = 'active';
    }

    /** Set line type 4*/
    function setDownLeft() {
        clearClasses();
        lineType = 4;
        button4.className = 'active';
    }

    /** Set line type 5*/
    function setInactive() {
        clearClasses();
        lineType = 5;
        button5.className = 'active';
    }

    /** Set line type 6*/
    function setInvisible() {
        clearClasses();
        lineType = 6;
        button6.className = 'active';
    }

        /** clear button class names*/
    function clearClasses() {
        button1.className = '';
        button2.className = '';
        button3.className = '';
        button4.className = '';
        button5.className = '';
        button6.className = '';
    }

    /** wait for double click, then check hit and process event
    @param {event} evt - the mouse click event
    */
    function doubleClickListener(evt) {
        let tempX1;
        let tempX2;
        let tempY1;
        let tempY2;
        let tempType;
        let bRect = theCanvas.getBoundingClientRect();

        mouseX = parseInt((evt.clientX - bRect.left) *
        (theCanvas.width / bRect.width));

        mouseY = parseInt((evt.clientY - bRect.top) *
        (theCanvas.height / bRect.height));

        // check through segments for a hit
        helper(mouseX,mouseY,true);
        duplicateGameState();
    }

    function helper(x,y,isDoubleClick){
        for (let i = 0; i < objects.length; i++) {
            if (objects[i].hitTest(mouseX, mouseY) &&
            objects[i] instanceof Segment) {
                tempX1 = objects[i].x1;
                tempX2 = objects[i].x2;
                tempY1 = objects[i].y1;
                tempY2 = objects[i].y2;
                tempType = objects[i].segType;
                var tempX = x;
                var tempY = y;

                if(isDoubleClick){
                    // if caller is double click, construct left hand side segment, click spot,
                    // rhs segment and splice
                    lhs = new Segment(tempX1, tempY1, tempX, tempY, tempType);
                    middlePoint = new Point(tempX, tempY, radius);
                    rhs = new Segment(tempX, tempY, tempX2, tempY2, tempType);
                    objects.splice(i, 1);
                    objects.splice(i, 0, lhs, middlePoint, rhs);
                }else {
                    if(lineType > 0)
                        objects[i].segType = lineType;
                }
                drawScreen();
                return;
            }
        }
    }


    /** wait for mouse down, then check hit and process event
    @param {event} evt - the mouse down event
    @return {boolean} returns a true false value for... no reason
    */
    function mouseDownListener(evt) {
        let i;
        let bRect = theCanvas.getBoundingClientRect();
        mouseX = parseInt((evt.clientX - bRect.left) *
          (theCanvas.width / bRect.width));
        mouseY = parseInt((evt.clientY - bRect.top) *
          (theCanvas.height / bRect.height));

        // find which shape was clicked
        for (i = 0; i < objects.length; i++) {
            if (objects[i].hitTest(mouseX, mouseY)) {
                if (objects[i] instanceof Point) {
                    dragging = true;
                    dragIndex = i;
                    if (deletingPoint) {
                        deletingPoint = false;
                    }
                    break;
                }
            }
        }

        if (dragging) {
            console.log('dragging');
            window.addEventListener('mousemove', mouseMoveListener, false);

            // dragHoldX = mouseX - shapes[numPoints-1].x;
            // dragHoldY = mouseY - shapes[numPoints-1].y;
            dragHoldX = mouseX - objects[dragIndex].x;
            dragHoldY = mouseY - objects[dragIndex].y;


            targetX = round(Math.max(Math.min(mouseX - dragHoldX)), resolution);
            targetY = round(Math.max(Math.min(mouseY - dragHoldY)), resolution);
            if (!deletingPoint) {
                // start timer
                timer = setInterval(onTimerTick, 1000 / 30);
            }
        }

        theCanvas.removeEventListener('mousedown', mouseDownListener, false);
        window.addEventListener('mouseup', mouseUpListener, false);

        if (evt.preventDefault) {
            evt.preventDefault();
        } else if (evt.returnValue) {
            evt.returnValue = false;
        } // older IE
        return false;
    }

    /** round p to the nearest n
    @param {double} p - number to be rounded
    @param {double} n - the level of accuracy
    @return {double} returns a rounded value
    */
    function round(p, n) {
        return p % n < n / 2 ? p - (p % n) : p + n - (p % n);
    }

    /** timer event checking to see if dragged, and then moving the
    point around */
    function onTimerTick() {
        if (!deletingPoint) {
            objects[dragIndex].x = objects[dragIndex].x + easeAmount *
            (targetX - objects[dragIndex].x);
            objects[dragIndex].y = objects[dragIndex].y + easeAmount *
            (targetY - objects[dragIndex].y);
            if (dragIndex == 0) {
                console.log('first item dragged');
                objects[dragIndex + 1].x1 = round(Math.max(Math.min(targetX)),
                resolution);
                objects[dragIndex + 1].y1 = round(Math.max(Math.min(targetY)),
                resolution);
            } else if (dragIndex == objects.length - 1) {
                console.log('last item dragged');
                objects[dragIndex - 1].x2 = round(Math.max(Math.min(targetX)),
                resolution);
                objects[dragIndex - 1].y2 = round(Math.max(Math.min(targetY)),
                resolution);
            } else {
                console.log('middle item dragged');
                objects[dragIndex + 1].x1 = round(Math.max(Math.min(targetX)),
                resolution);
                objects[dragIndex + 1].y1 = round(Math.max(Math.min(targetY)),
                resolution);
                objects[dragIndex - 1].x2 = round(Math.max(Math.min(targetX)),
                resolution);
                objects[dragIndex - 1].y2 = round(Math.max(Math.min(targetY)),
                resolution);
            }
            drawScreen();
        }
        // stop the timer when the target position is reached (close enough)
        if ((!dragging) && (!deletingPoint) &&
        (Math.abs(objects[dragIndex].x - targetX) < 0.1) &&
        (Math.abs(objects[dragIndex].y - targetY) < 0.1)) {
            objects[dragIndex].x = round(Math.max(Math.min(targetX)),
            resolution);
            objects[dragIndex].y = round(Math.max(Math.min(targetY)),
            resolution);

            if (dragIndex == 0) {
                objects[dragIndex + 1].x1 = round(Math.max(Math.min(targetX)),
                resolution);
                objects[dragIndex + 1].y1 = round(Math.max(Math.min(targetY)),
                resolution);
            } else if (dragIndex == objects.length - 1) {
                objects[dragIndex - 1].x2 = round(Math.max(Math.min(targetX)),
                resolution);
                objects[dragIndex - 1].y2 = round(Math.max(Math.min(targetY)),
                resolution);
            } else {
                objects[dragIndex + 1].x1 = round(Math.max(Math.min(targetX)),
                resolution);
                objects[dragIndex + 1].y1 = round(Math.max(Math.min(targetY)),
                resolution);
                objects[dragIndex - 1].x2 = round(Math.max(Math.min(targetX)),
                resolution);
                objects[dragIndex - 1].y2 = round(Math.max(Math.min(targetY)),
                resolution);
            }

            duplicateGameState();

            // stop timer:
            clearInterval(timer);
        }
        drawScreen();
    }

        /** Deletes a point and related segment */
    function deletePoint() {
        let tempX;
        let tempY;
        let tempX1;
        let tempY1;
        let tempX2;
        let tempY2;
        let tempType;

        if (dragIndex == 0) {
            tempX = gameState[dragIndex + 2].x;
            tempY = gameState[dragIndex + 2].y;
            objects.splice(dragIndex, 2);
            objects[0].x = tempX;
            objects[0].y = tempY;
            dragIndex = '';
            drawScreen();
        } else if (dragIndex == objects.length - 1) {
            objects.splice(dragIndex - 1, 2);
            dragIndex = '';
            drawScreen();
        } else {
            tempX1 = gameState[dragIndex - 1].x1;
            tempY1 = gameState[dragIndex - 1].y1;
            tempType = gameState[dragIndex - 1].segType;
            tempX2 = gameState[dragIndex + 1].x2;
            tempY2 = gameState[dragIndex + 1].y2;
            tempSegment = new Segment(tempX1, tempY1, tempX2, tempY2, tempType);
            objects.splice(dragIndex - 1, 3, tempSegment);
            // dragIndex ='';

            drawScreen();
        }
        duplicateGameState();
        // deletingPoint = false;
    }

    /** event fires when mouse up (stop drag)
    @param {event} evt - the mouse up event
    */
    function mouseUpListener(evt) {
        theCanvas.addEventListener('mousedown', mouseDownListener, false);
        window.removeEventListener('mouseup', mouseUpListener, false);
        if (dragging) {
            dragging = false;
            window.removeEventListener('mousemove', mouseMoveListener, false);
        }else{
            helper(mouseX,mouseY,false);
        }
        let posX;
        let posY;
        let shapeRad = radius;
        let minX = shapeRad;
        let maxX = theCanvas.width - shapeRad;
        let minY = shapeRad;
        let maxY = theCanvas.height - shapeRad;

        // getting mouse position correctly
        let bRect = theCanvas.getBoundingClientRect();
        mouseX = (evt.clientX - bRect.left) * (theCanvas.width / bRect.width);
        mouseY = (evt.clientY - bRect.top) * (theCanvas.height / bRect.height);

        posX = mouseX - dragHoldX;
        posY = mouseY - dragHoldY;
        if ((posX < minX) || (posY < minY) || (posX > maxX) || (posY > maxY)) {
            deletingPoint = true;
            deletePoint();
        }
    }

    /** Drag point around screen
    @param {event} evt - the mouse move event
    */
    function mouseMoveListener(evt) {
        let posX;
        let posY;
        // getting mouse position correctly
        let bRect = theCanvas.getBoundingClientRect();
        mouseX = (evt.clientX - bRect.left) * (theCanvas.width / bRect.width);
        mouseY = (evt.clientY - bRect.top) * (theCanvas.height / bRect.height);

        posX = mouseX - dragHoldX;

        // posX = (posX < minX) ? minX : ((posX > maxX) ? maxX : posX);
        posY = mouseY - dragHoldY;
        // posY = (posY < minY) ? minY : ((posY > maxY) ? maxY : posY);

        targetX = posX;
        targetY = posY;
    }

    /** measures length between two points
    @param {int} x1 - x location of first point
    @param {int} y1 - y location of first point
    @param {int} x2 - x location of second point
    @param {int} y2 - y location of second point
    @return {double} returns a length
    */
    function getLength(x1, y1, x2, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        let almost = dx * dx + dy * dy;
        let ans = Math.sqrt(almost);
        return ans;
    }


    /** returns the angle between any too points (as measured from the
    x-axis)
    @param {int} x1 - x location of first point
    @param {int} y1 - y location of first point
    @param {int} x2 - x location of second point
    @param {int} y2 - y location of second point
    @return {double} returns an angle in rads
    */
    function getAngle(x1, y1, x2, y2) {
        let dy = y2 - y1;
        let dx = x2 - x1;
        let angrad = Math.atan2(dy, dx);
        return angrad;
    }


    /** creates the fractal from the seed shape*/
    function generate() {
        // convert objects.segments into start, lengths, and angle
        d.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

        let n = document.getElementById('iterations').value;

        d.save();
        let firstx = objects[0].x;
        let firsty = objects[0].y;
        d.beginPath();
        d.translate(firstx, firsty);
        d.moveTo(0, 0);

        // lengths of each segment
        let lengths = [];
        // angles to turn after each segment
        let angles = [];

        // record minimum and maximum x and y values
        let minx = 500;
        let miny = 500;
        let maxx = 0;
        let maxy = 0;

        // basically recording the seed shape into the two arrays
        let prevangle = 0;
        for (let i = 0; i <= objects.length; i++) {
            if (objects[i] instanceof Point) {
                if (objects[i].x < minx) minx = objects[i].x;
                if (objects[i].x > maxx) maxx = objects[i].x;
                if (objects[i].y < miny) miny = objects[i].y;
                if (objects[i].y > maxy) maxy = objects[i].y;
            }
            if (objects[i] instanceof Segment) {
                // length of segment
                let length = getLength(objects[i].x1, objects[i].y1,
                  objects[i].x2, objects[i].y2);
                // angle of segment from x axis
                let angle = getAngle(objects[i].x1, objects[i].y1,
                  objects[i].x2, objects[i].y2);
                // angle of segment relative to previous segment
                let relativeangle = angle - prevangle;
                prevangle = angle;

                console.log('length of segment: ' + length);
                console.log('angle from x axis: ' + (angle * 180 / Math.PI));
                console.log('angle from previous segment: ' + (relativeangle *
                  180 / Math.PI));

                lengths.push({id: i, length:length });
                angles.push(relativeangle);

                // d.rotate(relativeangle);
                // leg(n, length, relativeangle);
            }
        }
        totallength = maxx - minx;
        totalheight = maxy - miny;

        leg3(lengths, angles, n, 0, 1);

        // d.closePath();
        d.restore();
        d.stroke();
    }

    /** Draws segment
    @param {int} lengths - list of lengths
    @param {int} angles - list of angles
    @param {int} n - iteration number
    @param {int} m - current number
    @param {int} multiplier - shrinking size
    */
    function leg3(lengths, angles, n, m, multiplier) {
        if (m == n) {
            let anglerotated = 0;
            for (let i = 0, count = lengths.length; i < count; i++) {
                d.rotate(angles[i]);
                anglerotated += angles[i];
                let oid =lengths[i].id ;
                if(objects[oid].segType===6){
                    //move the current starting to next segment starting point
                    d.moveTo(lengths[i].length * multiplier, 0);
                    d.translate(lengths[i].length * multiplier, 0);
                }else{
                    d.lineTo(lengths[i].length * multiplier, 0);
                    d.stroke();
                    d.translate(lengths[i].length * multiplier, 0);
                }
            }
            d.rotate(anglerotated * -1);
        } else {
            let anglerotated2 = 0;
            for (let j = 0, count = lengths.length; j < count; j++) {
                d.rotate(angles[j]);
                anglerotated2 += angles[j];
                let oid =lengths[j].id;
                if(objects[oid].segType===2){
                    d.scale(1, -1);
                    leg3(lengths, angles, n, m+1, multiplier * lengths[j].length /
                      totallength);
                    d.scale(1, -1);
                }
                else if(objects[oid].segType===5){
                    d.lineTo(lengths[j].length * multiplier, 0);
                    d.stroke();
                    d.translate(lengths[j].length * multiplier, 0);
                }else {
                    leg3(lengths, angles, n, m+1, multiplier * lengths[j].length /
                      totallength);
                }
            }
            d.rotate(anglerotated2 *-1);
        }
    }
}
