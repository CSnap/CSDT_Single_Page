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
let braidUndoBuffer = [];
let currBufferLength = 0;



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
    $('#addAtCurrentPoint').text(addAtCurrentPoint ? "Add Braid at Current Point" : "Add Braid at Origin");
    addAtCurrentPoint = !addAtCurrentPoint;
    // loadCanvas();

}


/** Toggles the coordinate point display in the bottom right corner
 *
 */
function togglePointDisplay() {
    $('#showCoordinatesOption').text(showCoordinatesInCorner ? "XY In Lower Right" : "XY Follows Mouse");
    showCoordinatesInCorner = !showCoordinatesInCorner;
    // loadCanvas();

}


/** Toggles the initial braid highlight
 *
 */
function toggleBraidHighlight() {
    $('#hideHighlight').text(hideHighlight ? "Hide Plait Highlight" : "Show Plait Highlight");
    hideHighlight = !hideHighlight;
    loadCanvas();

}

function toggleVector() {
    $('#showVector').text(showVector ? "Show Vector" : "Hide Vector");
    showVector = !showVector;
    loadCanvas();
}



function drawArrow(ctx, fromx, fromy, tox, toy, arrowWidth, color) {
    //variables to be used when creating the arrow
    var headlen = 10;
    var angle = Math.atan2(toy - fromy, tox - fromx);

    ctx.save();
    ctx.strokeStyle = color;

    //starting path of the arrow from the start square to the end square
    //and drawing the stroke
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.lineWidth = arrowWidth;
    ctx.stroke();

    //starting a new path from the head of the arrow to one of the sides of
    //the point
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7),
        toy - headlen * Math.sin(angle - Math.PI / 7));

    //path from the side point of the arrow, to the other side point
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 7),
        toy - headlen * Math.sin(angle + Math.PI / 7));

    //path from the side point back to the tip of the arrow, and then
    //again to the opposite side point
    ctx.lineTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 7),
        toy - headlen * Math.sin(angle - Math.PI / 7));

    //draws the paths created above
    ctx.stroke();
    ctx.restore();
    ctx.closePath();

}


const myCanvas = document.getElementById('myCanvas');
const imageCanvas = document.getElementById('imageCanvas');

$('#data-form').on('change keyup input', loadCanvas);
let Braids = [];
let currBraidIndex = 0;




