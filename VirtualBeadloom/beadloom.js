/* eslint-disable */

// Options
let hideGrid = false;
let addAtCurrentPoint = false;
let showCoordinatesInCorner = false;
let currentX = 0;
let currentY = 0;
let gridScale = 2;
let currentGoal = "./img/cc-0.jpg";
let hideHighlight = false;
let showVector = false;
let midVectors = [];
let beadStyle = "point";

const myCanvas = document.getElementById('myCanvas');
const imageCanvas = document.getElementById('imageCanvas');

$('#data-form').on('change keyup input', loadCanvas);

const Beads = [];


let currBeadIndex = 0;


/** Class representing a single bead and containing methods for drawing it */
class Bead {
    /**
     * @param {number} size width of the bead in pixels
     * @param {number} x
     * @param {number} y
     * @param {number} startAngle
     * @param {string} startReflection
     * @param {HTMLElement} canvas
     * @param {boolean} inRadians
     */
    constructor(size, x, y, startAngle, startReflection,
        canvas, inRadians = true) {
        this._size = size;
        this._x = x;
        this._y = y;
        this._rotation = 0;
        this._ctx = canvas ? canvas.getContext('2d') : undefined;
        this._midpoint = {
            x: this._x + this._size / 2,
            y: this._y + this._size / 2,
        };
        this.translate(0, 0, startAngle, inRadians);
        this._reflection = startReflection;
    }

    /** Clone constructor
     * @return {Bead} returns a copy of the current bead
     */
    clone() {
        const newBead = new Bead(this._size, this._x, this._y,
            this._startAngle, this._reflection);
        newBead._ctx = this._ctx;
        newBead._rotation = this._rotation;
        newBead._x = this._x;
        newBead._y = this._y;
        newBead._midpoint = {
            x: this._x + this._size / 2,
            y: this._y + this._size / 2,
        };
        newBead.collisionParams = [];
        return newBead;
    }

    /** Moves the bead on the x,y plane without rotating or resizing
     * @param {number} dx Amount x should change by in percent
     * @param {number} dy Amount x should change by in percent
     * @param {number} angle Angle of rotation
     * @param {boolean} inRadians Whether "angle" was given in radians
     *
     * @return {Bead} returns "this" for chaining
     */
    translate(dx, dy, angle, inRadians) {
        this._rotation += inRadians ? angle : degToRad(angle);
        const newMidpoint = rotateAroundPoint({
            x: this._size * dx / 100,
            y: this._size * dy / 100,
        }, this._rotation, {
            x: 0,
            y: 0,
        });
        this._x += newMidpoint.x;
        this._y += newMidpoint.y;
        this._midpoint.x += newMidpoint.x;
        this._midpoint.y += newMidpoint.y;
        this.collisionParams = [];

        return this;
    }

    /** Reflects the bead across x or y axis
     * @param {string} axis the axis of reflection (x,y)
     *
     * @return {Bead} returns "this" for chaining
     */
    setReflection(axis) {
        this._reflection = axis;
        return this;
    }

    /** Changes the size of the bead
     * @param {number} dilation percentage of the current size
     *
     * @return {Bead} returns "this" for chaining
     */
    dilate(dilation) {
        this._size *= (dilation / 100);
        this._midpoint = {
            x: this._x + this._size / 2,
            y: this._y + this._size / 2,
        };
        return this;
    }

