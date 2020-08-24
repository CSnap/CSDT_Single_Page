/* eslint-disable */

const myCanvas = document.getElementById('myCanvas');
let beadSize = 5;
let beadCostume = "./img/bead-default.png";
let wampumCostume = "";
let beadDesign = "point";
let scale = 10;
let beads = [];
let beadUndoBuffer = [];
let currBeadLength = 0;
let currBufferLength = 0;

let hideGrid = false;
let showCoordinatesInCorner = false;
let beadImage = new Image();
// image.src = beadCostume;
var svg = document.querySelector('svg');

var xml = new XMLSerializer().serializeToString(svg);

var convertImg = xml.replace(/#000000/g, $('#color').val());
var svg64 = btoa(convertImg);
var b64Start = 'data:image/svg+xml;base64,';
var image64 = b64Start + svg64;
beadImage.src = image64;
// image.style.border = "1px solid black";




class Wampum {

    constructor(initPoint, initColor, canvas, pattern = beadDesign ) {
        this._initPoint = {
            x: initPoint.x,
            y: initPoint.y
        };
        this._initColor = initColor;
        this._ctx = canvas ? canvas.getContext('2d') : undefined;

        this._endPoint = {
            x: 0,
            y: 0
        }
        this._topPoint = {
            x: 0,
            y: 0
        }

        this._rows = 0;
        this._iterColor = "#ffffff";

        this._linearRowLength = 0;
        this._linearPreNum = 0;
        this._linearPostNum = 0;

        this._triRowGroup = 0;
        this._triRowPrePost = 0;

        this._direction = 0;

        this._pattern = pattern;
    };

    setEndPoint(endPoint) {
        this._endPoint = {
            x: endPoint.x,
            y: endPoint.y
        };
    };

    setTriangle(topPoint, endPoint) {

        this._topPoint = {
            x: topPoint.x,
            y: topPoint.y
        }

        this._endPoint = {
            x: endPoint.x,
            y: endPoint.y
        };

    };

    setLinearIteration(rowLength, pre, post, rows, direction, color) {

        this._linearRowLength = rowLength;
        this._linearPreNum = pre;
        this._linearPostNum = post;

        this._rows = rows;
        this._direction = direction;
        this._iterColor = color;

    };

    setTriangleIteration(group, num, rows, direction, color) {

        this._triRowGroup = group;
        this._triRowPrePost = num;

        this._rows = rows;
        this._direction = direction;
        this._iterColor = color;
    };

    stamp(point = this._initPoint, color = this._initColor) {
        
        this._ctx.save();
        this._ctx.scale(1, 1);

        this._ctx.beginPath();
        this._ctx.arc(point.x, point.y, beadSize, 0, Math.PI * 2, false); // Outer circle
        this._ctx.arc(point.x-1.8, point.y-1.8, scale/5, 0, Math.PI*2, true)
        // ctx.arc(10,10,10,0,Math.PI*2, false); // outer (filled)
        // ctx.arc(5,5,2.5,0,Math.PI*2, true); // outer (unfills it)
        
        // this._ctx.drawImage(this._beadImage, point.x-5,point.y-5, 10, 10);





        this._ctx.fillStyle = color;
        this._ctx.fill();

        // this._ctx.stroke();


        this._ctx.restore();

    };

    line(start = this._initPoint, end = this._endPoint, color = this._initColor) {

        let linePoints = [];
        // User enters same point twice
        if (start.x == end.x && start.y == end.y) {
            this.stamp();
            linePoints.push(this._initPoint);
        } else if (start.x == end.x) { //vertical lines
            for (let i = Math.min(start.y, end.y); i <= Math.max(start.y, end.y); i = i + scale) {
                let current = {
                    x: Math.round(start.x/ 10) * 10,
                    y: Math.round(i/10)*10
                }
                let currentBead = new Wampum(current, color, myCanvas);
                currentBead.stamp();
                linePoints.push(current);
            }
        } else if (start.y == end.y) { //Horizontal lines
            for (let i = Math.min(start.x, end.x); i <= Math.max(start.x, end.x); i = i + scale) {
                // console.log("i: " + i);
                let current = {
                    x: Math.round(i/ 10) * 10,
                    y: Math.round(start.y/ 10) * 10
                }


                let currentBead = new Wampum(current, color, myCanvas);
                currentBead.stamp();
                linePoints.push(current);
            }
        } else {
            let m = (end.y - start.y) / (end.x - start.x);
            let b = start.y - m * start.x;
            if (Math.abs(m) <= 1.0) {
                let startX = (start.x < end.x) ? start.x : end.x;
                let endX = (start.x < end.x) ? end.x : start.x;

                for (let i = startX; i <= endX; i = i + scale) {
                    let doubleY = m * i + b;
                    let intY = doubleY.toFixed(0);
                    if (Math.abs(doubleY - intY) >= 0.5) {
                        intY = (doubleY >= 0.0) ? (intY + 1) : (intY - 1);
                    }
                    let current = {
                        x: Math.round(i/ 10) * 10,
                        y: Math.round(intY/ 10) * 10
                    }
                    
                    let currentBead = new Wampum(current, color, myCanvas);
                    currentBead.stamp();
                    linePoints.push(current);
                }
            } else {
                let startY = (start.y < end.y) ? start.y : end.y;
                let endY = (start.y < end.y) ? end.y : start.y;
                for (let i = startY; i <= endY; i = i + scale) {

                    let doubleX = (i - b) / m;
                    let intX = doubleX.toFixed(0);
                    if (Math.abs(doubleX - intX) >= 0.5)
                        intX = (doubleX >= 0.0) ? (intX ++) : (intX --);
                    
                        

                    let current = {
                        x: Math.round(intX / 10) * 10,
                        y:Math.round(i / 10) * 10
                    }
                
                    let currentBead = new Wampum(current, color, myCanvas);
                    currentBead.stamp();
                    linePoints.push(current);
                }
            }
        }

        return linePoints;
    };

    rectangle() {
        let start = this._initPoint;
        let end = this._endPoint;

        for (let i = Math.min(start.y, end.y); i <= Math.max(start.y, end.y); i = i + scale) {
            for (let j = Math.min(start.x, end.x); j <= Math.max(start.x, end.x); j = j + scale) {
                let current = {
                    x: j,
                    y: i
                }
                let currentBead = new Wampum(current, this._initColor, myCanvas);
                currentBead.stamp();
            }
        }

    };

    triangle() {
        let start = this._initPoint;
        let end = this._endPoint;
        let top = this._topPoint;

        let line1 = this.line(start, top);
        let line2 = this.line(top, end);
        let line3 = this.line(start, end);

        for(let i = 0; i < line1.length; i++ ){
            if(line2[i]!= null){
                this.line(line1[i], line2[i]);

            }
            if(line3[i]!= null){
                this.line(line1[i], line3[i]);

            }

        }

        for(let i = 0; i < line2.length; i++ ){
            if(line1[i]!= null){
                this.line(line2[i], line1[i]);
            }
            if(line3[i]!= null){
                this.line(line2[i], line3[i]);

            }
        }

        for(let i = 0; i < line3.length; i++ ){
            if(line1[i]!= null){
                this.line(line1[i], line3[i]);
                // console.log( this.line(line1[i], line3[i]));
            }
            if(line2[i]!= null){
                this.line(line2[i], line3[i]);
            }
        }
    }

    linearIteration(color = this._initColor) {
        let incY, posDir;

        if (this._direction == "+y") {
            incY = true;
            posDir = false;
        } else if (this._direction == "-y") {
            incY = true;
            posDir = true;
        } else if (this._direction == "+x") {
            incY = false;
            posDir = true;
        } else {
            incY = false;
            posDir = false;
        }

        let linePoints = [];
        let start = {
            x:this._initPoint.x,
            y:this._initPoint.y,
        };
        let startLength = this._linearRowLength;
        let inc1 = this._linearPreNum;
        let inc2 = this._linearPostNum;
        let rows = this._rows;

        if (incY) {
            let newX = start.x + (startLength * scale) - scale;
     
            for (let i = 0; i < rows; i++) {
                if (newX < start.x) {
                    for (let j = newX; j <= start.x; j = j + scale) {
                        if (j >= -500 && j <= 500 && start.y >= -500 && start.y <= 500) {
                            let current = {
                                x: j,
                                y: start.y
                            }
                            let currentBead = new Wampum(current, color, myCanvas);
                            currentBead.stamp()
                            linePoints.push(current);
                        }
                    }
                } else {
                    for (let j = start.x; j <= newX; j = j + scale) {
                        if (j >= -500 && j <= 500 && start.y >= -500 && start.y <= 500) {
                            let current = {
                                x: j,
                                y: start.y
                            }
                            let currentBead = new Wampum(current, color, myCanvas);
                            currentBead.stamp()
                            linePoints.push(current);
                        }
                    }
                }
                if (posDir) {
                    start.y = start.y + scale;
                } else {
                    start.y = start.y - scale;
                }
                start.x -= (inc1 * scale);
                newX += (inc2 * scale);
            }
        } else {
            let newY = start.y + (startLength * scale) - scale;
            // console.log(start.y + " " + startLength + " " + scale);
            for (let i = 0; i < rows; i++) {
                if (newY < start.y) {
                    for (let j = newY; j <= start.y; j = j + scale) {
                        if (start.x <= 500 && start.x >= -500 && j <= 500 && j >= -500) {
                            let current = {
                                x: start.x,
                                y: j
                            }
                            let currentBead = new Wampum(current, color, myCanvas);
                            currentBead.stamp();
                            // console.log(current);
                        }
                    }

                } else {
                    for (let j = start.y; j <= newY; j = j + scale) {
                        if (start.x >= -500 && start.x <= 500 && j >= -500 && j <= 500) {
                            let current = {
                                x: start.x,
                                y: j
                            }
                            let currentBead = new Wampum(current, color, myCanvas);
                            currentBead.stamp();
                        }
                    }
                    // console.log("newY greater than");
                }
                if (posDir) {
                    start.x = start.x + scale;
                } else {
                    start.x = start.x - scale;
                }
                start.y -= (inc1 * scale);
                newY += (inc2 * scale);
            }
        }
        return linePoints;
    }

    triangleIteration() {

        let start = {
            x: this._initPoint.x,
            y: this._initPoint.y
        };
        let steps = this._triRowGroup;
        let exSteps = this._triRowPrePost;
        let width = 1 * scale;
        let cycles = this._rows;
        let incY;
        let posDir;
        let fill = true;

        let tempSteps = 0;
        let lastLoop = false;

        let direction = this._direction;
        if (this._direction == "+y") {
            incY = true;
            posDir = false;
        } else if (this._direction == "-y") {
            incY = true;
            posDir = true;
        } else if (this._direction == "+x") {
            incY = false;
            posDir = true;
        } else {
            incY = false;
            posDir = false;
        }
        let current;
        let currentBead;
        for (let i = 0; i <= cycles; i++) {
            for (let j = 0; j < tempSteps; j = j + scale) {
                if (!incY) {
                    for (let k = 0; k < Math.abs(width); k = k + scale) {
                        if (start.x + k > 500 || start.x + k < -500)
                            break;
                        if (start.y + j > 500 || start.y + j < -500)
                            continue;
                        current = {
                            x: width < 0 ? ((start.x - k) - scale) * (posDir ? 1 : -1) : ((start.x + k) - scale) * (posDir ? 1 : -1),
                            y: (start.y + j)
                        }
                        currentBead = new Wampum(current, this._initColor, myCanvas);
                        currentBead.stamp();
                        if (j != 0) {
                            if (start.y - j < -500 || start.y - j > 500)
                                continue;
                            current = {
                                x: width < 0 ? ((start.x - k) - scale) * (posDir ? 1 : -1) : ((start.x + k) - scale) * (posDir ? 1 : -1),
                                y: (start.y - j)
                            }
                            currentBead = new Wampum(current, this._initColor, myCanvas);
                            currentBead.stamp();
                        }
                        if (!fill)
                            break;
                        continue;
                    }
                } else {

                    for (let k = 0; k <= Math.abs(width); k = k + scale) {

                        if ((width < 0 && (start.y - k < -500 || start.y - k > 500)) || (
                                width >= 0 && (start.y + k > 500 || start.y + k < -500)))
                            break;
                        if (start.x + j < -500 || start.x + j > 500)
                            continue;
                        current = {
                            x: (start.x + j),
                            y: width < 0 ? ((start.y - k) + scale) * (posDir ? 1 : -1) : ((start.y + k) - scale) * (posDir ? 1 : -1),
                        }
                        currentBead = new Wampum(current, this._initColor, myCanvas);
                        currentBead.stamp();
                        if (j != 0) {
                            if (start.x - j < -500 || start.x - j > 500)
                                continue;
                            current = {
                                x: (start.x - j),
                                y: width < 0 ? ((start.y - k) - scale) * (posDir ? 1 : -1) : ((start.y + k) - scale) * (posDir ? 1 : -1),
                            }
                            currentBead = new Wampum(current, this._initColor, myCanvas);
                            currentBead.stamp();
                        }
                        if (!fill)
                            break;
                        continue;
                    }

                }
            }


            tempSteps += steps;
            if (incY) {


                start.y += width;


            } else {
                // start.x += width;

                start.x += width;

            }
            if (cycles - i <= 1) {

                if (width < 0) {

                    exSteps *= -10;
                    width = exSteps;
                } else {
                    width = exSteps;
                }
            }


            if (lastLoop) {
                break;
            }

        }
    }

    displayBeads() {
        if (this._pattern == "point") {
            this.stamp();
        } else if (this._pattern == "line") {
            this.line();
        } else if (this._pattern == "rectangle") {
            this.rectangle();
        } else if (this._pattern == "triangle") {
            this.triangle();
        } else if (this._pattern == "linear-iteration") {
            this.linearIteration();
        } else if (this._pattern == "triangle-iteration") {
            this.triangleIteration();
        }
    }

    setAdditionalParams(endPoint, topPoint, rows, iterColor, linearRowLength, linearPreNum,
        linearPostNum, triRowGroup, triRowPrePost, direction) {

        this._endPoint = {
            x: endPoint.x,
            y: endPoint.y
        }
        this._topPoint = {
            x: topPoint.x,
            y: topPoint.y
        }

        this._rows = rows;
        this._iterColor = iterColor;

        this._linearRowLength = linearRowLength;
        this._linearPreNum = linearPreNum;
        this._linearPostNum = linearPostNum;

        this._triRowGroup = triRowGroup;
        this._triRowPrePost = triRowPrePost;

        this._direction = direction;
 
    }

    /**
     * @return {Object} a serialized version of this bead for saving
     */
    serialize() {
        console.log(this._beadImage);
        return {
            'initPoint': this._initPoint,
            'initColor': this._initColor,
            'endPoint': this._endPoint,
            'topPoint': this._topPoint,
            'rows': this._rows,
            'iterColor': this._iterColor,
            'linearRowLength': this._linearRowLength,
            'linearPreNum': this._linearPreNum,
            'linearPostNum': this._linearPostNum,
            'triRowGroup': this._triRowGroup,
            'triRowPrePost': this._triRowPrePost,
            'direction': this._direction,
            'pattern': this._pattern,
          

        };
    }
}

function hexToRgb(color) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    color = color.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });
    
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : {
        r: 0,
        g: 0,
        b: 0
    };
}