/** Class representing a single braid and containing methods for drawing it */
class Braid {
    /**
     * @param {number} size width of the braid in pixels
     * @param {number} x
     * @param {number} y
     * @param {number} startAngle
     * @param {string} startReflection
     * @param {HTMLElement} canvas
     * @param {boolean} inRadians
     */
    constructor(size, x, y, startAngle, startReflection,
        canvas, inRadians = true) {
        this._size = size ;
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
     * @return {Braid} returns a copy of the current braid
     */
    clone() {
        const newBraid = new Braid(this._size, this._x, this._y,
            this._startAngle, this._reflection);
        newBraid._ctx = this._ctx;
        newBraid._rotation = this._rotation;
        newBraid._x = this._x;
        newBraid._y = this._y;
        newBraid._midpoint = {
            x: this._x + this._size / 2,
            y: this._y + this._size / 2,
        };
        newBraid.collisionParams = [];
        return newBraid;
    }

    /** Moves the braid on the x,y plane without rotating or resizing
     * @param {number} dx Amount x should change by in percent
     * @param {number} dy Amount x should change by in percent
     * @param {number} angle Angle of rotation
     * @param {boolean} inRadians Whether "angle" was given in radians
     *
     * @return {Braid} returns "this" for chaining
     */
    translate(dx, dy, angle, inRadians) {
        this._rotation += inRadians ? angle : degToRad(angle);
        let reflectionX= this._reflection == null ? 1 : (this._reflection.includes('y')? -1:1);
        let reflectionY= this._reflection == null ? 1 : (this._reflection.includes('x')? -1:1);
        // console.log(reflection);
        const newMidpoint = rotateAroundPoint({
            x: this._size * dx / 100,
            y: (this._size * dy / 100),
        }, this._rotation, {
            x: 0,
            y: 0,
        });
        this._x += newMidpoint.x * reflectionX;
        this._y += newMidpoint.y * reflectionY;
        this._midpoint.x += newMidpoint.x;
        this._midpoint.y += newMidpoint.y;
        this.collisionParams = [];

        return this;
    }

    /** Reflects the braid across x or y axis
     * @param {string} axis the axis of reflection (x,y)
     *
     * @return {Braid} returns "this" for chaining
     */
    setReflection(axis) {
        this._reflection = axis;
        return this;
    }

    /** Changes the size of the braid
     * @param {number} dilation percentage of the current size
     *
     * @return {Braid} returns "this" for chaining
     */
    dilate(dilation) {
        this._size *= (dilation / 100);
        this._midpoint = {
            x: this._x + this._size / 2,
            y: this._y + this._size / 2,
        };
        return this;
    }

    /** Draws braid based on current data stored in braid
     * @param {string} color an optional hex code containt the color to stamp
     * @param {number} width an optional width for the braid strokes
     *
     * @return {Braid} returns "this" for chaining
     */
    stamp(color = '#000000', width = 1 / 7) {
        
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

        midVectors.push(midPoint);

        return this;
    }

    /** Draws extended vector based on current data stored in braid
     * @param {string} color an optional hex code containt the color to stamp
     * @param {number} width an optional width for the braid strokes
     *
     * @return {Braid} returns "this" for chaining
     */
    vectorFix(color = '#000000', width = 1 / 7) {
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

        midVectors.push(midPoint);

        return this;
    }

    /** Iterates, creating n stamped copies of the braid,
     * each using the same translation
     * @param {number} translateX percentage
     * @param {number} translateY percentage
     * @param {number} rotationAngle
     * @param {boolean} inRadians
     * @param {number} dilation percentage
     * @param {number} n number of iterations
     *
     * @return {Braid} returns this for chaining
     */
    iterate(translateX, translateY, rotationAngle, inRadians, dilation, n) {
        if (dilation || n) {
            this.setIterationParameters(translateX, translateY,
                rotationAngle, inRadians, dilation, n);
        }
        const braidToStamp = this.stamp().clone();


        for (let i = 0; i < (n ? n : this.iteration.n); i++) {
            console.log(this._reflection);
            braidToStamp
                .translate(this.iteration.translateX,
                    this.iteration.translateY, this.iteration.rotationAngle,
                    this.iteration.inRadians)
                .dilate(this.iteration.dilation)
                .stamp();
        }
        // Extends the initial vector todo
        braidToStamp
            .translate(this.iteration.translateX + 30,
                this.iteration.translateY, this.iteration.rotationAngle,
                this.iteration.inRadians)
            .dilate(this.iteration.dilation)
            .vectorFix();
        return this;
    }

    /** Save or edit paramters for iteration
     * @param {number} translateX percentage
     * @param {number} translateY percentage
     * @param {number} rotationAngle
     * @param {boolean} inRadians
     * @param {number} dilation percentage
     * @param {number} n number of iterations
     *
     * @return {Braid} returns this for chaining
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

    /** Returns whether or not the braid contains the given coordinate
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
     * @return {Object} a serialized version of this braid for saving
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
        x: axis.includes('y') ? 2 * midX - x : x,
        y: axis.includes('x') ? 2 * midY - y : y,
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

$('#new-braid').click(() => {

    addAtCurrentPoint ? setInputsToOverride() : setInputsToDefaults();

    Braids.push(new Braid(myCanvas.width / 20,
        myCanvas.width / 2, myCanvas.height / 2,
        0, '', myCanvas, false));
    currBraidIndex = Braids.length - 1;
    loadCanvas();
    loadBraids();
});

$('#reset-braid').click(() => {
    setInputsToDefaults();
    loadCanvas();
});

$('#delete-braid').click(() => {
    Braids.splice(currBraidIndex, 1);

    currBraidIndex = currBraidIndex-1;

    loadCanvas();
    loadBraids();


    
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
    Braids.length = 0;
    currBraidIndex = -1;
    JSON.parse(text).forEach((obj) => {
        Braids.push(new Braid(obj.size, obj.x, obj.y, obj.rotation,
            obj.reflection, myCanvas));
        ++currBraidIndex;
        Braids[currBraidIndex].setIterationParameters(obj.iteration.translateX,
            obj.iteration.translateY, obj.iteration.rotationAngle,
            obj.iteration.inRadians, obj.iteration.dilation, obj.iteration.n);
    });
    if (Braids.length === 0) {
        setInputsToDefaults();
    } else {
        setParamsForBraid(Braids[currBraidIndex]);
    }
    loadCanvas();
}

$('#save-local').click(() => {
    download('save.json', JSON.stringify(Braids.map((b) => b.serialize())));
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
    const x = e.offsetX;
    const y = e.offsetY;

    if (!showCoordinatesInCorner) {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y - 12, 60, 15);
        ctx.fillStyle = '#000000';
        ctx.fillText(
            '(' + ((x - myCanvas.width / 2)) + ',' +
            ((y - myCanvas.width / 2)) + ')', x, y
        );
        mouseText = {
            x,
            y,
        };
        $("#showCoordinates").text("");
    } else {
        $("#showCoordinates").text('(' + (x - myCanvas.width / 2) + ',' + (y - myCanvas.width / 2) + ')');
    }
    for (let i = 0; i < Braids.length; i++) {
        if (Braids[i].contains(x, y) && !hideHighlight) {
            Braids[i].stamp('#FF0000');
        }
    }

});

$('#myCanvas').on('mouseleave', (e) => {
    loadCanvas();
});

$('#myCanvas').on('click', (e) => {
    const x = e.offsetX;
    const y = e.offsetY;
    for (let i = 0; i < Braids.length; i++) {
        if (Braids[i].contains(x, y)) {
            currBraidIndex = i;
            setParamsForBraid(Braids[i]);
            loadCanvas();
            loadBraids();
            break;
        }
    }
});

$('.braid-img').on('click', (e) => {
    currentGoal = e.target.getAttribute('src');
    $('#goal-image').attr('src', currentGoal);
    $('#braidModal').modal('hide');
})

/** Sets parameters to those for a certain braid
 * @param {Braid} braid
 */
function setParamsForBraid(braid) {
    $('#start-x').val(braid._x - myCanvas.width / 2);
    $('#start-y').val(-(braid._y - myCanvas.height / 2));
    $('#start-angle').val(radToDeg(braid._rotation));
    $('#start-dilation').val(braid._size * 2000 / myCanvas.width);
    $('#reflectx').prop('checked', braid._reflection.includes('x'));
    $('#reflecty').prop('checked', braid._reflection.includes('y'));
    $('#iterations').val(braid.iteration.n);
    $('#x-translation').val(braid.iteration.translateX);
    $('#rotation').val(braid.iteration.rotationAngle);
    $('#dilation').val(braid.iteration.dilation);
}

/** loads canvas at the correct height and iterates with current settings */
function loadCanvas() {
    // Gets all form values
    const ctx = myCanvas.getContext('2d');
    ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);

    const iterations = parseInt($('#iterations').val());
    const startX = parseFloat($('#start-x').val());
    const startY = parseFloat($('#start-y').val() * -1);
    const startAngle = parseFloat($('#start-angle').val()*-1);
    const startingDilation = parseFloat($('#start-dilation').val());
    const xTranslation = parseFloat($('#x-translation').val());
    const rotation = parseFloat($('#rotation').val()*-1);
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

    Braids[currBraidIndex] = new Braid(myCanvas.width * startingDilation / 2000,
            myCanvas.width / 2 + startX, myCanvas.height / 2 + startY,
            startAngle, reflection, myCanvas, false)
        .setIterationParameters(xTranslation, 0, rotation, false,
            dilation, iterations);

    if (!hideGrid) {

        ctx.beginPath();

        ctx.lineWidth = 1;
        ctx.strokeStyle = '#8e8e8e55';
        for (let i = myCanvas.width / 2; i >= 0; i -= 10) {

            ctx.moveTo(i, 0);
            ctx.lineTo(i, myCanvas.height);
            ctx.moveTo(0, i);
            ctx.lineTo(myCanvas.width, i);
            ctx.moveTo(myCanvas.width - i, 0);
            ctx.lineTo(myCanvas.width - i, myCanvas.height);
            ctx.moveTo(0, myCanvas.width - i);
            ctx.lineTo(myCanvas.width, myCanvas.width - i);

        }
        ctx.closePath();
        ctx.stroke();

        //Draws the X and Y axis
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(myCanvas.width / 2, 0);
        ctx.lineTo(myCanvas.width / 2, myCanvas.height);
        ctx.moveTo(0, myCanvas.height / 2);
        ctx.lineTo(myCanvas.width, myCanvas.height / 2);
        ctx.closePath();
        ctx.stroke();
    }
    midVectors = [];

    for (let i = 0; i < Braids.length; i++) {
        if (i === currBraidIndex && !hideHighlight) {
            Braids[i]
                .clone()
                .translate(-5*(yReflection?-1:1), -5*(xReflection?-1:1), 0, 0)
                .dilate(110)
                .stamp('#FF0000', (12 / 70));
        }
        Braids[i].iterate();
    }
// -5 -5 (both not checked)
// 5 -5 (just y)
// 5 5 (both checked)
// -5 5 (kust x)
if(showVector){
    ctx.beginPath();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0018c4';

    let vectorSize = 3;
    vectorSize *= (startingDilation / 100);

    for (let i = 1; i < midVectors.length; i++) {
        if (midVectors[i + 1] == null) {

        } else {
            // ctx.moveTo(midVectors[i].x, midVectors[i].y);
            // ctx.lineTo(midVectors[i+1].x, midVectors[i+1].y);this._size 
            drawArrow(ctx, midVectors[i].x, midVectors[i].y, midVectors[i + 1].x, midVectors[i + 1].y, (vectorSize *= (dilation / 100)), "#0018c4");

        }

    }

    ctx.closePath();
    ctx.stroke();
}


}
/** loads current braids into select for easier navigation */
function loadBraids() {
    $('#braid-select').html("");
    for (let i = 0; i < Braids.length; i++) {
        $('#braid-select').append($('<option>', {
            value: i,
            text: 'Braid ' + (i + 1),
            selected: currBraidIndex == i ? true : false
        }));
    }
}

function selectBraidFromSelect(value) {
    for (let i = 0; i < Braids.length; i++) {
        if (i == value) {
            currBraidIndex = i;
            setParamsForBraid(Braids[i]);
            loadCanvas();
            loadBraids();
            break;
        }
    }



}
loadCanvas();
loadBraids();


function clearCanvas() {

    if (confirm('WARNING, this will delete all beads')){     

        while (Braids.length > 0){
            Braids.splice(currBraidIndex, 1);
            currBraidIndex = -1;
            loadCanvas();
            loadBraids();
        }


        
    }


}

$('#clear').on('click', ()=>{
    clearCanvas();
})