    /** Draws bead based on current data stored in bead
     * @param {string} color an optional hex code containt the color to stamp
     * @param {number} width an optional width for the bead strokes
     *
     * @return {Bead} returns "this" for chaining
     */
    stamp(color = '#000000', width = 1 / 7, bead = true) {
        // 7 is an arbitrary number for lineWidth that seems to look good
        const lineWidth = this._size * width;
        // Offset keeps all corners of the lines within the size x size square
        const offset = lineWidth / 2;
        // Rotate all points to be used around corner
        const position = {
            x: this._x,
            y: this._y,
        };
        let upperLeftCorner = rotateAroundPoint({
            x: this._x + offset,
            y: this._y + offset,
        }, this._rotation, position);
        upperLeftCorner = reflect(upperLeftCorner.x, upperLeftCorner.y,
            this._midpoint.x, this._midpoint.y, this._reflection);
        let midPoint = rotateAroundPoint({
            x: this._midpoint.x,
            y: this._midpoint.y,
        }, this._rotation, position);
        midPoint = reflect(midPoint.x, midPoint.y,
            this._midpoint.x, this._midpoint.y, this._reflection);
        let upperRightCorner = rotateAroundPoint({
            x: this._x + this._size - offset,
            y: this._y + offset,
        }, this._rotation, position);
        upperRightCorner = reflect(upperRightCorner.x, upperRightCorner.y,
            this._midpoint.x, this._midpoint.y, this._reflection);
        let lowerLeftCorner = rotateAroundPoint({
            x: this._x + offset,
            y: this._y + this._size - offset,
        }, this._rotation, position);
        lowerLeftCorner = reflect(lowerLeftCorner.x, lowerLeftCorner.y,
            this._midpoint.x, this._midpoint.y, this._reflection);

        if (bead) {
            var img = new Image(10, 10);
            img.src = "./img/bead-default.png";

            this._ctx.drawImage(img, position.x, position.y, 20, 20);

        } else {
            this._ctx.beginPath();
            this._ctx.lineWidth = lineWidth;
            this._ctx.strokeStyle = color;

            // Draws left arm
            this._ctx.moveTo(upperLeftCorner.x, upperLeftCorner.y);
            this._ctx.lineTo(midPoint.x, midPoint.y);
            this.collisionParams[0] = {
                x0: upperLeftCorner.x,
                y0: upperLeftCorner.y,
                x1: midPoint.x,
                y1: midPoint.y,
            };
            // Draws right arm
            this._ctx.moveTo(upperRightCorner.x, upperRightCorner.y);
            this._ctx.lineTo(lowerLeftCorner.x, lowerLeftCorner.y);
            this.collisionParams[1] = {
                x0: upperRightCorner.x,
                y0: upperRightCorner.y,
                x1: lowerLeftCorner.x,
                y1: lowerLeftCorner.y,
            };

            this._ctx.closePath();
            this._ctx.stroke();
        }

        midVectors.push(midPoint);

        return this;
    }

    /** Iterates, creating n stamped copies of the bead,
     * each using the same translation
     * @param {number} translateX percentage
     * @param {number} translateY percentage
     * @param {number} rotationAngle
     * @param {boolean} inRadians
     * @param {number} dilation percentage
     * @param {number} n number of iterations
     *
     * @return {Bead} returns this for chaining
     */
    iterate(translateX, translateY, rotationAngle, inRadians, dilation, n) {
        if (dilation || n) {
            this.setIterationParameters(translateX, translateY,
                rotationAngle, inRadians, dilation, n);
        }
        const beadToStamp = this.stamp().clone();

        for (let i = 0; i < (n ? n : this.iteration.n); i++) {
            beadToStamp
                .translate(this.iteration.translateX,
                    this.iteration.translateY, this.iteration.rotationAngle,
                    this.iteration.inRadians)
                .dilate(this.iteration.dilation)
                .stamp();
        }

        return this;
    }



    rectangle(x2, y2) {

        const lowerLeftCorner = {
            x: this._x,
            y: this._y
        };
        const upperRightCorner = {
            x: x2,
            y: y2
        };

        const row = Math.abs(lowerLeftCorner.x) + Math.abs(upperRightCorner.x);
        const col = Math.abs(lowerLeftCorner.y) + Math.abs(upperRightCorner.y);
        const beadToStamp = this.stamp().clone();

        for(var i = 0; i < row; i++){
            for(var j = 0; j < col; j++){
                beadToStamp
                .translate(this.iteration.translateX,
                    this.iteration.translateY, this.iteration.rotationAngle,
                    this.iteration.inRadians)
                .stamp();
            }
        }

    }




    /** Save or edit paramters for iteration
     * @param {number} translateX percentage
     * @param {number} translateY percentage
     * @param {number} rotationAngle
     * @param {boolean} inRadians
     * @param {number} dilation percentage
     * @param {number} n number of iterations
     *
     * @return {Bead} returns this for chaining
     */
    setIterationParameters(translateX, translateY, rotationAngle,
        inRadians, dilation, n) {
        this.iteration = {
            translateX,
            translateY,
            rotationAngle,
            inRadians,
            dilation,
            n,
        };
        return this;
    }

