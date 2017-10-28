var RhythmWheels = function() {
    var constants = {
        sound_palette_id: 'sound_palette',
        sound_tile_class: 'sound_tile',
        wheels_container_id: 'wheels',
        wheel_container_class: 'wheel_container',
        wheel_class: 'wheel',
        loop_length_option_class: 'loop_length_option',
        num_wheels_id: 'num_wheels',
        play_button_id: 'play_button',
        stop_button_id: 'stop_button',
        tempo_slider_id: 'tempo'
    };

    var flags = {
        dragging: null
    };

    var sounds = {
        "rest"     : {name: "Rest",      url: "sounds/rest1.wav",     icon: "images/rest.png",     buffer: null},
        "scratch11": {name: "Scratch 1", url: "sounds/scratch11.wav", icon: "images/scratch1.png", buffer: null},
        "scratch12": {name: "Scratch 2", url: "sounds/scratch12.wav", icon: "images/scratch2.png", buffer: null},
        "scratch13": {name: "Scratch 3", url: "sounds/scratch13.wav", icon: "images/scratch3.png", buffer: null},
        "hup1"     : {name: "Hup",       url: "sounds/hup1.wav",      icon: "images/hup.png",      buffer: null},
        "clap1"    : {name: "Clap",      url: "sounds/clap1.wav",     icon: "images/clap.png",     buffer: null},
        "tube1"    : {name: "Tube",      url: "sounds/tube1.wav",     icon: "images/tube.png",     buffer: null},
        "bassdrum1": {name: "Bass Drum", url: "sounds/bassdrum1.wav", icon: "images/bassdrum.png", buffer: null},
        "hihat1"   : {name: "Hi Hat",    url: "sounds/hihat1.wav",    icon: "images/hihat.png",    buffer: null}
    };

    var globals = {
        bpm: 120
    }

    function SoundPalette() {
        this.domelement = document.getElementById(constants.sound_palette_id);
        this.soundTiles = [];
    }

    SoundPalette.prototype.newSoundTile = function(opts) {
        var st = new SoundTile(opts);
        this.soundTiles.push(st);

        this.domelement.appendChild(st.domelement);
    }

    function SoundTile(opts) {
        var container = document.createElement('div');
        container.setAttribute('class', constants.sound_tile_class);

        var sprite = document.createElement('div');
        sprite.style['background-image'] = 'url(images/base.png)';
        sprite.style['width'] = '50px';
        sprite.style['height'] = '50px';
        
        sprite.style.color = 'white';
        sprite.style.textAlign = 'center';

        var img = document.createElement('img');
        img.setAttribute('src', sounds[opts.type].icon);
        img.style['position'] = 'relative';
        img.style['top'] = '10px';

        sprite.appendChild(img);

        this.type = opts.type;

        var label = document.createTextNode(sounds[opts.type].name);
        container.appendChild(sprite);
        container.appendChild(label);

        this.domelement = container;

        this.tmpSprite = sprite.cloneNode(true);
        this.tmpSprite.style['position'] = 'absolute';
        this.tmpSprite.style['display'] = 'none';
        document.getElementsByTagName('body')[0].appendChild(this.tmpSprite);

        var _self = this;

        this.domelement.addEventListener('mousedown', function(event) {
            _self.tmpSprite.style['display'] = 'block';
            _self.tmpSprite.style['left'] = event.clientX - 25 + 'px';
            _self.tmpSprite.style['top'] = event.clientY - 25 + 'px';
            flags.dragging = _self;
            captureMouseEvents(event);
        })
    }

    function WheelsContainer() {
        this.domelement = document.getElementById(constants.wheels_container_id);
        this.wheels = [];
        this.wheelCount = 1;

        // keep track of spacers to hide them when not needed
        // and maintain layour
        this.spacers = [];
    }

    WheelsContainer.prototype.newWheel = function() {
        var newWheel = new Wheel();
        this.wheels.push(newWheel);

        // required for equally spacing the wheels
        var spacer = document.createElement('span');
        spacer.innerText = '\xa0';
        this.spacers.push(spacer);

        this.domelement.appendChild(newWheel.domelement);
        this.domelement.appendChild(spacer);
    }

    WheelsContainer.prototype.setWheelCount = function(wheelCount) {
        this.wheelCount = wheelCount;
        for(var i = 0; i < wheelCount; i++) {
            this.wheels[i].domelement.style.display = 'inline-block';
            this.spacers[i].style.display = 'inline';
        }
        for(var i = wheelCount; i < this.wheels.length; i++) {
            this.wheels[i].domelement.style.display = 'none';
            this.spacers[i].style.display = 'none';
        }

        this.domelement.style.width = 270 * wheelCount - 20 + 'px';
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

        var sprite = document.createElement('div');
        sprite.style['background-image'] = 'url(images/base.png)';
        sprite.style['width'] = '50px';
        sprite.style['height'] = '50px';
    
        sprite.style.color = 'white';
        sprite.style.textAlign = 'center';

        sprite.style.width = '50px';
        sprite.style.textAlign = 'center';
        sprite.style.position = 'absolute';

        this.domelement = sprite;

        this.setType(opts.type);

        var _self = this;

        this.domelement.addEventListener('drop', function(event) {
            _self.setType(flags.dragging.type);
            flags.dragging = null;
        });
        this.domelement.addEventListener('dragover', function(event) {
            event.preventDefault();
        });
    }

    Node.prototype.setType = function(type) {
        this.type = type;
        if(this.domelement.hasChildNodes()) this.domelement.removeChild(this.domelement.lastChild);

        var img = document.createElement('img');
        img.setAttribute('src', sounds[type].icon);
        img.style['position'] = 'relative';
        img.style['top'] = '10px';

        var _self = this;
        img.addEventListener('drop', function(event) {
            _self.domelement.dispatchEvent(new DragEvent('drop'));
        });

        img.addEventListener('dragover', function(event) {
            _self.domelement.dispatchEvent(new DragEvent('dragover'));
        })

        this.domelement.appendChild(img);
    }

    Node.prototype.setHighlighted = function(highlighted) {
        if(highlighted) {
            this.domelement.style['background-image'] = 'url(images/base-inverted.png)';
        } else {
            this.domelement.style['background-image'] = 'url(images/base.png)';
        }
    }

    Node.prototype.update = function() {
        var parentRect = this.parent.domelement.getBoundingClientRect();
        var x = (parentRect.left + parentRect.right) / 2;
        var y = (parentRect.bottom + parentRect.top) / 2;

        this.domelement.style.left = x + 'px';
        this.domelement.style.top = y - this.radius + 'px';  

        this.domelement.style['transform-origin'] = '0 ' + this.radius + 'px';

        var offset = (10 * this.parent.nodeCount + 85)
        if(this.parent.nodeCount > 8) {
            var scale = 1-(this.parent.nodeCount/20) + 0.4;
        } else {
            scale = 1;
        }

        // translate to correct for offset
        this.domelement.style['transform'] = 'scale(' + scale + ') rotate(' + this.rotation + 'rad) translate(-25px, ' + offset + 'px)';
    }

    function Wheel(opts) {
        if(opts === undefined) opts = {};
        var node_count = opts.node_count !== undefined ? opts.node_count : 4;

        var wheel_container = document.createElement('div');
        this.domelement = wheel_container;
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
                    if(!loopLengthDiv.disabled) {
                        _self.setNodeCount(j);
                        for(var k = 0; k < 16; k++) {
                            optDivs[k].classList.remove('selected');
                        }
                        optDivs[j - 1].classList.add('selected');
                    }
                });
            })(i);
        }
        optDivs[node_count - 1].classList.add('selected');

        wheel_container.appendChild(loopLengthDiv);
        this.domelement.loopLengthControl = loopLengthDiv;

        //  create wheel

        var wheel = document.createElement('div');
        wheel.classList.add(constants.wheel_class);

        // circle

        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.style['position'] = 'relative';
        svg.setAttribute('width', 250);
        svg.setAttribute('height', 300);

        svg.innerHTML += '<circle cx="125" cy="150" r="80" stroke="#0038b9" stroke-width="2" fill="transparent"/>'
        this.svg = svg;
        this.svg.circle = svg.lastChild;

        wheel_container.appendChild(svg);

        // create nodes
        this.nodes = [];
        for(var i = 0; i < 16; i++) {
            var node = new Node({parent: this, type: 'rest'});
            wheel.appendChild(node.domelement);
            this.nodes.push(node);
        }
        this.setNodeCount(node_count);

        wheel_container.appendChild(wheel);

        // more controls
        var loopCountControlSpan = document.createElement('span');
        var loopCountControl = document.createElement('input');
        loopCountControl.style['width'] = '2em'
        loopCountControl.value = '1';
        loopCountControl.addEventListener('keypress', function(event) {
            if(!(event.charCode >= 48 && event.charCode <= 57)) {
                event.preventDefault();
                return false;
            }
        });
        loopCountControl.addEventListener('keyup', function(event) {
            if(loopCountControl.value) _self.loopCount = parseInt(loopCountControl.value);
        })

        loopCountControlSpan.appendChild(document.createTextNode('Play '));
        loopCountControlSpan.appendChild(loopCountControl);
        loopCountControlSpan.appendChild(document.createTextNode(' time(s)'));
        wheel_container.appendChild(loopCountControlSpan);
        
        this.domelement.loopCountControl = loopCountControl;

        this.rotation = 0;
        this.isPlaying = false;

        this.loopCount = 1;
    }

    Wheel.prototype.setNodeCount = function(nodeCount) {
        // hide nodes that are over the nodeCount
        for(var i = 0; i < nodeCount; i++) {
            this.nodes[i].domelement.style.display = 'inline-block';
        }
        for(var i = nodeCount; i < 16; i++) {
            this.nodes[i].domelement.style.display = 'none';
        }
        this.nodeCount = nodeCount;

        // adjust graphics
        var offset = (10 * nodeCount + 35)
        if(nodeCount > 8) {
            var scale = 1-(nodeCount/20) + 0.4;
        } else {
            scale = 1;
        }

        this.svg.circle.setAttribute('r', offset * scale);

        this.update();
    }

    Wheel.prototype.setPlaying = function(isPlaying) {
        this.isPlaying = isPlaying;
        this.rotation = 0;

        if(!isPlaying) {
            for(var i = 0; i < this.nodes.length; i++) {
                this.nodes[i].setHighlighted(false);
            }
        }
    }

    Wheel.prototype.update = function() {
        // stop animation
        if(this.isPlaying) {
            this.rotation += globals.bpm / 60.0 * (Math.PI * 2.0 / this.nodeCount) / 60
            if(this.rotation >= this.loopCount * Math.PI * 2)
                this.setPlaying(false);
        }

        // highlights current node
        if(this.isPlaying) {
            var currentPos = this.rotation / (Math.PI * 2) * this.nodeCount;
            this.nodes[Math.floor(currentPos) % this.nodeCount].setHighlighted(currentPos - Math.floor(currentPos) < 0.7);
        }

        // updates notes
        for(var i = 0; i < this.nodeCount; i++) {
            this.nodes[i].rotation = this.rotation - Math.PI * 2 * i / this.nodeCount;
            this.nodes[i].update();
        }
    }

    var ac;

    var loadSounds = function() {
        var loadSound = function (req, res) {
            var request = new XMLHttpRequest();
            request.open('GET', req.url, true);
            request.responseType = 'arraybuffer';

            request.onload = function () {
                var success = function(buffer) {
                    res({buffer: buffer})
                };

                var error = function(err) { 
                    res(null, err);
                };

                ac.decodeAudioData(request.response, success, error);
            }

            request.send();
        }

        var keys = Object.keys(sounds);
        for(var j = 0; j < keys.length; j++) {
            (function(i) {
                loadSound({url: sounds[keys[i]].url}, function(res, err) {
                    if(err) {
                        console.error("[!] Error loading sound: " + keys[i]);
                        return;
                    }
                    console.log("Loaded sound: " + keys[i]);
                    sounds[keys[i]].buffer = res.buffer;
                });
            })(j);
        }
    }

    var sp;
    var wc;

    var lockControls = function() {
        document.getElementById(constants.tempo_slider_id).disabled=true;
        wc.wheels.forEach(function(wheel) {
            wheel.domelement.loopCountControl.disabled = true;
            wheel.domelement.loopLengthControl.disabled = true;
        })
    }

    var unlockControls = function() {
        document.getElementById(constants.tempo_slider_id).disabled=false;
        wc.wheels.forEach(function(wheel) {
            wheel.domelement.loopCountControl.disabled = false;
            wheel.domelement.loopLengthControl.disabled = false;
        })
    }

    var play = function(done) {
        var time = 0;
        var compile = function() {
            var sequences = [];
            for(var i = 0; i < wc.wheelCount; i++) {
                var sequenceTime = wc.wheels[i].loopCount * wc.wheels[i].nodeCount * 60.0 / globals.bpm;
                if(sequenceTime > time) time = sequenceTime;

                sequences.push([]);
                for(var k = 0; k < wc.wheels[i].loopCount; k++) {
                    for(var j = 0; j < wc.wheels[i].nodeCount; j++) {
                        sequences[i].push(wc.wheels[i].nodes[j].type);
                    }
                }
            }
            return sequences;
        }

        var playSound = function(name, delay) {
            var source = ac.createBufferSource(); 
            source.buffer = sounds[name].buffer;                    
            source.connect(ac.destination);   
            source.start(ac.currentTime + delay);
        }

        var sequences = compile();

        for(var i = 0; i < sequences.length; i++) {
            for(var j = 0; j < sequences[i].length; j++) {
                playSound(sequences[i][j], j * 60.0 / globals.bpm)
            }
            wc.wheels[i].setPlaying(true);
        }


        lockControls();
        setTimeout(function() {
            unlockControls();
        }, time * 1000);
    }

    var stop = function() {
        for(var i = 0; i < wc.wheels.length; i++) {
            wc.wheels[i].setPlaying(false);
        }
        unlockControls();
    }

    // from stackoverflow

    const EventListenerMode = {capture: true};
    
    function preventGlobalMouseEvents () {
      document.body.style['pointer-events'] = 'none';
    }
    
    function restoreGlobalMouseEvents () {
      document.body.style['pointer-events'] = 'auto';
    }
    
    function mousemoveListener (e) {
      e.stopPropagation ();

      flags.dragging.tmpSprite.style['left'] = e.clientX - 25 + 'px';
      flags.dragging.tmpSprite.style['top'] = e.clientY - 25 + 'px';
    }
    
    function mouseupListener (e) {
      restoreGlobalMouseEvents ();
      document.removeEventListener ('mouseup',   mouseupListener,   EventListenerMode);
      document.removeEventListener ('mousemove', mousemoveListener, EventListenerMode);
      e.stopPropagation ();

      flags.dragging.tmpSprite.style['display'] = 'none';
      
      document.elementFromPoint(e.clientX, e.clientY).dispatchEvent(new DragEvent("drop"));
    }
    
    function captureMouseEvents (e) {
      preventGlobalMouseEvents ();
      document.addEventListener ('mouseup',   mouseupListener,   EventListenerMode);
      document.addEventListener ('mousemove', mousemoveListener, EventListenerMode);
      e.preventDefault ();
      e.stopPropagation ();
    }

    //

    this.initialize = function() {
        sp = new SoundPalette();
        Object.keys(sounds).forEach(function(key) {
            sp.newSoundTile({type: key});
        });

        wc = new WheelsContainer();

        wc.newWheel();
        wc.newWheel();
        wc.newWheel();
        wc.setWheelCount(1);

        wc.update();
    
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        ac = new AudioContext();

        loadSounds();

        //  bind events
        document.getElementsByTagName('body')[0].onresize = function() {
            wc.update();
        };

        document.getElementById(constants.num_wheels_id).addEventListener('change', function(event) {
            wc.setWheelCount(event.target.value);
            wc.update();
        });

        document.getElementById(constants.play_button_id).addEventListener('click', function(event) {
            play();
        });

        document.getElementById(constants.stop_button_id).addEventListener('click', function(event) {
            stop();
        });

        document.getElementById(constants.tempo_slider_id).addEventListener('change', function(event) {
            globals.bpm = event.target.value;
        });

        (function anim() {
            wc.update();
            requestAnimationFrame(anim);
        })();
    }
}

// temporary structure for testing
;(function() {
    var rw = new RhythmWheels();
    rw.initialize();
})();