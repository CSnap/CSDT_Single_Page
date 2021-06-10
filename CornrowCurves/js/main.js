/* eslint-disable */

// Application ID can be found via django admin panel
let applicationID = 99;

// Create cloud instance
window.csdtCloud = new Cloud(applicationID);

// Cornrow Curves Math variables
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
let overlapBuffer = 0;


// Default state values for a current braid
let defaultValues = {
    iteration: 0,
    x: 0,
    y: 0,
    startAngle: 0,
    startDilation: 100,
    reflectX: false,
    reflectY: false,
    translate: 50,
    rotate: 0,
    dilate: 100
};

let exampleValues = {
    iteration: 16,
    x: -142,
    y: 140,
    startAngle: 0,
    startDilation: 161,
    reflectX: false,
    reflectY: false,
    translate: 50,
    rotate: -2,
    dilate: 97
}


const braidCanvas = document.getElementById('braidCanvas');
const imageCanvas = document.getElementById('imageCanvas');

$('#data-form').on('change keyup input', loadCanvas);
let Braids = [];
let currBraidIndex = 0;

let localVars = {
    projectName: 'Untitled',
    userID: -1,
    userName: '',
    loadingText: '',
    projectID: typeof config !== 'undefined' ? config.project.id : "",
    loginStatus: false,
    dataSource: Braids,
    imageSource: braidCanvas
};

globals = {
    ...localVars,
    ...globals
};

let saveObject = {
    project: Braids,
    image: braidCanvas
}


let appReferences = {
    iterationsParam: '#iterations',
    xParam: '#start-x',
    yParam: '#start-y',
    angleParam: '#start-angle',
    startDilationParam: '#start-dilation',
    reflectXParam: '#reflectx',
    reflectYParam: '#reflecty',
    translateParam: '#x-translation',
    rotateParam: '#rotation',
    dilateParam: '#dilation',

    braidSelection: '#braid-select',
    printPageBtn: '#printAppPage',
    clearBraidsBtn: '#clearBraids',
    loadLocalProject: '#loadLocalProject',
    saveLocalProject: '#saveLocalProject',
    braidCanvas: '#braidCanvas',
    braidCanvasContainer: '#canvas-container',

    braidGoal: '.braid-img',
    braidGoalPlaceholder: '#goal-image',
    braidGallery: '#braidGallery',
    braidGalleryContainer: 'braidGalleryContainer',

    newBraidBtn: '#new-braid',
    resetCurrentBtn: '#reset-braid',
    deleteSelectedBtn: '#delete-braid',
    toggleGridBtn: '#hideGrid',
    toggleInitPointBtn: '#addAtCurrentPoint',
    togglePointLocationBtn: '#showCoordinatesOption',
    togglePointHighlightBtn: '#hideHighlight',
    togglePointVectorBtn: '#showVector',

    dataContainer: '#data-container',
    coordinatePanel: '#showCoordinates'

}

