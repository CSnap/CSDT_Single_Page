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
        this._ctx = canvas.getContext('2d');
        this._midpoint = {
            x: this._x + this._size / 2,
            y: this._y + this._size / 2,
        };
    }

    /** Draws braid based on current data stored in braid
     * @return {Braid} returns "this" for chaining
     */
    stamp() {
        const lineWidth = this._size / 7;
        const offset = lineWidth / 2;
        this._ctx.beginPath();
        this._ctx.lineWidth = lineWidth;
        // Draws left arm
        this._ctx.moveTo(this._x + offset, this._y + offset);
        this._ctx.lineTo(this._midpoint.x, this._midpoint.y);
        // Draws right arm
        this._ctx.moveTo(this._x + this._size - offset, this._y + offset);
        this._ctx.lineTo(this._x + offset, this._y + this._size - offset);
        this._ctx.stroke();
        return this;
    }
}


(new Braid(50, 100, 100, canvas)).stamp();