function createGrid() {
    const ctx = myCanvas.getContext('2d');

    var grid_size = 10;

    var x_axis_starting_point = {
        number: 1,
        suffix: ''
    };
    var y_axis_starting_point = {
        number: 1,
        suffix: ''
    };

    var canvas_width = Math.floor(myCanvas.width / 100) * 100;
    var canvas_height = Math.floor(myCanvas.width / 100) * 100;


    var num_lines_x = Math.floor(canvas_height / grid_size);
    var num_lines_y = Math.floor(canvas_width / grid_size);

    var adjust_x = (myCanvas.height % 100) / 2;
    var adjust_y = (myCanvas.width % 100) / 2;


    var x_axis_distance_grid_lines = num_lines_x / 2;
    var y_axis_distance_grid_lines = num_lines_y / 2;

    // console.log(adjust_x );
    ctx.translate(adjust_x, adjust_y);

    // Draw grid lines along X-axis
    for (var i = 0; i <= num_lines_x; i++) {
        ctx.beginPath();
        ctx.lineWidth = 1;

        // If line represents X-axis draw in different color
        if (i == x_axis_distance_grid_lines)
            ctx.strokeStyle = "#000000";
        else
            ctx.strokeStyle = "#e9e9e9";

        if (i == num_lines_x) {
            ctx.moveTo(0, grid_size * i);

            ctx.lineTo(canvas_width, grid_size * i);
        } else {
            ctx.moveTo(0, grid_size * i + 0.5);

            ctx.lineTo(canvas_width, grid_size * i + 0.5);
        }
        ctx.stroke();
    }

    // Draw grid lines along Y-axis
    for (i = 0; i <= num_lines_y; i++) {
        ctx.beginPath();
        ctx.lineWidth = 1;

        // If line represents X-axis draw in different color
        if (i == y_axis_distance_grid_lines)
            ctx.strokeStyle = "#000000";
        else
            ctx.strokeStyle = "#e9e9e9";

        if (i == num_lines_y) {
            ctx.moveTo(grid_size * i, 0);
            ctx.lineTo(grid_size * i, canvas_height);
        } else {
            ctx.moveTo(grid_size * i + 0.5, 0);
            ctx.lineTo(grid_size * i + 0.5, canvas_height);
        }
        ctx.stroke();
    }

    // Translate to the new origin. Now Y-axis of the canvas is opposite to the Y-axis of the graph. So the y-coordinate of each element will be negative of the actual
    ctx.translate(y_axis_distance_grid_lines * grid_size, x_axis_distance_grid_lines * grid_size);

    // Ticks marks along the positive X-axis
    for (i = 5; i < (num_lines_y - y_axis_distance_grid_lines); i = i + 5) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";

        // Draw a tick mark 6px long (-3 to 3)
        ctx.moveTo(grid_size * i + 0.5, -3);
        ctx.lineTo(grid_size * i + 0.5, 3);
        ctx.stroke();

        // Text value at that point
        ctx.font = '9px Arial';
        ctx.textAlign = 'start';
        ctx.fillText(x_axis_starting_point.number * i + x_axis_starting_point.suffix, grid_size * i - 2, 15);
    }

    // Ticks marks along the negative X-axis
    for (i = 5; i < y_axis_distance_grid_lines; i = i + 5) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";

        // Draw a tick mark 6px long (-3 to 3)
        ctx.moveTo(-grid_size * i + 0.5, -3);
        ctx.lineTo(-grid_size * i + 0.5, 3);
        ctx.stroke();

        // Text value at that point
        ctx.font = '9px Arial';
        ctx.textAlign = 'end';
        ctx.fillText(-x_axis_starting_point.number * i + x_axis_starting_point.suffix, -grid_size * i + 3, 15);
    }

    // Ticks marks along the positive Y-axis
    // Positive Y-axis of graph is negative Y-axis of the canvas
    for (i = 5; i < (num_lines_x - x_axis_distance_grid_lines); i = i + 5) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";

        // Draw a tick mark 6px long (-3 to 3)
        ctx.moveTo(-3, grid_size * i + 0.5);
        ctx.lineTo(3, grid_size * i + 0.5);
        ctx.stroke();

        // Text value at that point
        ctx.font = '9px Arial';
        ctx.textAlign = 'start';
        ctx.fillText(-y_axis_starting_point.number * i + y_axis_starting_point.suffix, 8, grid_size * i + 3);
    }

    // Ticks marks along the negative Y-axis
    // Negative Y-axis of graph is positive Y-axis of the canvas
    for (i = 5; i < x_axis_distance_grid_lines; i = i + 5) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000000";

        // Draw a tick mark 6px long (-3 to 3)
        ctx.moveTo(-3, -grid_size * i + 0.5);
        ctx.lineTo(3, -grid_size * i + 0.5);
        ctx.stroke();

        // Text value at that point
        ctx.font = '9px Arial';
        ctx.textAlign = 'start';
        ctx.fillText(y_axis_starting_point.number * i + y_axis_starting_point.suffix, 8, -grid_size * i + 3);
    }
}