/** Class representing a single braid and containing methods for drawing it */
class Braid {
    /**
     * @param {number} size width of the braid in pixels
     * @param {number} x x coordinate point
     * @param {number} y y coordinate point
     * @param {number} startAngle the starting angle of the braid
     * @param {string} startReflection the starting reflection of the braid
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
            x: x,
            y: y,
        };
        this.translate(0, 0, startAngle, inRadians);
        this._reflection = startReflection;
    }

    /** Clone constructor
     * Note: this._y + this._size / 2 (if point is in corner or not..)
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
            x: this._x,
            y: this._y,
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
        let reflectionX = this._reflection == null ? 1 : (this._reflection.includes('y') ? -1 : 1);
        let reflectionY = this._reflection == null ? 1 : (this._reflection.includes('x') ? -1 : 1);

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
            x: this._x,
            y: this._y,
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
            x: this._x - (this._size / 2) + offset,
            y: this._y - (this._size / 2) + offset,
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
            x: this._x + this._size - (this._size / 2) - offset,
            y: this._y - (this._size / 2) + offset,
        }, this._rotation, position);
        upperRightCorner = reflect(upperRightCorner.x, upperRightCorner.y,
            this._midpoint.x, this._midpoint.y, this._reflection);
        let lowerLeftCorner = rotateAroundPoint({
            x: this._x - (this._size / 2) + offset,
            y: this._y + this._size - (this._size / 2) - offset,
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

        return this;
    }

    /** Draws vector based on current data stored in braid
     * @param {string} color an optional hex code containt the color to stamp
     * @param {number} width an optional width for the braid strokes
     *
     * @return {Braid} returns "this" for chaining
     */
    vector(midA, midB, color = '#33ff33', width = 1 / 8) {
        // 7 is an arbitrary number for lineWidth that seems to look good
        const lineWidth = this._size * width;
        // Offset keeps all corners of the lines within the size x size square
        const offset = lineWidth / 2;

        this._ctx.beginPath();
        this._ctx.lineWidth = lineWidth;
        this._ctx.strokeStyle = color;

        // Draws arrow body
        this._ctx.moveTo(midA.x, midA.y);
        this._ctx.lineTo(midB.x, midB.y);
        this.collisionParams[0] = {
            x0: midA.x,
            y0: midA.y,
            x1: midB.x,
            y1: midB.y,
        };

        this._ctx.closePath();
        this._ctx.stroke();

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
        const vectorStamp = this.stamp().clone();
        let midA = {
            x: this._x,
            y: this._y
        };
        let midB = {
            x: this._x,
            y: this._y
        };

        // Steps into first iteration for the vector to extend (there's probably a better way to do this, but....)
        if (showVector) {
            vectorStamp
                .translate(this.iteration.translateX,
                    this.iteration.translateY, this.iteration.rotationAngle,
                    this.iteration.inRadians)
                .dilate(this.iteration.dilation);
        }


        for (let i = 0; i < (n ? n : this.iteration.n); i++) {
            if (showVector) {
                midA.x = braidToStamp._midpoint.x;
                midA.y = braidToStamp._midpoint.y;
            }

            braidToStamp
                .translate(this.iteration.translateX,
                    this.iteration.translateY, this.iteration.rotationAngle,
                    this.iteration.inRadians)
                .dilate(this.iteration.dilation)
                .stamp('#000000');
            if (showVector) {
                vectorStamp
                    .translate(this.iteration.translateX,
                        this.iteration.translateY, this.iteration.rotationAngle,
                        this.iteration.inRadians)
                    .dilate(this.iteration.dilation);
                midB.x = braidToStamp._midpoint.x;
                midB.y = braidToStamp._midpoint.y;

                vectorStamp.vector(midA, midB);
            }

        }
        // Allows the vector to extend to its next iteration.
        if (showVector) {
            let vectorN = (n ? n : this.iteration.n);
            midA.x = (vectorN == 0) ? (midA.x) : vectorStamp._midpoint.x;
            midA.y = (vectorN == 0) ? (midA.y) : vectorStamp._midpoint.y;
            vectorStamp.vector(midA, midB);
        }
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



/**
 * 
 * 
 * Work in Progress Functions
 * 
 * 
 */



// WIP: setXYOffset is suppose to be what Ron wanted. Offset new braids to avoid overlapping. However
// we are not accurate in saying 'Add braid to origin or to current'. 
function setXYOffset() {
    let x = parseFloat($(appReferences.xParam).val()) + 10;
    let y = parseFloat($(appReferences.yParam).val()) - 10;

    $(appReferences.xParam).val(x);
    $(appReferences.yParam).val(y);
}





/* Reworked Helper Functions
 * 
 * 
 * 
 * 
 * 
 */

/** rotateAroundPoint: Rotates one point around another
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

/** reflect: reflects a braid based on the given info
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

/** degToRad: Convert degrees to radians
 * @param {number} angle
 *
 * @return {number}
 */
function degToRad(angle) {
    return angle * Math.PI / 180;
}

/** radToDeg: Convert radians to degrees
 * @param {number} angle
 *
 * @return {number}
 */
function radToDeg(angle) {
    return angle * 180 / Math.PI;
}

/**setCurrentBraidValues: Sets/Resets the braid to a default, predetermined state on the canvas.
 * 
 * @param {*} data 
 * @param {*} isReset 
 */
function setCurrentBraidValues(data, isReset = false) {
    // Set all the braid's values

    $(appReferences.iterationsParam).val(data.iteration);
    // If the user doesn't want to add the braid at the current 
    // point, or if the user is not currently resetting the braid
    if (!isReset && !addAtCurrentPoint) {
        $(appReferences.xParam).val(data.x);
        $(appReferences.yParam).val(data.y);
    }
    $(appReferences.angleParam).val(data.startAngle);
    $(appReferences.startDilationParam).val(data.startDilation);
    $(appReferences.reflectXParam).prop('checked', data.reflectX);
    $(appReferences.reflectYParam).prop('checked', data.reflectY);

    $(appReferences.translateParam).val(data.translate);
    $(appReferences.rotateParam).val(data.rotate);
    $(appReferences.dilateParam).val(data.dilate);
}

/** checkForOverlappingPlait: Returns true if there is at least one element in the array
 * 
 * @returns bool (if any braids overlap with current)
 */
function checkForOverlappingPlait() {

    // First, get current x and y values
    let startX = parseFloat($(appReferences.xParam).val()) * ($(appReferences.reflectYParam).is(':checked') ? -1 : 1);
    let startY = parseFloat($(appReferences.yParam).val() * -1 * ($(appReferences.reflectXParam).is(':checked') ? -1 : 1));

    // Second, grab the current canvas width and height (for proper calculations)
    let currentCanvasWidth = (parseInt(window.getComputedStyle(braidCanvas).width) - 2);
    let currentCanvasHeight = currentCanvasWidth;

    // Third, calculate the accurate x and y values (the ones that the braids actually use)
    let x = currentCanvasWidth / 2 + startX;
    let y = currentCanvasHeight / 2 + startY;

    // Find braids that overlap based on the current x and y value
    let flaggedBraids = Braids.filter(braid => braid.contains(x, y));

    // Return if there is at least one braid flagged or not.
    return flaggedBraids[0] != undefined;

}

/** createNewBraid: Creates a new braid with the default values declared at the top of the file.
 * 
 */
function createNewBraid() {

    // First, prep the current braid values 
    setCurrentBraidValues(defaultValues);

    // Second, check if there are any overlapping
    isCurrentlyOverlapping = checkForOverlappingPlait();

    // Third, apply solution for overlapping plaits
    // setXYOffset();

    // Fourth, add the braid to the stack and adjust the braid index
    Braids.push(new Braid(braidCanvas.width / 20,
        braidCanvas.width / 2, braidCanvas.height / 2,
        0, '', braidCanvas, false));
    currBraidIndex = Braids.length - 1;

    // Finally, reload the canvas and braids.
    loadCanvas();
    updateBraidSelect();
}

/** deleteSelectedBraid: Deletes the currently selected braid.
 * 
 */
function deleteSelectedBraid() {

    // Grabs the latest braid
    Braids.splice(currBraidIndex, 1);

    // Update the index
    currBraidIndex = currBraidIndex - 1;

    // Reload the canvas and braids
    loadCanvas();
    updateBraidSelect();
}

/** toggleGrid: Toggles the grid in canvas
 *
 */
function toggleGrid() {
    hideGrid = !hideGrid;
    loadCanvas();
    $(appReferences.toggleGridBtn).text(hideGrid ? "Show Grid" : "Hide Grid");
}

/** toggleInitPointLocation: Toggles the starting point in canvas
 *
 */
function toggleInitPointLocation() {
    $(appReferences.toggleInitPointBtn).text(addAtCurrentPoint ? "Add Braid at Current Point" : "Add Braid at Origin");
    addAtCurrentPoint = !addAtCurrentPoint;
}

/** togglePointDisplayLocation: Toggles the coordinate point display in the bottom right corner
 *
 */
function togglePointDisplayLocation() {
    $(appReferences.togglePointLocationBtn).text(showCoordinatesInCorner ? "XY In Lower Right" : "XY Follows Mouse");
    showCoordinatesInCorner = !showCoordinatesInCorner;

}

/** toggleBraidHighlight: Toggles the initial braid highlight
 *
 */
function toggleBraidHighlight() {
    $(appReferences.togglePointHighlightBtn).text(hideHighlight ? "Hide Plait Highlight" : "Show Plait Highlight");
    hideHighlight = !hideHighlight;
    loadCanvas();

}

/** toggleVector: Toggles the vector visible on the braid
 *
 */
function toggleVector() {
    $(appReferences.togglePointVectorBtn).text(showVector ? "Show Vector" : "Hide Vector");
    showVector = !showVector;
    loadCanvas();
}

/** clearCanvas: Clears entire canvas from braids. 
 * 
 */
function clearCanvas() {
    //  Ask first if the user is ok with getting rid of all the braids
    if (confirm('WARNING, this will delete all braids')) {

        // Systematically pop each braid and decrement the index
        while (Braids.length > 0) {
            Braids.splice(currBraidIndex, 1);
            currBraidIndex = -1;
            loadCanvas();
            updateBraidSelect();
        }
    }
}

/** loadBraidsFromJSON: Load a project into memory
 * 
 * @param {string} text a JSON string
 */
function loadBraidsFromJSON(text) {

    try {
        // Reset the length of the braids and index
        Braids.length = 0;
        currBraidIndex = -1;

        // Attempt to parse the text into the braids
        JSON.parse(text).forEach((obj) => {
            // Create a new braid from the current data set
            let currentBraid = new Braid(obj.size, obj.x, obj.y, obj.rotation,
                obj.reflection, braidCanvas);

            // Push the braid onto the stack and increment
            Braids.push(currentBraid);
            ++currBraidIndex;

            // Set the braid's iteration parameters
            Braids[currBraidIndex].setIterationParameters(obj.iteration.translateX,
                obj.iteration.translateY, obj.iteration.rotationAngle,
                obj.iteration.inRadians, obj.iteration.dilation, obj.iteration.n);
        });

        // Either create a new braid since the file was blank, or establish the params for each braid
        if (Braids.length === 0) {
            setCurrentBraidValues(defaultValues);
        } else {
            setParamsForBraid(Braids[currBraidIndex]);
        }

        // Reload the canvas and braids.
        loadCanvas();
        updateBraidSelect();
    } catch (e) {
        console.error('Note to Developer: Failed to load the given local file.');
        console.error(`Error Output: ${JSON.stringify(e)}`);
    }

}

/** createBraidGallery: Populates the modal within the html with the clickable images users can select as a guide/goal
 * 
 * Goes off the assumption that all gallery images you want to populate follow this format "cc-#.jpg" inside the img folder.
 * 
 * Note: We should probably make this more dynamic by detecting how many images are in the folder, but the number '24' has been 
 * consistent for years...
 * 
 */
function createBraidGallery() {

    // Current number of images available for the gallery
    let numOfImages = 24;
    for (let i = 0; i < numOfImages; i++) {

        // DOM element creation
        let parentContainer = document.getElementById(appReferences.braidGalleryContainer);
        let childContainer = document.createElement('div');
        let image = document.createElement('img');

        // Assigning all the classes and attributes
        childContainer.classList.add('col-md-4', 'col-sm-1');
        image.classList.add('img-fluid', 'mb-1', 'mt-1', 'braid-img');
        image.setAttribute('src', `./img/cc-${i}.jpg`);

        // Appending the child to the parent container (image to gallery)
        childContainer.appendChild(image);
        parentContainer.appendChild(childContainer);

        // Add event handler to each image
        $(childContainer).on('click', (e) => {
            $(appReferences.braidGoalPlaceholder).attr('src', e.target.getAttribute('src'));
            $(appReferences.braidGallery).modal('hide');
        })
    }
}

/** updateBraidSelect: Updates the braid select input with the current braids
 * 
 */
function updateBraidSelect() {
    // Clear the current options 
    $(appReferences.braidSelection).html("");

    // Iterates through the braids and appends the updated options 
    for (let i = 0; i < Braids.length; i++) {
        $(appReferences.braidSelection).append($('<option>', {
            value: i,
            text: 'Braid ' + (i + 1),
            selected: currBraidIndex == i ? true : false
        }));
    };
}

/** loadBraidFromSelect: Based on user selection, load in braid
 * @param {num} value input value 
 */
function loadBraidFromSelect(value) {

    if (value > Braids.length || value < 0) {
        console.error('Note to Developer: Invalid value given from braid selection.')
    } else {
        currBraidIndex = value;
        setParamsForBraid(Braids[value]);
        loadCanvas();
        updateBraidSelect();
    }

}

/** setParamsForBraid: Sets parameters to those for a certain braid
 * @param {Braid} braid
 */
function setParamsForBraid(braid) {
    $(appReferences.xParam).val((braid._x - braidCanvas.width / 2) * (braid._reflection.includes('y') ? -1 : 1));
    $(appReferences.yParam).val((-(braid._y - braidCanvas.height / 2)) * (braid._reflection.includes('x') ? -1 : 1));
    $(appReferences.angleParam).val(radToDeg(braid._rotation) * -1);
    $(appReferences.startDilationParam).val(braid._size * 2000 / braidCanvas.width);
    $(appReferences.reflectXParam).prop('checked', braid._reflection.includes('x'));
    $(appReferences.reflectYParam).prop('checked', braid._reflection.includes('y'));
    $(appReferences.iterationsParam).val(braid.iteration.n);
    $(appReferences.translateParam).val(braid.iteration.translateX);
    $(appReferences.rotateParam).val(braid.iteration.rotationAngle * -1);
    $(appReferences.dilateParam).val(braid.iteration.dilation);
}

/** loadCanvas: loads canvas at the correct height and iterates with current settings 
 * 
 */
function loadCanvas() {

    // Wipes the entire canvas clean
    const ctx = braidCanvas.getContext('2d');
    ctx.clearRect(0, 0, braidCanvas.width, braidCanvas.height);

    // Gets all form values
    const iterations = parseInt($(appReferences.iterationsParam).val());
    const startX = parseFloat($(appReferences.xParam).val()) * ($(appReferences.reflectYParam).is(':checked') ? -1 : 1);
    const startY = parseFloat($(appReferences.yParam).val() * -1 * ($(appReferences.reflectXParam).is(':checked') ? -1 : 1));
    const startAngle = parseFloat($(appReferences.angleParam).val() * -1);
    const startingDilation = parseFloat($(appReferences.startDilationParam).val());
    const xTranslation = parseFloat($(appReferences.translateParam).val());
    const rotation = parseFloat($(appReferences.rotateParam).val() * -1);
    const dilation = parseFloat($(appReferences.dilateParam).val());
    const xReflection = $(appReferences.reflectXParam).is(':checked');
    const yReflection = $(appReferences.reflectYParam).is(':checked');
    const reflection = ('' + (xReflection ? 'x' : '') +
        (yReflection ? 'y' : ''));


    // Dynamically resizes canvas and data form
    if ($(window).width() < 992 && $(appReferences.braidCanvasContainer).hasClass('col-6')) {
        $(appReferences.braidCanvasContainer).toggleClass('col-6 col-12');
        $(appReferences.dataContainer).toggleClass('col-6 col-12');
    } else if ($(window).width() >= 992 &&
        $(appReferences.braidCanvasContainer).hasClass('col-12')) {
        $(appReferences.braidCanvasContainer).toggleClass('col-12 col-6');
        $(appReferences.dataContainer).toggleClass('col-12 col-6');
    }

    // Set the width and height of the canvas
    braidCanvas.width = (parseInt(window.getComputedStyle(braidCanvas).width) - 2);
    braidCanvas.height = braidCanvas.width;

    // Create/update the current braid values
    Braids[currBraidIndex] = new Braid(braidCanvas.width * startingDilation / 2000,
            braidCanvas.width / 2 + startX, braidCanvas.height / 2 + startY,
            startAngle, reflection, braidCanvas, false)
        .setIterationParameters(xTranslation, 0, rotation, false,
            dilation, iterations);


    // Executes if the user toggles the grid off
    if (!hideGrid) {

        // Draws the grid lines
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#8e8e8e55';
        for (let i = braidCanvas.width / 2; i >= 0; i -= 10) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i, braidCanvas.height);
            ctx.moveTo(0, i);
            ctx.lineTo(braidCanvas.width, i);
            ctx.moveTo(braidCanvas.width - i, 0);
            ctx.lineTo(braidCanvas.width - i, braidCanvas.height);
            ctx.moveTo(0, braidCanvas.width - i);
            ctx.lineTo(braidCanvas.width, braidCanvas.width - i);
        }
        ctx.closePath();
        ctx.stroke();

        //Draws the X and Y axis
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(braidCanvas.width / 2, 0);
        ctx.lineTo(braidCanvas.width / 2, braidCanvas.height);
        ctx.moveTo(0, braidCanvas.height / 2);
        ctx.lineTo(braidCanvas.width, braidCanvas.height / 2);
        ctx.closePath();
        ctx.stroke();
    }

