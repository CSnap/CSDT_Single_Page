const canvas = document.getElementById('canvas');

/** Class representing a single braid and containing methods for drawing it */
class Braid {
    /**
     * @param {number} size width of the braid in pixels
     * @param {number} x
     * @param {number} y
     * @param {HTMLElement} canvas
     */
    constructor(size = 20, x, y, canvas) {
        this._size = size;
        this._x = x;
        this._y = y;
        this._rotation = 0;
        this._ctx = canvas.getContext('2d');
        this._midpoint = {
            x: this._x + this._size / 2,
            y: this._y + this._size / 2,
        };
    }

    /** Moves the braid on the x,y plane without rotating or resizing
     * @param {number} dx Amount x should change by
     * @param {number} dy Amount x should change by
     *
     * @return {Braid} returns "this" for chaining
     */
    translate(dx, dy) {
        const newMidpoint = rotateAroundPoint({
            x: dx,
            y: dy,
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

    /** Rotates the braid on around the z axis
     * @param {number} angle Amount to rotate (in radians or degrees)
     * @param {boolean} inRadians true if radians false if degrees
     *
     * @return {Braid} returns "this" for chaining
     */
    rotate(angle, inRadians = true) {
        this._rotation += inRadians ? angle : degToRad(angle);
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
        const upperLeftCorner = rotateAroundPoint({
            x: this._x + offset,
            y: this._y + offset,
        }, this._rotation, position);
        const midPoint = rotateAroundPoint({
            x: this._midpoint.x,
            y: this._midpoint.y,
        }, this._rotation, position);
        const upperRightCorner = rotateAroundPoint({
            x: this._x + this._size - offset,
            y: this._y + offset,
        }, this._rotation, position);
        const lowerLeftCorner = rotateAroundPoint({
            x: this._x + offset,
            y: this._y + this._size - offset,
        }, this._rotation, position);

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

/** Convert degrees to radians
 * @param {number} angle
 *
 * @return {number}
 */
function degToRad(angle) {
    return angle * Math.PI / 180;
}


// Demonstration

/** Iterates over the same given transformations a given number of times
 * @param {number} startX
 * @param {number} startY
 * @param {number} size
 * @param {number} translateX
 * @param {number} translateY
 * @param {number} rotationAngle
 * @param {boolean} inRadians
 * @param {number} n number of iterations
 */
function iterate(startX, startY, size,
    translateX, translateY,
    rotationAngle, inRadians,
    n) {
    const myBraid = new Braid(size, startX, startY, canvas).stamp();
    for (let i = 0; i < n; i++) {
        myBraid
            .rotate(rotationAngle, inRadians)
            .translate(translateX, translateY)
            .stamp();
    }
}

iterate(100, 100, 50, 25, 0, 15, false, 10);
