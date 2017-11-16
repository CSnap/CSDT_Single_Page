/** defines a segment
@param {int} posX - x location
@param {int} posY - y location
@param {int} rad - Size of point
*/
function Point(posX, posY, rad) {
    this.x = posX;
    this.y = posY;
    this.radius = rad;
    console.log('radius' + this.radius);
    this.color1 = 'rgb( 255, 0, 0)';
    this.color2 = 'rgb( 255, 192, 203)';
}

Point.prototype.hitTest = function(hitX, hitY) {
    let dx = this.x - hitX;
    let dy = this.y - hitY;
    return (dx*dx + dy*dy < this.radius*this.radius);
};

Point.prototype.drawToContext = function(context) {
    let grad = context.createRadialGradient(x - 0.33 * this.radius, y - 0.33 *
      this.radius, 0, x - 0.33 * this.radius, y - 0.33 * this.radius, 1.33
      * this.radius);
    grad.addColorStop(0, this.color2);
    grad.addColorStop(1, this.color1);
    context.fillStyle = grad;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    context.closePath();
    context.fill();
};