    // Inits the vectors for the braid
    midVectors = [];

    // Iterates through each braid and draws them to the canvas
    for (let i = 0; i < Braids.length; i++) {
        if (i === currBraidIndex && !hideHighlight) {
            Braids[i]
                .clone()
                .translate(-2 * (yReflection ? -1 : 1), 2 * (xReflection ? -1 : 1), 0, 0)
                .dilate(110)
                .stamp('#FF0000', (12 / 70));
        }
        Braids[i].iterate();
    }

}






/** Application event bindings**/


// Prints the page in landscape for the user
$(appReferences.printPageBtn).on('click', () => {
    printApplicationPage();
})

// Clears all the braids from the canvas
$(appReferences.clearBraidsBtn).on('click', () => {
    clearCanvas();
})

// Saves the user's braid project as a JSON file
$(appReferences.saveLocalProject).on('click', () => {
    let filename = $('#project-name').val();
    let text = JSON.stringify(Braids.map((b) => b.serialize()));

    downloadStringAsFile(`${filename}.json`, text);
});

// Loads the user's selected json braid project
$(appReferences.loadLocalProject).on('change', (e) => {
    let file = e.target.files[0];
    if (!file) {
        return;
    }
    let reader = new FileReader();
    reader.onload = (e) => {
        loadBraidsFromJSON(e.target.result);
    };
    reader.readAsText(file);
});

