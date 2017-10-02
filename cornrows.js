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
        this.size = size;
        this.x = x;
        this.y = y;
        this.ctx = canvas.getContext('2d');
        this.midpoint = {
            x: this.x + this.size / 2,
            y: this.y + this.size / 2,
        };
    }

    /** Draws braid based on current data stored in braid
     * @return {Braid} returns "this" for chaining
     */
    draw() {
        const lineWidth = this.size / 7;
        const offset = lineWidth / 2;
        this.ctx.beginPath();
        this.ctx.lineWidth = lineWidth;
        this.ctx.moveTo(this.x + offset, this.y + offset);
        this.ctx.lineTo(this.midpoint.x, this.midpoint.y);
        this.ctx.moveTo(this.x + this.size - offset, this.y + offset);
        this.ctx.lineTo(this.x + offset, this.y + this.size - offset);
        this.ctx.stroke();
        return this;
    }
}


(new Braid(50, 100, 100, canvas)).draw();
