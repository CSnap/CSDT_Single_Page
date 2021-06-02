let blockImageBase = "./img/";


let when_clicked = {
    block: blockImageBase + 'whenClicked_block.png',
    exp: blockImageBase + 'whenClicked.gif',
    title: 'To start your project:',
    des: 'Runs your code. Anything <strong>attached</strong> to the block will run.',
    vid: blockImageBase + 'when_clicked_gif.mp4'
}
let clear = {
    block: blockImageBase + 'clear_block.png',
    exp: blockImageBase + 'freshStart.gif',
    title: 'To clear the stage:',
    des: 'Clears all pen marks and stamps from the stage. <p class="text-muted" style="font-size: medium;"> <strong>Note: </strong> The pen marks and stamps are not part of the background costume, therefore, when they are cleared, the background costume remains unchanged. </p>',
    vid: blockImageBase + 'clear_gif.mp4'
}
let stamp = {
    block: blockImageBase + 'stamp.png',
    exp: blockImageBase + 'stamp.gif',
    title: 'To stamp your sprite on the stage:',
    des: 'Stamps a print of what your sprite currently looks like onto the stage.',
    vid: blockImageBase + 'stamp_gif.mp4'
}
let goTo = {
    block: blockImageBase + 'goTo.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To move your sprite on the stage:',
    des: 'Moves your sprite, given a point (X, Y). To move up, use a positive Y, down, use a negative Y. To move left, use a negative X, right, use a positive X.',
    vid: blockImageBase + 'goto_gif.mp4'
}
let translate = {
    block: blockImageBase + 'translate_width.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To slide your sprite on the stage:',
    des: 'Slides your sprite, based on its current location. To slide up or down, translate by height. To slide left or right, translate by width.',
    vid: blockImageBase + 'translate_gif.mp4'
}

let pointAt = {
    block: blockImageBase + 'pointatblock.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To rotate to a specific angle:',
    des: 'Rotates to a specific angle. You can use positive or negative angles.',
    vid: blockImageBase + 'point_at_gif.mp4'
}

let rotateBy = {
    block: blockImageBase + 'rotatebyxdegrees.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To rotate to a relative angle:',
    des: 'Rotates to a relative angle. So if you start at 45 degrees, you can rotate by another 45 degrees to be at 90. You can use positive or negative angles.',
    vid: blockImageBase + 'rotate_by_gif.mp4'
}

let switchCostume = {
    block: blockImageBase + 'switchcostume.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To switch what your sprite looks like (its costume):',
    des: 'Switch your sprite costume to another (either from the available costumes in the software, or via the costume library in the File menu).',
    vid: blockImageBase + 'switch_costume_gif.mp4'
}
let setColor = {
    block: blockImageBase + 'setcoloreffect.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To set the color of your costume:',
    des: 'Changes the color of your sprite. Color values are between 0 and 200. Think of ROYGBIV.',
    vid: blockImageBase + 'set_color_gif.mp4'
}
let setSize = {
    block: blockImageBase + 'size.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To set the size of your sprite:',
    des: 'Scales the size of your sprite based on the current original size of the costume.',
    vid: blockImageBase + 'change_size_gif.mp4'
}

let repeat = {
    block: blockImageBase + 'repeat.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To repeat repetitive code in your script:',
    des: 'Repeats anything that is inside of the block, however many times you want it to repeat.',
    vid: blockImageBase + 'repeat_gif.mp4'
}
let outStamp = {
    block: blockImageBase + 'outstamp.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To stamp outwards and return to original location:',
    des: 'Translates by a given radius, stamps, and translates back. Useful in radial designs.',
    vid: blockImageBase + 'outstamp_gif.mp4'
}

let playSound = {
    block: blockImageBase + 'playsound.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To play music with your project:',
    des: 'Plays music that is available in the software or in the sounds library (located in the File menu).',
    vid: blockImageBase + 'play_sound_gif.mp4'
}
let wait = {
    block: blockImageBase + 'wait.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To pause your script at a certain point:',
    des: 'Pauses the script for however many seconds you want it to pause for. Useful to time out certain actions.',
    vid: blockImageBase + 'wait_gif.mp4'
}
let pensize = {
    block: blockImageBase + 'pensize.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To change the thickness of drawn lines:',
    des: 'Changes the pen size (thickness) of your lines that you draw on the stage.',
    vid: blockImageBase + 'pensize_gif.mp4'
}
let pencolor = {
    block: blockImageBase + 'pencolor.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To change the color of drawn lines:',
    des: 'Changes the pen color of your lines that you draw on the stage.',
    vid: blockImageBase + 'pencolor_gif.mp4'
}
let line = {
    block: blockImageBase + 'line.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To draw a line at your current position:',
    des: 'Draws a line at your current position and rotation. (Can also be used to draw triangles by setting pen growth to something like 1)',
    vid: blockImageBase + 'line_gif.mp4'
}
let circle = {
    block: blockImageBase + 'circle.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To draw a circle at your current position:',
    des: 'Draws a circle at your current position and rotation. ',
    vid: blockImageBase + 'circle_gif.mp4'
}
let logspiral = {
    block: blockImageBase + 'logspiral.png',
    exp: blockImageBase + 'goTo_updown.gif',
    title: 'To draw a log spiral at your current position:',
    des: 'Draws a log spiral at your current position and rotation. (Note: will take a fair amount of trial and error to get the perfect spiral for your project)',
    vid: blockImageBase + 'logspiral_gif.mp4'
}

let placeholder = {
    block: blockImageBase + 'translate_height.png',
    exp: blockImageBase + 'translate_height.gif',
    title: 'Placeholder Title:',
    des: 'Placeholder description. (Will add rest of blocks later..)',
    vid: blockImageBase + 'rotate_by_gif.mp4'
}
