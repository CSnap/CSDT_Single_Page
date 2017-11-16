/** defines a segment
@param {int} x1 - starting x location
@param {int} y1 - starting y location
@param {int} x2 - ending x location
@param {int} y2 - ending y location
@param {int} segType - type of segement
*/
function Segment(x1, y1, x2, y2, segType) {
    this.x1 = x1;
    this.x2 = x2;
    this.y1 = y1;
    this.y2 = y2;
    this.segType = segType; // 0, 1, 2, 3, 4
}

Segment.prototype.hitTest = function(hitX, hitY) {
    let xkj = this.x1 - hitX;
    let ykj = this.y1 - hitY;
    let xlk = this.x1 - this.x2;
    let ylk = this.y1 - this.y2;
    let tolerance = 5;


    let denom = xlk * xlk + ylk * ylk;

    let t = ((xkj * xlk) + (ykj * ylk )) / denom;

    if (t < 0 || t > 1) {
        return false;
    }

    let crossProd = Math.abs(((this.y1 - this.y2) * (hitX - this.x2)) -
    ((this.x1 - this.x2) * (hitY - this.y2)));

    let distance = Math.sqrt(denom);
    return ((crossProd / distance) < tolerance);
};

Segment.prototype.drawToContext = function(context) {
    if (this.segType == 1) {
        context.strokeStyle = 'red';
    }
    if (this.segType == 2) {
        context.strokeStyle = 'black';
    }
    if (this.segType == 3) {
        context.strokeStyle = 'yellow';
    }
    if (this.segType == 4) {
        context.strokeStyle = 'blue';
    }
    if (this.segType == 5) {
        context.strokeStyle = 'green';
    }
    if (this.segType == 6) {
        context.strokeStyle = 'gray';
    }

    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(this.x1, this.y1);
    context.lineTo(this.x2, this.y2);
    context.fill();
    context.stroke();
};
