const canvas = document.getElementById('tutorial');
if (canvas.getContext) {
    const context = canvas.getContext('2d');
    draw(context);
}

/** Fxn that draws VALERIE using a variety of shapes and lines*/ 
function draw(ctx) {
    ctx.beginPath();
    ctx.moveTo(65, 100); // V outer	
    ctx.lineTo(115, 275);
    ctx.lineTo(165, 100);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(90, 100); // V cutout 
    ctx.lineTo(140, 100);
    ctx.lineTo(115, 200);
    ctx.fillStyle = 'rgba(255, 255, 255, 100)';
    ctx.fill();
    ctx.closePath();
    ctx.beginPath(); // A outer      
    ctx.fillStyle = 'rgba(0, 0, 0, 100)';
    ctx.moveTo(175, 150);
    ctx.lineTo(125, 275);
    ctx.lineTo(225, 275);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath(); // A Inner Clear        
    ctx.fillStyle = 'rgba(255, 255, 255, 100)';
    ctx.moveTo(175, 210);
    ctx.lineTo(150, 275);
    ctx.lineTo(200, 275);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath(); // A Crossbar   
    ctx.fillStyle = 'rgba(0, 0, 0, 100)';
    ctx.fillRect(150, 240, 50, 25);
    ctx.fillRect(225, 150, 75, 125); // L    
    ctx.clearRect(250, 150, 50, 100);
    ctx.fillRect(310, 150, 25, 125); // E    
    ctx.fillRect(310, 150, 75, 25);
    ctx.fillRect(310, 200, 65, 25);
    ctx.fillRect(310, 250, 75, 25);
    ctx.moveTo(310, 145); // Accent  
    ctx.lineTo(385, 135);
    ctx.lineTo(375, 120);
    ctx.fill();
    ctx.closePath();
    ctx.fillRect(390, 150, 25, 125); // R Stem       
    ctx.beginPath();
    ctx.arc(415, 190, 40, (Math.PI/180)*90, (Math.PI/180)*270, 1); // R Out Arc      
    ctx.fill();
    ctx.closePath();
    ctx.beginPath(); // R Inner Arc  
    ctx.fillStyle = 'rgba(255, 255, 255, 100)';
    ctx.arc(415, 190, 15, (Math.PI/180)*90, (Math.PI/180)*270, 1);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 0, 0, 100)';
    ctx.moveTo(390, 230);
    ctx.lineTo(455, 230);
    ctx.lineTo(455, 275);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(460, 150);
    ctx.lineTo(460, 275);
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(460, 130, 10, 0, (Math.PI/180)*360, 0);
    ctx.fill();
    ctx.fillRect(470, 150, 25, 125); // E    
    ctx.fillRect(470, 150, 75, 25);
    ctx.fillRect(470, 200, 65, 25);
    ctx.fillRect(470, 250, 75, 25);
}