// Catches if user resizes the screen
function updateCanavs() {
    const ctx = myCanvas.getContext('2d');
    ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);

    // Dynamically resizes canvas and data form
    if ($(window).width() < 992 && $('#canvas-container').hasClass('col-6')) {
        $('#canvas-container').toggleClass('col-6 col-12');
        $('#data-container').toggleClass('col-6 col-12');
    } else if ($(window).width() >= 992 &&
        $('#canvas-container').hasClass('col-12')) {
        $('#canvas-container').toggleClass('col-12 col-6');
        $('#data-container').toggleClass('col-12 col-6');
    }

    myCanvas.width = (parseInt(window.getComputedStyle(myCanvas).width) - 4);
    myCanvas.height = myCanvas.width;

    let beadWidth = myCanvas.width / 2;

    if (!hideGrid) {
        createGrid();
    } else {

        var canvas_width = Math.floor(myCanvas.width / 100) * 100;
        var canvas_height = Math.floor(myCanvas.width / 100) * 100;

        var num_lines_x = Math.floor(canvas_height / scale);
        var num_lines_y = Math.floor(canvas_width / scale)

        var adjust_x = (myCanvas.height % 100) / 2;
        var adjust_y = (myCanvas.width % 100) / 2;


        var x_axis_distance_grid_lines = num_lines_x / 2;
        var y_axis_distance_grid_lines = num_lines_y / 2;
        ctx.translate(adjust_x, adjust_y)
        ctx.translate(y_axis_distance_grid_lines * scale, x_axis_distance_grid_lines * scale);

    }



    for (var i = 0; i < beads.length; i++) {
        beads[i].displayBeads();
    }

}