    /** Returns whether or not the bead contains the given coordinate
     * @param {number} x
     * @param {number} y
     *
     * @return {boolean}
     */
    contains(x, y) {
        const dx = (this._midpoint.x - x);
        const dy = (this._midpoint.y - y);
        return Math.sqrt(dx * dx + dy * dy) <= this._size / 2;
    }

    /**
     * @return {Object} a serialized version of this bead for saving
     */
    serialize() {
        return {
            'size': this._size,
            'x': this._x,
            'y': this._y,
            'rotation': this._rotation,
            'reflection': this._reflection,
            'iteration': this.iteration,
        };
    }

    /** Iterates, creating n stamped copies of the bead,
     * each using the same translation
     * @param {number} translateX percentage
     * @param {number} translateY percentage
     * @param {number} rotationAngle
     * @param {boolean} inRadians
     * @param {number} dilation percentage
     * @param {number} n number of iterations
     *
     * @return {Bead} returns this for chaining
     */
    point() {
        const beadToStamp = this.stamp().clone();

        beadToStamp.stamp();
        return this;
    }
}


// Toggle functions

/** Toggles the grid in canvas
 *
 */
function toggleGrid() {
    hideGrid = !hideGrid;
    loadCanvas();
    $('#hideGrid').text(hideGrid ? "Show Grid" : "Hide Grid");
}

/** Toggles the starting point in canvas
 *
 */
function togglePoint() {
    $('#addAtCurrentPoint').text(addAtCurrentPoint ? "Add Bead at Current Point" : "Add Bead at Origin");
    addAtCurrentPoint = !addAtCurrentPoint;
}

/** Toggles the coordinate point display in the bottom right corner
 *
 */
function togglePointDisplay() {
    $('#showCoordinatesOption').text(showCoordinatesInCorner ? "XY In Lower Right" : "XY Follows Mouse");
    showCoordinatesInCorner = !showCoordinatesInCorner;
}

/** Toggles the initial bead highlight
 *
 */
function toggleBeadHighlight() {
    $('#hideHighlight').text(hideHighlight ? "Hide Plait Highlight" : "Show Plait Highlight");
    hideHighlight = !hideHighlight;
    loadCanvas();
}
/** Toggles the vector path
 *  
 */
function toggleVector() {
    $('#showVector').text(showVector ? "Show Vector" : "Hide Vector");
    showVector = !showVector;
    loadCanvas();
}

function selectBeadPattern(value) {
    beadStyle = value;
    switch (value) {
        case "point":
            $('#pattern-image').attr('src', "./img/point.png");
            break;
        case "line":
            $('#pattern-image').attr('src', "./img/line.png");
            break;
        case "rectangle":
            $('#pattern-image').attr('src', "./img/rectangle.png");
            break;
        case "triangle":
            $('#pattern-image').attr('src', "./img/triangle.png");
            break;
        case "linear-iteration":
            $('#pattern-image').attr('src', "./img/linear-iteration.png");
            break;
        case "triangle-iteration":
            $('#pattern-image').attr('src', "./img/triangle-iteration.png");
            break;
        default:
            $('#pattern-image').attr('src', "./img/point.png");
    }
}


// Helper functions

/** Rotates one point around another
 * @param {object} A
 * @param {number} angle
 * @param {object} B
 *
 * @return {object} returns "A" rotated "angle" radians around "B"
 */
function rotateAroundPoint(A, angle, B) {
    return {
        x: (A.x - B.x) * Math.cos(angle) - (A.y - B.y) * Math.sin(angle) + B.x,
        y: (A.y - B.y) * Math.cos(angle) + (A.x - B.x) * Math.sin(angle) + B.y,
    };
}

/** Reflect
 * @param {number} x starting x
 * @param {number} y starting y
 * @param {number} midX x coordinate of the point of reflection
 * @param {number} midY y coordinate of the point of reflection
 * @param {string} axis axis of reflection (x, y, xy)
 *
 * @return {object} a point containing the reflected x and y
 */
function reflect(x, y, midX, midY, axis) {
    return {
        x: axis.includes('x') ? 2 * midX - x : x,
        y: axis.includes('y') ? 2 * midY - y : y,
    };
}

/** Convert degrees to radians
 * @param {number} angle
 *
 * @return {number}
 */
function degToRad(angle) {
    return angle * Math.PI / 180;
}