// Creates a new braid based on the user's preference (at current location or at origin)
$(appReferences.newBraidBtn).on('click', () => {
    createNewBraid();
});

// Resets the user's current braid to its default state.
$(appReferences.resetCurrentBtn).on('click', () => {
    setCurrentBraidValues(defaultValues, true);
    loadCanvas();
});

// Toggles the grid visibility 
$(appReferences.toggleGridBtn).on('click', () => {
    toggleGrid();
})

// Determines where new braids will appear (at current location or at origin)
$(appReferences.toggleInitPointBtn).on('click', () => {
    toggleInitPointLocation();
});

// Determines where the coordinate point system is located (with the mouse or in bottom right)
$(appReferences.togglePointLocationBtn).on('click', () => {
    togglePointDisplayLocation();
});

// Determines the highlight of the current braid
$(appReferences.togglePointHighlightBtn).on('click', () => {
    toggleBraidHighlight();
});

// Determines the appearance of a braid vector or not
$(appReferences.togglePointVectorBtn).on('click', () => {
    toggleVector();
});

// Deletes the currently selected braid
$(appReferences.deleteSelectedBtn).on('click', () => {
    deleteSelectedBraid();
});

// Updates the current braid based on user's selection
$(appReferences.braidSelection).on('change', (e) => {
    loadBraidFromSelect(e.target.value);
})



