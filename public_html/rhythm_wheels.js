var constants = {
    sound_palette_id: 'sound_palette',
    sound_tile_class: 'sound_tile',
    wheels_container_id: 'wheels',
    wheel_container_class: 'wheel_container',
    wheel_class: 'wheel',
}

var globals = {
    dragging: null
}

function SoundPalette() {
    this.domelement = document.getElementById(constants.sound_palette_id);
    this.soundTiles = [];
}

SoundPalette.prototype.newSoundTile = function(opts) {
    var st = new SoundTile(opts);
    this.soundTiles.push(st);

    // required for equally spacing the wheels
    var spacer = document.createTextNode('\xa0');

    this.domelement.appendChild(st.domelement);
    this.domelement.appendChild(spacer);

    this.domelement.style.width = 60 * this.soundTiles.length + 'px';
}

function SoundTile(opts) {
    // use plain text for now
    // var sprite = document.createElement('img');
    var sprite = document.createElement('div');
    sprite.setAttribute('class', constants.sound_tile_class);
    // sprite.setAttribute('src', 'triangle.png');
    // use type straight from opts without any processing for now
    sprite.innerText = opts.type;
    this.type = opts.type;

    sprite.setAttribute('draggable', 'true');

    this.domelement = sprite;

    var _self = this;
    this.domelement.addEventListener('dragstart', function(event) {
        globals.dragging = _self;
    });
}

function WheelsContainer() {
    this.domelement = document.getElementById(constants.wheels_container_id);
    this.wheels = [];
}

WheelsContainer.prototype.newWheel = function() {
    var newWheel = new Wheel();
    this.wheels.push(newWheel);

    // required for equally spacing the wheels
    var spacer = document.createTextNode('\xa0');

    this.domelement.appendChild(newWheel.domelement);
    this.domelement.appendChild(spacer);
}

WheelsContainer.prototype.update = function() {
    for(var i = 0; i < this.wheels.length; i++) {
        this.wheels[i].update();
    }
}

id = 0;
function Node(opts) {
    this.id = id++;

    this.parent = opts.parent;

    this.radius = 100;
    this.rotation = 0;

    // Use text instead of images for now
    // var sprite = document.createElement('img');
    // sprite.setAttribute('src', 'triangle.png');
    var sprite = document.createElement('div');
    // Use type straight from opts without any processing for now
    sprite.innerText = opts.type;
    this.type = opts.type;

    sprite.style.width = '50px';
    sprite.style.position = 'absolute';

    this.domelement = sprite;

    var _self = this;
    this.domelement.addEventListener('drop', function(event) {
        _self.setType(globals.dragging.type);
    });
    this.domelement.addEventListener('dragover', function(event) {
        event.preventDefault();
    });
}

Node.prototype.setType = function(type) {
    this.type = type;
    this.domelement.innerText = type;
}

Node.prototype.update = function() {
    var parentRect = this.parent.domelement.getBoundingClientRect();
    var x = (parentRect.left + parentRect.right) / 2;
    var y = (parentRect.bottom + parentRect.top) / 2;

    this.domelement.style.left = x + 'px';
    this.domelement.style.top = y - this.radius + 'px';  

    this.domelement.style['transform-origin'] = '0 ' + this.radius + 'px';
    this.domelement.style['transform'] = 'rotate(' + this.rotation + 'rad)';
}

function Wheel(opts) {
    if(opts === undefined) opts = {};
    var node_count = opts.node_count !== undefined ? opts.node_count : 4;

    var wheel_container = document.createElement('div');
    wheel_container.setAttribute('class', constants.wheel_container_class);

    var wheel = document.createElement('div');
    wheel.setAttribute('class', constants.wheel_class);

    this.domelement = wheel_container;

    this.nodes = [];
    for(var i = 0; i < node_count; i++) {
        var node = new Node({parent: this, type: 'rest'});
        wheel.appendChild(node.domelement);
        this.nodes.push(node);
    }

    wheel_container.appendChild(wheel);

    this.rotation = 0;
}

Wheel.prototype.update = function() {
    for(var i = 0; i < this.nodes.length; i++) {
        this.nodes[i].rotation = this.rotation + Math.PI * 2 * i / this.nodes.length;
        this.nodes[i].update();
    }
}

// temporary structure for testing
;(function() {
    var sp = new SoundPalette();
    sp.newSoundTile({type: 'rest'});
    sp.newSoundTile({type: 'scratch1'});
    sp.newSoundTile({type: 'scratch2'});

    var wc = new WheelsContainer();

    wc.newWheel();
    wc.newWheel();
    wc.newWheel();

    wc.update();

    document.getElementsByTagName('body')[0].onresize = function() {
        console.log('hit');
        wc.update();
    };

    // (function anim() {
    //     wc.wheels[0].rotation += 0.1;
    //     wc.wheels[1].rotation += 0.1;
    //     wc.wheels[2].rotation += 0.1;
    //     wc.update();
    //     requestAnimationFrame(anim);
    // })();
})();