/** Convert radians to degrees
 * @param {number} angle
 *
 * @return {number}
 */
function radToDeg(angle) {
    return angle * 180 / Math.PI;
}



/**
 * Reset all inputs to their default values.
 */
function setInputsToDefaults() {
    $('#start-x').val('0');
    $('#start-y').val('0');
    $('#start-angle').val('0');
    $('#start-dilation').val('100');
    $('#reflectx').prop('checked', false);
    $('#reflecty').prop('checked', false);
    $('#iterations').val('0');
    $('#x-translation').val('50');
    $('#rotation').val('0');
    $('#dilation').val('100');
}

/**
 * Reset all inputs to overridden values based on current options / current values
 */
function setInputsToOverride() {

    $('#start-x').val();
    $('#start-y').val();
    $('#start-angle').val('0');
    $('#start-dilation').val('100');
    $('#reflectx').prop('checked', false);
    $('#reflecty').prop('checked', false);
    $('#iterations').val('0');
    $('#x-translation').val('50');
    $('#rotation').val('0');
    $('#dilation').val('100');
}

// Demonstration

$('#new-bead').click(() => {

    addAtCurrentPoint ? setInputsToOverride() : setInputsToDefaults();

    Beads.push(new Bead(myCanvas.width / 20,
        myCanvas.width / 2, myCanvas.height / 2,
        0, '', myCanvas, false));
    currBeadIndex = Beads.length - 1;
    loadCanvas();
    loadBeads();
});

$('#reset-bead').click(() => {
    setInputsToDefaults();
    loadCanvas();
});

$('#delete-bead').click(() => {
    Beads.splice(currBeadIndex, 1);
    currBeadIndex = -1;
    loadCanvas();
});

$('#create-bead').click(() => {
    //Point (Single Bead)
    const ctx = myCanvas.getContext('2d');
    const startX1 = parseFloat($('#start-x1').val());
    const startY1 = parseFloat($('#start-y1').val() * -1);
    const color = $('#color').val();

    loadCanvas();
    loadCanvas();
    loadCanvas();
    loadCanvas();
    loadCanvas();
    loadCanvas();


});


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
    Beads.length = 0;
    currBeadIndex = -1;
    JSON.parse(text).forEach((obj) => {
        Beads.push(new Bead(obj.size, obj.x, obj.y, obj.rotation,
            obj.reflection, myCanvas));
        ++currBeadIndex;
        Beads[currBeadIndex].setIterationParameters(obj.iteration.translateX,
            obj.iteration.translateY, obj.iteration.rotationAngle,
            obj.iteration.inRadians, obj.iteration.dilation, obj.iteration.n);
    });
    if (Beads.length === 0) {
        setInputsToDefaults();
    } else {
        setParamsForBead(Beads[currBeadIndex]);
    }
    loadCanvas();
}

$('#save-local').click(() => {
    download('save.json', JSON.stringify(Beads.map((b) => b.serialize())));
});

$('#print-file').click(() => {
    window.print();
})

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

$('#myCanvas').on('mousemove', (e) => {
    loadCanvas();

    const ctx = myCanvas.getContext('2d');
    const x = (e.offsetX) - 2;
    const y = (e.offsetY) - 2;

    // if (!showCoordinatesInCorner) {
    //     ctx.font = '12px Arial';
    //     ctx.fillStyle = '#ffffff';
    //     ctx.fillRect(x, y - 12, 60, 15);
    //     ctx.fillStyle = '#000000';
    //     ctx.fillText(
    //         '(' + ((x - myCanvas.width / 2)) + ',' +
    //         ((y - myCanvas.width / 2)) + ')', x, y
    //     );
    //     mouseText = {
    //         x,
    //         y,
    //     };
    //     $("#showCoordinates").text("");
    // } else {
    $("#showCoordinates").text('(' + (x - myCanvas.width / 2) + ',' + (y - myCanvas.width / 2) + ')');
    // }
    // for (let i = 0; i < Beads.length; i++) {
    //     if (Beads[i].contains(x, y) && !hideHighlight) {
    //         Beads[i].stamp('#FF0000');
    //     }
    // }

});

$('#myCanvas').on('mouseleave', (e) => {
    loadCanvas();
});

