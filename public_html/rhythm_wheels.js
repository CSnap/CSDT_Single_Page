var constants = {
    wheels_container_id: 'wheels',
    wheel_container_class: 'wheel_container',
    wheel_class: 'wheel'
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

function Node(opts) {
    this.parent = opts.parent;

    this.radius = 100;
    this.rotation = 0;

    var sprite = document.createElement('img');
    sprite.setAttribute('src', 'triangle.png');
    sprite.style.width = '50px';
    sprite.style.position = 'absolute';

    this.domelement = sprite;
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
        var node = new Node({parent: this});
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
    var wc = new WheelsContainer();

    wc.newWheel();
    wc.newWheel();
    wc.newWheel();

    wc.update();

    document.getElementsByTagName('body')[0].onresize = function() {
        console.log('hit');
        wc.update();
    };

    (function anim() {
        wc.wheels[0].rotation += 0.1;
        wc.wheels[1].rotation += 0.1;
        wc.wheels[2].rotation += 0.1;
        wc.update();
        requestAnimationFrame(anim);
    })();
})();