function clearCanvas() {
    const ctx = myCanvas.getContext('2d');
    if (confirm('WARNING, this will delete all beads')) {
        ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);

        // Dynamically resizes canvas and data form
        if ($(window).width() < 992 && $('#canvas-container').hasClass('col-6')) {
            $('#canvas-container').toggleClass('col-6 col-12');
            $('#data-container').toggleClass('col-6 col-12');
        } else if ($(window).width() >= 992 &&
            $('#canvas-container').hasClass('col-12')) {
            $('#canvas-container').toggleClass('col-12 col-6');
            $('#data-container').toggleClass('col-12 col-6');
        }

        myCanvas.width = (parseInt(window.getComputedStyle(myCanvas).width) - 2);
        myCanvas.height = myCanvas.width

        createGrid();
        beads = [];
        currBeadLength = 0;
    }


}


function selectBeadPattern(val) {
    beadDesign = val;
    let url = "./img/" + val + ".png";
    $('#pattern-image').attr('src', url);
    $('#third-point').hide();
    $('#second-point').hide();
    $('#color2').hide();
    $('#init-form').hide();

    if (val == "linear-iteration") {
        $('#linear-iter-form').show();
        $('#init-form').hide();
        $('#color2').show();

    } else {
        $('#linear-iter-form').hide();
        $('#init-form').show();
    }

    if (val == "triangle-iteration") {
        $('#triangle-iter-form').show();
        $('#init-form').hide();
        $('#color2').show();

    } else {
        $('#triangle-iter-form').hide();
        $('#init-form').show();
    }

    if (val == "rectangle" || val == "line") {
        $('#second-point').show();

    }
    if (val == "triangle") {
        $('#second-point').show();
        $('#third-point').show();
    }

    if (val == "point" || val == "line" || val == "rectangle" || val == "triangle") {
        $('#init-form').show();

    } else {
        $('#init-form').hide();
    }
    setDefaultParams();
}

