ctx=canvas.getContext("2d");
document.addEventListener("keydown",keyPush);
function drawMan(x, y) {
    if (canvas.getContext) {

        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2, true); // Outer circle
        ctx.moveTo(x+10, y+2.5);
        ctx.arc(x, y+2.5, 10, 0, Math.PI, false);  // Mouth (clockwise)
        ctx.moveTo(x-5.5, y-5);
        ctx.arc(x-8.5, y-5, 3, 0, Math.PI * 2, true);  // Left eye
        ctx.moveTo(x+11.5, y-5);
        ctx.arc(x+9.5, y-5, 3, 0, Math.PI * 2, true);  // Right eye
        
        ctx.moveTo(x, y+20);
        ctx.lineTo(x, y+50);
        ctx.moveTo(x, y+50);
        ctx.lineTo(x-10, y+90);
        ctx.moveTo(x, y+50);
        ctx.lineTo(x+10, y+90);
        ctx.moveTo(x, y+25);
        ctx.lineTo(x-10, y+55);
        ctx.moveTo(x, y+25);
        ctx.lineTo(x+10, y+55);

        ctx.moveTo(x-50, y+85);
        ctx.lineTo(x-35, y+95);
        ctx.lineTo(x+35, y+95);
        ctx.lineTo(x+50, y+85);
        ctx.stroke();
    }
};

function reset(spdx, spdy) {
    x = 300;
    y = 100;
    vx = spdx;
    vy = spdy;
}

function keyPush(evt) {
    switch(evt.keyCode) {
        case 37:
            vx -= 5;
            break;
        case 38:
            vy -= 5;
            break;
        case 39:
            vx += 5;
            break;
        case 40:
            reset(0,0);
            break;
    }
}

x = 300;
y = 100;
vx = 0;
vy = 0;
wall = 10;

function game() {
    ctx.clearRect(0, 0, 800, 600);
    drawMan(x, y);
    x+= vx;
    y+= vy;
    if (y > 500 && wall>0) {
        vy = -Math.floor(vy*0.7);
        vx = Math.floor(vx*0.7);
        wall = -10;
    }
    if ((x < 50 || x > 750) && wall > 0) {
        vy = Math.floor(vy*0.7);
        vx = -Math.floor(vx*0.7);
        wall = -10;
    }
    if (y < 501) vy+= 0.15;

    wall++;
}




setInterval(game,1000/60);
