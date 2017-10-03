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
        this._x += dx;
        this._y += dy;
        this._midpoint.x += dx;
        this._midpoint.y += dy;
        return this;
    }

    /** Rotates the braid on around the z axis
     * @param {number} angle Amount to rotate (in radians or degrees)
     * @param {boolean} radians true if radians false if degrees
     *
     * @return {Braid} returns "this" for chaining
     */
    rotate(angle, radians = true) {
        this._rotation += radians ? angle : degToRad(angle);
        return this;
    }

    /** Draws braid based on current data stored in braid
     * @return {Braid} returns "this" for chaining
     */
    stamp() {
        const lineWidth = this._size / 7;
        const offset = lineWidth / 2;
        const position = {
            x: this._x,
            y: this._y,
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

new Braid(50, 100, 100, canvas)
    .stamp()
    .translate(25, 0)
    .rotate(15, false)
    .stamp();