$('#myCanvas').on('click', (e) => {
    const x = e.offsetX;
    const y = e.offsetY;
    // for (let i = 0; i < Beads.length; i++) {
    //     if (Beads[i].contains(x, y)) {
    //         currBeadIndex = i;
    //         setParamsForBead(Beads[i]);
    //         loadCanvas();
    //         loadBeads();
    //         break;
    //     }
    // }
});

$('.bead-img').on('click', (e) => {
    currentGoal = e.target.getAttribute('src');
    $('#goal-image').attr('src', currentGoal);
    $('#beadModal').modal('hide');
})

/** Sets parameters to those for a certain bead
 * @param {Bead} bead
 */
function setParamsForBead(bead) {
    $('#start-x').val(bead._x - myCanvas.width / 2);
    $('#start-y').val(-(bead._y - myCanvas.height / 2));
    $('#start-angle').val(radToDeg(bead._rotation));
    $('#start-dilation').val(bead._size * 2000 / myCanvas.width);
    $('#reflectx').prop('checked', bead._reflection.includes('x'));
    $('#reflecty').prop('checked', bead._reflection.includes('y'));
    $('#iterations').val(bead.iteration.n);
    $('#x-translation').val(bead.iteration.translateX);
    $('#rotation').val(bead.iteration.rotationAngle);
    $('#dilation').val(bead.iteration.dilation);
}

/** loads canvas at the correct height and iterates with current settings */
function loadCanvas() {
    // Gets all form values
    const ctx = myCanvas.getContext('2d');
    ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);

    const iterations = parseInt($('#iterations').val());
    const startX = parseFloat($('#start-x').val());
    const startY = parseFloat($('#start-y').val() * -1);
    const startAngle = parseFloat($('#start-angle').val());
    const startingDilation = parseFloat($('#start-dilation').val());
    const xTranslation = parseFloat($('#x-translation').val());
    const rotation = parseFloat($('#rotation').val());
    const dilation = parseFloat($('#dilation').val());
    const xReflection = $('#reflectx').is(':checked');
    const yReflection = $('#reflecty').is(':checked');
    const reflection = ('' + (xReflection ? 'x' : '') +
        (yReflection ? 'y' : ''));






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
    myCanvas.height = myCanvas.width;

    let beadWidth = myCanvas.width / 2;


    if (!hideGrid) {
        createGrid(ctx);

    }

    Beads[currBeadIndex] = new Bead(myCanvas.width * startingDilation / 2000,
            ((myCanvas.width / 2 + startX) - beadWidth), ((myCanvas.height / 2 + startY) - beadWidth),
            startAngle, reflection, myCanvas, false)
        .setIterationParameters(xTranslation, 0, rotation, false,
            dilation, iterations);


    for (let i = 0; i < Beads.length; i++) {
        if (i === currBeadIndex && !hideHighlight) {
            Beads[i]
                .clone()
                .translate(-5, -5, 0, 0)
                .dilate(110)
                .stamp('#FF0000', (12 / 70));
        }
        Beads[i].iterate();
    }



}
/** loads current beads into select for easier navigation */
function loadBeads() {
    $('#bead-select').html("");
    for (let i = 0; i < Beads.length; i++) {
        $('#bead-select').append($('<option>', {
            value: i,
            text: 'Bead: ' + i,
            selected: currBeadIndex == i ? true : false
        }));
    }
}

function selectBeadFromSelect(value) {
    for (let i = 0; i < Beads.length; i++) {
        if (i == value) {
            currBeadIndex = i;
            setParamsForBead(Beads[i]);
            loadCanvas();
            loadBeads();
            break;
        }
    }



}

function createGrid(canvasGrid) {
    var grid_size = 25;

    var x_axis_starting_point = {
        number: 1,
        suffix: '\u03a0'
    };
    var y_axis_starting_point = {
        number: 1,
        suffix: ''
    };

    // var canvas = document.getElementById("my-canvas");
    var ctx = canvasGrid;

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
    for (i = 1; i < (num_lines_y - y_axis_distance_grid_lines); i++) {
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
    for (i = 1; i < y_axis_distance_grid_lines; i++) {
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
    for (i = 1; i < (num_lines_x - x_axis_distance_grid_lines); i++) {
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
    for (i = 1; i < x_axis_distance_grid_lines; i++) {
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




loadCanvas();
loadBeads();