$(appReferences.braidCanvas).on('mousemove', (e) => {
    loadCanvas();

    const ctx = braidCanvas.getContext('2d');
    const x = e.offsetX;
    const y = e.offsetY;

    if (!showCoordinatesInCorner) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y - 12, 60, 15);
        ctx.fillStyle = '#000000';
        ctx.fillText(
            '(' + ((x - braidCanvas.width / 2)) + ',' +
            ((y - braidCanvas.width / 2) * -1) + ')', x, y
        );
        mouseText = {
            x,
            y,
        };
        $(appReferences.coordinatePanel).text("");
        $(appReferences.coordinatePanel).removeClass("coordinate-backing");
    } else {
        $(appReferences.coordinatePanel).text('(' + (x - braidCanvas.width / 2) + ',' + ((y - braidCanvas.width / 2) * -1) + ')');
        $(appReferences.coordinatePanel).addClass("coordinate-backing");
    }
    for (let i = 0; i < Braids.length; i++) {
        if (Braids[i].contains(x, y) && !hideHighlight) {
            Braids[i].stamp('#FF0000');
        }
    }



});

$(appReferences.braidCanvas).on('mouseleave', (e) => {
    loadCanvas();
});

$(appReferences.braidCanvas).on('click', (e) => {
    const x = e.offsetX;
    const y = e.offsetY;
    for (let i = 0; i < Braids.length; i++) {
        if (Braids[i].contains(x, y)) {
            currBraidIndex = i;
            setParamsForBraid(Braids[i]);
            loadCanvas();
            updateBraidSelect();
            break;
        }
    }
});