function setDefaultParams() {
    if (beadDesign == "point") {
        $('#start-x1').val(2).attr('placeholder', 2);
        $('#start-y1').val(2).attr('placeholder', 2);
    } else if (beadDesign == "line") {
        $('#start-x1').val(-3).attr('placeholder', -3);
        $('#start-y1').val(-3).attr('placeholder', -3);
        $('#start-x2').val(3).attr('placeholder', 3);
        $('#start-y2').val(3).attr('placeholder', 3);
    } else if (beadDesign == "rectangle") {
        $('#start-x1').val(-3).attr('placeholder', -3);
        $('#start-y1').val(-3).attr('placeholder', -3);
        $('#start-x2').val(3).attr('placeholder', 3);
        $('#start-y2').val(3).attr('placeholder', 3);
    } else if (beadDesign == "triangle") {
        $('#start-x1').val(-3).attr('placeholder', -3);
        $('#start-y1').val(1).attr('placeholder', 1);
        $('#start-x2').val(0).attr('placeholder', 0);
        $('#start-y2').val(4).attr('placeholder', 4);
        $('#start-x3').val(3).attr('placeholder', 3);
        $('#start-y3').val(1).attr('placeholder', 1);
    } else if (beadDesign == "linear-iteration") {
        $('#x1-iter').val(-3).attr('placeholder', -3);
        $('#y1-iter').val(1).attr('placeholder', 1);

        $('#rows').val(4).attr('placeholder', 4);

        $('#row-length').val(7).attr('placeholder', 7);

        $('#first-num').val(-1).attr('placeholder', -1);
        $('#second-num').val(1).attr('placeholder', 1);
        $("#pos-y").prop("checked", true);
    } else if (beadDesign == "triangle-iteration") {
        $('#x1-iterT').val(0).attr('placeholder', 0);
        $('#y1-iterT').val(0).attr('placeholder', 0);

        $('#rows-tri').val(9).attr('placeholder', 9);
        $('#grouping').val(3).attr('placeholder', 3);
        $('#num').val(1).attr('placeholder', 1);
        $("#neg-y2").prop("checked", true);
    }
}
function updateBead(val){
    let newImage = new Image();
// image.src = beadCostume;
let svg = document.querySelector('svg');

let xml = new XMLSerializer().serializeToString(svg);

let convertImg = xml.replace(/#000000/g, $('#color').val());
let svg64 = btoa(convertImg);
let b64Start = 'data:image/svg+xml;base64,';
let image64 = b64Start + svg64;
newImage.src = image64;

return image64;
}

updateCanavs();
selectBeadPattern("point");

$('#clear-local').on('click', function () {
    clearCanvas()
});

$('.bead-img').on('click', (e) => {
    currentGoal = e.target.getAttribute('src');
    $('#goal-image').attr('src', currentGoal);
    $('#beadModal').modal('hide');
})

$('#myCanvas').on('mousemove', (e) => {
    updateCanavs();

    const ctx = myCanvas.getContext('2d');
    const x = (e.offsetX) - 2;
    const y = (e.offsetY) - 2;
    let currentX = ((x - myCanvas.width / 2) / scale).toFixed(0);
    currentX == (-0) ? currentX = 0 : currentX;
    let currentY = ((y - myCanvas.width / 2) / scale).toFixed(0) * -1;
    currentY == (-0) ? currentY = 0 : currentY;

    if (!showCoordinatesInCorner) {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect((x - myCanvas.width / 2), (y - myCanvas.width / 2) - 12, 45, 15);
        ctx.fillStyle = '#000000';
        ctx.fillText(
            '(' + currentX + ',' +
            currentY + ')', (x - myCanvas.width / 2), (y - myCanvas.width / 2)
        );
        mouseText = {
            x,
            y,
        };
        $("#showCoordinates").text("");
    } else {
        $("#showCoordinates").text('[ x= ' + currentX + ', y= ' + currentY + ']');
    }

});

$('#save-local').click(() => {
    download('save.json', JSON.stringify(beads.map((b) => b.serialize())));
});

$('#load-local').on('change', (e) => {
    let file = e.target.files[0];
    if (!file) {
        return;
    }
    let reader = new FileReader();
    reader.onload = (e) => {
        loadFromJSON(e.target.result);
    };
    reader.readAsText(file);
});

$('.undo').click(() => {
    if (beads.length > 0) {
        let current = beads.pop();
        beadUndoBuffer[currBufferLength] = current;
        currBufferLength++;
        currBeadLength--;
        updateCanavs();
    } else {
        alert("There is nothing else you can undo");
    }


});

$('#redo').click(() => {
    if (beadUndoBuffer.length > 0) {
        let current = beadUndoBuffer.pop();
        beads[currBeadLength] = current;
        currBeadLength++;
        currBufferLength--;
        updateCanavs();
    } else {
        alert("There is nothing else you can redo");
    }


});

$('#print-file').click(() => {
    window.print();
});

$('#hideGrid').click(() => {
    hideGrid = !hideGrid;
    updateCanavs();
    $('#hideGrid').text(hideGrid ? "Show Grid" : "Hide Grid");
});

$('#showCoordinatesOption').click(()=>{
    showCoordinatesInCorner = !showCoordinatesInCorner;
    updateCanavs();
    $('#showCoordinatesOption').text(showCoordinatesInCorner ? "XY Follow Me" : "XY Stay in Corner");

})









/**
 * Download a text string as a file
 * Adapted from
 * https://github.com/CSDTs/CSDT_Single_Page/blob/master/Rhythm%20Wheels/rhythm_wheels.js
 * @param {string} filename
 * @param {string} text
 */
function download(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' +
        encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

/**
 * Load a project into memory
 * @param {string} text a JSON string
 */
function loadFromJSON(text) {
    beads.length = 0;
    currBeadIndex = -1;
    JSON.parse(text).forEach((obj) => {
        beads.push(new Wampum(obj.initPoint, obj.initColor, myCanvas, obj.pattern));
        ++currBeadIndex;
        beads[currBeadIndex].setAdditionalParams(obj.endPoint, obj.topPoint, obj.rows, obj.iterColor, obj.linearRowLength, obj.linearPreNum,
            obj.linearPostNum, obj.triRowGroup, obj.triRowPrePost, obj.direction);

    });


    for (var i = 0; i < beads.length; i++) {
        // console.log(beads[i]);
        beads[i].displayBeads();
    }
    if (beads.length === 0) {
        // setInputsToDefaults();
    } else {
        // setParamsForBead(Beads[currBeadIndex]);
    }
    // loadCanvas();
}


// // helper functions
// function fillTriangle() {
//     let loopCount = xValue.size() - 1; // size changes in loop
//     for (int i = 0; i < loopCount; i++)
//         if (xValue.get(i) == xValue.get(i + 1) && yValue.get(i) != yValue.get(i + 1) &&
//             yValue.get(i) != yValue.get(i + 1) - 1)
//             for (int j = 1; j < yValue.get(i + 1) - yValue.get(i); j++) {
//                 xValue.add(xValue.get(i));
//                 yValue.add(yValue.get(i) + j);
//             }
// }

// public void sortByX(int start, int stop) {
//     ArrayList<Integer> newXValues = new ArrayList<Integer>();
//     ArrayList<Integer> newYValues = new ArrayList<Integer>();
//     for (int i = start; i <= stop; i++) {
//       for (int j = 0; j < this.xValue.size(); j++) {
//         if (((Integer)this.xValue.get(j)).intValue() == i) {
//           newXValues.add(this.xValue.get(j));
//           newYValues.add(this.yValue.get(j));
//         } 
//       } 
//     } 
//     this.xValue = newXValues;
//     this.yValue = newYValues;
//   }

//   public void sortByY() {
//     ArrayList<Integer> tempX = new ArrayList<Integer>();
//     ArrayList<Integer> tempY = new ArrayList<Integer>();
//     tempX.add(this.xValue.get(0));
//     tempY.add(this.yValue.get(0));
//     for (int i = 0; i < this.xValue.size() - 1; i++) {
//       if (this.xValue.get(i) == this.xValue.get(i + 1)) {
//         tempX.add(this.xValue.get(i + 1));
//         tempY.add(this.yValue.get(i + 1));
//       } else {
//         sort(tempX, tempY);
//         int k = tempX.size() - 1;
//         for (int m = 0; m < tempX.size(); m++) {
//           this.xValue.set(i - k, tempX.get(m));
//           this.yValue.set(i - k, tempY.get(m));
//           k--;
//         } 
//         tempX.clear();
//         tempY.clear();
//         tempX.add(this.xValue.get(i + 1));
//         tempY.add(this.yValue.get(i + 1));
//       } 
//     } 
//     sort(tempX, tempY);
//     int temp = tempX.size();
//     for (int j = 0; j < tempX.size(); j++) {
//       this.xValue.set(this.xValue.size() - temp, tempX.get(j));
//       this.yValue.set(this.yValue.size() - temp, tempY.get(j));
//       temp--;
//     } 
//   }


function createPoint() {
    const startX1 = parseFloat($('#start-x1').val());
    const startY1 = parseFloat($('#start-y1').val() * -1);
    const color = $('#color').val();

    let initPoint = {
        x: startX1 * scale,
        y: startY1 * scale
    }

    beads[currBeadLength] = new Wampum(initPoint, color, myCanvas);
    beads[currBeadLength].stamp();
    currBeadLength++;
}

function createLine() {
    const startX1 = parseInt($('#start-x1').val());
    const startY1 = parseInt($('#start-y1').val() * -1);
    const startX2 = parseInt($('#start-x2').val());
    const startY2 = parseInt($('#start-y2').val() * -1);
    const color = $('#color').val();

    let initPoint = {
        x: startX1 * scale,
        y: startY1 * scale
    }

    let endPoint = {
        x: startX2 * scale,
        y: startY2 * scale
    }

    beads[currBeadLength] = new Wampum(initPoint, color, myCanvas);
    beads[currBeadLength].setEndPoint(endPoint);
    beads[currBeadLength].line();
    currBeadLength++;


}

function createRectangle() {
    const startX1 = parseFloat($('#start-x1').val());
    const startY1 = parseFloat($('#start-y1').val() * -1);
    const startX2 = parseFloat($('#start-x2').val());
    const startY2 = parseFloat($('#start-y2').val() * -1);
    const color = $('#color').val();


    let initPoint = {
        x: startX1 * scale,
        y: startY1 * scale
    }

    let endPoint = {
        x: startX2 * scale,
        y: startY2 * scale
    }

    beads[currBeadLength] = new Wampum(initPoint, color, myCanvas);
    beads[currBeadLength].setEndPoint(endPoint);
    beads[currBeadLength].rectangle();
    currBeadLength++;
}

function createTriangle() {
    const startX1 = parseInt($('#start-x1').val());
    const startY1 = parseInt($('#start-y1').val() * -1);
    const startX2 = parseInt($('#start-x2').val());
    const startY2 = parseInt($('#start-y2').val() * -1);
    const startX3 = parseInt($('#start-x3').val());
    const startY3 = parseInt($('#start-y3').val() * -1);
    const color = $('#color').val();
 

    let initPoint = {
        x: startX1 * scale,
        y: startY1 * scale
    }

    let endPoint = {
        x: startX3 * scale,
        y: startY3 * scale
    }

    let topPoint = {
        x: startX2 * scale,
        y: startY2 * scale
    }

    beads[currBeadLength] = new Wampum(initPoint, color, myCanvas);
    beads[currBeadLength].setTriangle(topPoint, endPoint);
    beads[currBeadLength].triangle();
    currBeadLength++;
}

function createLinearIteration() {
    const x = parseFloat($('#x1-iter').val());
    const y = parseFloat($('#y1-iter').val() * -1);

    const color1 = $('#color').val();
    const color2 = $('#color2').val();
   
    const rows = parseInt($('#rows').val());

    const rowLength = parseInt($('#row-length').val());

    const startNum = parseInt($('#first-num').val());
    const endNum = parseInt($('#second-num').val());
    const direction = $('#linear-iter-form input:radio:checked').val();

    let initPoint = {
        x: x * scale,
        y: y * scale
    }
    beads[currBeadLength] = new Wampum(initPoint, color1, myCanvas);
    beads[currBeadLength].setLinearIteration(rowLength, startNum, endNum, rows, direction, color2);
    beads[currBeadLength].linearIteration();
    currBeadLength++;
}

function createTriangleIteration() {
    const x = parseInt($('#x1-iterT').val());
    const y = parseInt($('#y1-iterT').val());

    const color1 = $('#color').val();
    const color2 = $('#color2').val();


    const rows = parseInt($('#rows-tri').val());

    const group = parseInt($('#grouping').val());

    const num = parseInt($('#num').val());

    const direction = $('#triangle-iter-form input:radio:checked').val();

    let initPoint = {
        x: x * scale,
        y: y * scale
    }
    beads[currBeadLength] = new Wampum(initPoint, color1, myCanvas);
    beads[currBeadLength].setTriangleIteration(group, num, rows, direction, color2);
    beads[currBeadLength].triangleIteration();
    currBeadLength++;
}

function create() {

    switch (beadDesign) {
        case "point":
            createPoint();
            break;
        case "line":
            createLine();
            break;
        case "rectangle":
            createRectangle();
            break;
        case "triangle":
            createTriangle();
            break;
        case "linear-iteration":
            createLinearIteration();
            break;
        case "triangle-iteration":
            createTriangleIteration();
            break;
        default:
            createPoint();
    }
}