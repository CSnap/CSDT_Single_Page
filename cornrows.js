const myCanvas = document.getElementById('myCanvas');
$('#data-form').on('change keyup input', loadCanvas);
const Braids = [];
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
        this._size = size;
        this._x = x;
        this._y = y;
        this._rotation = 0;
        this._ctx = canvas.getContext('2d');
        this._midpoint = {
            x: this._x + this._size / 2,
            y: this._y + this._size / 2,
        };
        this.translate(0, 0, startAngle, inRadians);
        this._reflection = startReflection;
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
     * @return {Braid} returns "this" for chaining
     */
    stamp() {
        // 7 is an arbitrary number for lineWidth that seems to look good
        const lineWidth = this._size / 7;
        // Offset keeps all corners of the lines within the size x size square
        const offset = lineWidth / 2;

        // Rotate all points to be used around "position"
        const position = {
            x: this._midpoint.x,
            y: this._midpoint.y,
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

        // Draws left arm
        this._ctx.moveTo(upperLeftCorner.x, upperLeftCorner.y);
        this._ctx.lineTo(midPoint.x, midPoint.y);
        // Draws right arm
        this._ctx.moveTo(upperRightCorner.x, upperRightCorner.y);
        this._ctx.lineTo(lowerLeftCorner.x, lowerLeftCorner.y);

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

        for (let i = 0; i <= (n ? n : this._iteration_n); i++) {
            this
                .translate(this._iteration_translateX,
                    this._iteration_translateY, this._iteration_rotationAngle,
                    this._iteration_inRadians)
                .dilate(this._iteration_dilation)
                .stamp();
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
        this._iteration_translateX = translateX;
        this._iteration_translateY = translateY;
        this._iteration_rotationAngle = rotationAngle;
        this._iteration_inRadians = inRadians;
        this._iteration_dilation = dilation;
        this._iteration_n = n;
        return this;
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


// Demonstration

$('#new-braid').click(() => {
    const startX = parseFloat($('#start-x').val());
    const startY = parseFloat($('#start-y').val());
    const startAngle = parseFloat($('#start-angle').val());
    const startingDilation = parseFloat($('#start-dilation').val());
    const xReflection = $('#reflectx').is(':checked');
    const yReflection = $('#reflecty').is(':checked');
    const reflection = ('' + (xReflection ? 'x' : '') +
        (yReflection ? 'y' : ''));

    Braids.push(new Braid(myCanvas.width * startingDilation / 2000,
        myCanvas.width / 2 + startX, myCanvas.height / 2 + startY,
        startAngle, reflection, myCanvas, false));
    currBraidIndex = Braids.length - 1;
    loadCanvas();
});


/** loads canvas at the correct height and iterates with current settings */
function loadCanvas() {
    const iterations = parseInt($('#iterations').val());
    const startX = parseFloat($('#start-x').val());
    const startY = parseFloat($('#start-y').val());
    const startAngle = parseFloat($('#start-angle').val());
    const startingDilation = parseFloat($('#start-dilation').val());
    const xTranslation = parseFloat($('#x-translation').val());
    const rotation = parseFloat($('#rotation').val());
    const dilation = parseFloat($('#dilation').val());
    const xReflection = $('#reflectx').is(':checked');
    const yReflection = $('#reflecty').is(':checked');
    const reflection = ('' + (xReflection ? 'x' : '') +
        (yReflection ? 'y' : ''));

    if ($(window).width() < 992 && $('#myCanvas').hasClass('col-6')) {
        $('#myCanvas').toggleClass('col-6 col');
    } else if ($(window).width() >= 992 && $('#myCanvas').hasClass('col')) {
        $('#myCanvas').toggleClass('col col-6');
    }

    myCanvas.width = parseInt(window.getComputedStyle(myCanvas).width);
    myCanvas.height = myCanvas.width;
    Braids[currBraidIndex] = new Braid(myCanvas.width * startingDilation / 2000,
            myCanvas.width / 2 + startX, myCanvas.height / 2 + startY,
            startAngle, reflection, myCanvas, false)
        .setIterationParameters(xTranslation, 0, rotation, false,
            dilation, iterations);
    for (let i = 0; i < Braids.length; i++) {
        Braids[i].iterate();
    }
}
loadCanvas();