/**
 * Cloud Connections
 */

$(`#${cloudUI.signInSubmit}`).on('click', () => {
    csdtCloud.submitSignInRequest();
});

$(`#${cloudUI.signInPrompt}`).on('keydown', function (e) {
    var key = e.which || e.keyCode;
    if (key == 13) {
        csdtCloud.submitSignInRequest();
    }
});

$(`#${cloudUI.signOutSubmit}`).on('click', () => {
    csdtCloud.submitSignOutRequest();
});

$(`#${cloudUI.loadProjectSubmit}`).on('click', () => {
    csdtCloud.loadFromCloud($(`#${cloudUI.loadProjectList}`).val(), loadBraidsFromJSON);
});

$(`#${cloudUI.saveProjectSubmit}`).on('click', () => {
    csdtCloud.saveToCloud(saveObject, () => {
        console.log('callback function')
    });
});


loadCanvas();
updateBraidSelect();

createBraidGallery();
setLoadingOverlay(true, false);

// Save vs save as is needed

// Would be useful for a way to see the state of the project for debugging...


// Add tutorial js overrides for tutorials in www
/**Clears the stage for a tutorial (i.e. leaving just one braid, resetting values, etc.)
 * 
 */
//  function clearTutorial() {

//     let initBraid = Braids[0];

//     Braids = [];
//     currBraidIndex = 0;
//     Braids[currBraidIndex] = initBraid;

// }
// Override for tutorials
// let isTutorial = false;
/** Reset all inputs to overridden values based on current options / current values
 * 
 */
//  function setInputsToTutorial() {

//     if (!addAtCurrentPoint) {
//         $(appReferences.xParam).val('0');
//         $(appReferences.yParam).val('0');
//     }
// }


// How should the offset that Ron wanted originally be handled? 
// Ofsetting the current braid before adding a new braid? Or offsetting the new braid, leaving the current braid alone?