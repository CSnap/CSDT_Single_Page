/*

CSDT Custom Block Functions


*/

SpriteMorph.prototype.translatePercent = function (percent, direction) {

    var dest, delta=radians(this.heading), width=0, height=0;
    var newX=0, newY=0, dist=0, angle=0, X=0, Y=0;

    if(this.costume!=null)
        {
            width = this.costume.contents.width * this.scale;
            height = this.costume.contents.height * this.scale;
        }
        else
        {
            width = 32 * this.scale;
            height = 20 * this.scale;
        }


    if(direction[0] === 'height') {
        newY = this.yPosition() +
            (height * percent/100);
        dist = Math.sqrt(Math.pow(this.yPosition()-newY, 2));
        angle = this.heading*(Math.PI/180);

    } else {
        newX = this.xPosition() + 
            (width * percent/100);
        dist = Math.sqrt(Math.pow(this.xPosition()-newX, 2));
        angle = this.heading*(Math.PI/180)+(Math.PI/2);
    }
    if(dist!=0)
    {
        X = (-percent/Math.abs(percent))*dist*Math.cos(angle)+this.xPosition();
        Y = (percent/Math.abs(percent))*dist*Math.sin(angle)+this.yPosition();
        this.gotoXY(X,Y);
        this.positionTalkBubble();
    }

    
};

SpriteMorph.prototype.newSizeOfCurrent = function(percent){

    let val = (this.getScale()) *  (percent / 100);
    this.setScale(val);
};

SpriteMorph.prototype.pointAtAngle = function(angle){

    let val = (0 - angle) +  (90);
    this.setHeading(val);
};

SpriteMorph.prototype.rotateByDegrees = function(angle){
    this.turnLeft(angle);
};

SpriteMorph.prototype.reflectXAxis = function(){
    this.flipVertical();
    this.gotoXY(this.xPosition(), (this.yPosition() * -1));
};

SpriteMorph.prototype.reflectYAxis = function (){
    this.flipHorizontal();
    this.gotoXY((this.xPosition() * -1), this.yPosition());
};

SpriteMorph.prototype.getAngle = function () {
    return (90 - this.direction());
};

SpriteMorph.prototype.flipVertical = function(){
    var costume = this.costumes.contents[this.getCostumeIdx()-1],
    canvas = newCanvas(costume.extent()),
    ctx = canvas.getContext('2d');
    
    ctx.translate(0, costume.height());
    ctx.scale(1, -1);
    ctx.drawImage(costume.contents, 0, 0);
    costume.contents=canvas;
    costume.rotationCenter = new Point(
           costume.rotationCenter.x,
           costume.height() - costume.rotationCenter.y
    );
    
    this.costumes.contents[this.getCostumeIdx()-1] = costume;
    this.costume = costume;
    this.flippedX = !this.flippedX;
    this.changed();
    this.drawNew();
    this.changed();
    this.positionTalkBubble();
};

SpriteMorph.prototype.flipHorizontal = function(){
    var costume = this.costumes.contents[this.getCostumeIdx()-1],
    canvas = newCanvas(costume.extent()),
    ctx = canvas.getContext('2d');
    
    ctx.translate(costume.width(), 0);
    ctx.scale(-1, 1);
    ctx.drawImage(costume.contents, 0, 0);
    costume.contents=canvas;
    costume.rotationCenter = new Point(
           costume.width() - costume.rotationCenter.x,
           costume.rotationCenter.y
    );
    
    this.costumes.contents[this.getCostumeIdx()-1] = costume;
    this.costume = costume;
    this.flippedY = !this.flippedY;
    this.changed();
    this.drawNew();
    this.changed();
    this.positionTalkBubble();
};


SpriteMorph.prototype.setCostumeColor = function(color){
    this.setEffect('saturation', 100);
    this.setEffect('color', color);
};

SpriteMorph.prototype.changeCostumeColor = function(color){
    this.setEffect('saturation', 100);
    this.changeEffect('color', color);
};

SpriteMorph.prototype.setCostumeOpacity = function(opacity){
    // this.setEffect('saturation', 100);
    this.setEffect('ghost', opacity);
};

SpriteMorph.prototype.changeCostumeOpacity = function(opacity){
    // this.setEffect('saturation', 100);
    this.changeEffect('ghost', opacity);
};








SpriteMorph.prototype.smoothBorders = function(start, dest) {
    var tempSize = this.size,
        tempColor = this.color;
    for(line = 0; line  < this.lineList.length; line++) {
      this.size = this.lineList[line][2];
      this.color = this.lineList[line][3];
      this.drawLine(this.lineList[line][0], this.lineList[line][1], false);

    }
    this.size = tempSize;
    this.color = tempColor;
    this.lineList = [];
};


SpriteMorph.prototype.getBorderSize = function () {
    return this.borderSize;
};

SpriteMorph.prototype.setBorderSize = function (size) {
    // pen size
    if (!isNaN(size)) {
        this.borderSize = Math.min(Math.max(+size, 0.0001), 1000);
    }
};


SpriteMorph.prototype.changeHue = function (delta) {
    this.setHue(this.getHue() + (+delta || 0));
};

SpriteMorph.prototype.getBorderHue = function () {
    return this.borderColor.hsv()[0] * 100;
};

SpriteMorph.prototype.setBorderHue = function (num) {
    var hsv = this.borderColor.hsv(),
        x = this.xPosition(),
        y = this.yPosition();

    hsv[0] = Math.max(Math.min(+num || 0, 100), 0) / 100;
    hsv[1] = 1; // we gotta fix this at some time
    this.borderColor.set_hsv.apply(this.borderColor, hsv);
    if (!this.costume) {
        this.drawNew();
        this.changed();
    }
    this.gotoXY(x, y);
};
//add border shade functionality - Get, Set, and Change

SpriteMorph.prototype.getBorderShade = function () {
		return ((this.borderColor.hsv()[2] * 50) + (50 - (this.borderColor.hsv()[1] * 50)));
};

SpriteMorph.prototype.setBorderShade = function (num) {

      var hsv = this.borderColor.hsv(),
        x = this.xPosition(),
        y = this.yPosition();

		//Num goes in 0-100 range. 0 is black, 50 is the unchanged hue, 100 is white
		num = Math.max(Math.min(+num || 0, 100), 0) / 50;
		hsv[1] = 1;
		hsv[2] = 1;

		if(num > 1) {
			hsv[1] = (2 - num); //Make it more white
		}
		else {
			hsv[2] = num; //Make it more black
		}

		this.borderColor.set_hsv.apply(this.borderColor, hsv);
		if (!this.costume) {
			this.drawNew();
			this.changed();
		}
		this.gotoXY(x, y);

};

SpriteMorph.prototype.changeBorderShade = function (delta) {
	return this.setBorderShade(this.getBorderShade() + (+delta || 0));

};

