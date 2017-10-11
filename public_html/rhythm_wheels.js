var RhythmWheels = function() {
    var constants = {
        sound_palette_id: 'sound_palette',
        sound_tile_class: 'sound_tile',
        wheels_container_id: 'wheels',
        wheel_container_class: 'wheel_container',
        wheel_class: 'wheel',
        loop_length_option_class: 'loop_length_option'
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
        
        // temporary styling for visiblity
        sprite.style.background = 'black';
        sprite.style.color = 'white';

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

        // temporary styling for visiblity
        sprite.style.background = 'black';
        sprite.style.color = 'white';

        this.type = opts.type;

        sprite.style.width = '50px';
        sprite.style.textAlign = 'center';
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

        // translate to correct for offset
        this.domelement.style['transform'] = 'rotate(' + this.rotation + 'rad) translate(-25px, 0)';
    }

    function Wheel(opts) {
        if(opts === undefined) opts = {};
        var node_count = opts.node_count !== undefined ? opts.node_count : 4;

        var wheel_container = document.createElement('div');
        wheel_container.setAttribute('class', constants.wheel_container_class);

        // create loop length control box 

        var _self = this;
        var loopLengthDiv = document.createElement('div');
        var optDivs = [];
        for(var i = 1; i <= 16; i++) {
            var opt = document.createElement('span');
            opt.classList.add(constants.loop_length_option_class)
            opt.innerText = i;
            
            loopLengthDiv.appendChild(opt);
            optDivs.push(opt);

            // anonymous function makes sure the
            // value of j is separate from the iterator i
            (function(j) {
                opt.addEventListener('click', function () {
                    _self.setNodeCount(j);
                    for(var k = 0; k < 16; k++) {
                        optDivs[k].classList.remove('selected');
                    }
                    optDivs[j - 1].classList.add('selected');
                });
            })(i);
        }
        optDivs[node_count - 1].classList.add('selected');

        wheel_container.appendChild(loopLengthDiv);

        //  create wheel

        var wheel = document.createElement('div');
        wheel.classList.add(constants.wheel_class);

        this.domelement = wheel_container;

        // create nodes
        this.nodes = [];
        for(var i = 0; i < 16; i++) {
            var node = new Node({parent: this, type: 'rest'});
            wheel.appendChild(node.domelement);
            this.nodes.push(node);
        }
        this.setNodeCount(node_count);

        wheel_container.appendChild(wheel);

        this.rotation = 0;
    }

    Wheel.prototype.setNodeCount = function(nodeCount) {
        for(var i = 0; i < nodeCount; i++) {
            this.nodes[i].domelement.style.display = 'inline-block';
        }
        for(var i = nodeCount; i < 16; i++) {
            this.nodes[i].domelement.style.display = 'none';
        }
        this.nodeCount = nodeCount;

        this.update();
    }

    Wheel.prototype.update = function() {
        for(var i = 0; i < this.nodeCount; i++) {
            this.nodes[i].rotation = this.rotation + Math.PI * 2 * i / this.nodeCount;
            this.nodes[i].update();
        }
    }

    var sp;
    var wc;

    this.initialize = function() {
        sp = new SoundPalette();
        sp.newSoundTile({type: 'rest'});
        sp.newSoundTile({type: 'scratch1'});
        sp.newSoundTile({type: 'scratch2'});

        wc = new WheelsContainer();

        wc.newWheel();
        wc.newWheel();
        wc.newWheel();

        wc.update();

        document.getElementsByTagName('body')[0].onresize = function() {
            console.log('hit');
            wc.update();
        };
    }
}

// temporary structure for testing
;(function() {
    var rw = new RhythmWheels();
    rw.initialize();
    // (function anim() {
    //     wc.wheels[0].rotation += 0.1;
    //     wc.wheels[1].rotation += 0.1;
    //     wc.wheels[2].rotation += 0.1;
    //     wc.update();
    //     requestAnimationFrame(anim);
    // })();
})();