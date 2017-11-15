var RhythmWheels = function () {
    // List of HTML element names to make it easier to refactor
    var constants = {
        sound_palette_id: 'sound_palette',
        sound_tile_class: 'sound_tile',
        wheels_container_id: 'wheels',
        wheel_container_class: 'wheel_container',
        wheel_class: 'wheel',
        loop_length_option_class: 'loop_length_option',
        num_wheels_id: 'num_wheels',
        sound_category_id: 'sound_category',
        play_button_id: 'play_button',
        stop_button_id: 'stop_button',
        tempo_slider_id: 'tempo',
        save_button_id: 'save'
    };

    var flags = {
        dragging: null,
        playing: false
    };

    var sounds = {
        'bassdrum1': {name: 'Bass Drum', url: 'sounds/bassdrum1.wav', icon: 'images/bassdrum.png', buffer: null},
        'clap1'    : {name: 'Clap',      url: 'sounds/clap1.wav',     icon: 'images/clap.png',     buffer: null},
        'hihat1'   : {name: 'Hi Hat',    url: 'sounds/hihat1.wav',    icon: 'images/hihat.png',    buffer: null},
        'hup1'     : {name: 'Hup',       url: 'sounds/hup1.wav',      icon: 'images/hup.png',      buffer: null},
        'rest'     : {name: 'Rest',      url: 'sounds/rest1.wav',     icon: 'images/rest.png',     buffer: null},
        'scratch11': {name: 'Scratch 1', url: 'sounds/scratch11.wav', icon: 'images/scratch1.png', buffer: null},
        'scratch12': {name: 'Scratch 2', url: 'sounds/scratch12.wav', icon: 'images/scratch2.png', buffer: null},
        'scratch13': {name: 'Scratch 3', url: 'sounds/scratch13.wav', icon: 'images/scratch3.png', buffer: null},
        'tube1'    : {name: 'Tube',      url: 'sounds/tube1.wav',     icon: 'images/tube.png',     buffer: null}
    };

    var libraries = {
        'HipPop' : ['rest', 'scratch11', 'scratch12', 'scratch13', 'hup1', 'clap1', 'tube1', 'bassdrum1', 'hihat1'],
        'LatinoCarribean': ['rest', 'open1', 'tip1', 'slap1', 'heel1', 'neck1', 'mouth1', 'clave1', 'maracas1', 'tamborine1'],
        'Rock': ['rest', 'acousticbass1', 'acousticsnare1', 'electricsnare1', 'lowfloortom1', 'openhighconga1', 'hihato1', 'splash1', 'crash1'],
        'Electro': ['electrocowbell1', 'electrotap1', 'electroclap1', 'electrokick1', 'electrosnare1']
    };

    var globals = {
        bpm: 120
    };

    function SoundPalette() {
        this.domelement = document.getElementById(constants.sound_palette_id);
        this.soundTiles = [];
    }

    SoundPalette.prototype.newSoundTile = function(opts) {
        var st = new SoundTile(opts);
        this.soundTiles.push(st);

        this.domelement.appendChild(st.domelement);
    };

    SoundPalette.prototype.clearPalette = function() {
        this.soundTiles = [];
        this.domelement.innerHTML = '';
    };

    SoundPalette.prototype.loadLibrary = function(opts) {
        this.clearPalette();
        
        var _self = this;
        libraries[opts.library].forEach(function(type) {
            _self.newSoundTile({type: type});
        });
    };

    // - This whole constructor just build the domelement and binds them to some member variables
    // - SoundTiles are only in the sound the palette
    function SoundTile(opts) {
        var container = document.createElement('div');
        this.domelement = container;
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
        });
    }

    function WheelsContainer() {
        this.domelement = document.getElementById(constants.wheels_container_id);
        this.wheels = [];
        this.wheelCount = 1;

        // keep track of spacers to hide them when not needed
        // and maintain layout
        this.spacers = [];
    }

    // Only used internally during initialization
    WheelsContainer.prototype.newWheel = function() {
        var newWheel = new Wheel();
        this.wheels.push(newWheel);

        // required for equally spacing the wheels
        var spacer = document.createElement('span');
        spacer.innerText = '\xa0';
        this.spacers.push(spacer);

        this.domelement.appendChild(newWheel.domelement);
        this.domelement.appendChild(spacer);
    };

    WheelsContainer.prototype.setWheelCount = function(wheelCount) {
        this.wheelCount = wheelCount;

        // inactive wheels are just hidden

        for(var i = 0; i < wheelCount; i++) {
            this.wheels[i].domelement.style.display = 'inline-block';
            this.spacers[i].style.display = 'inline';
        }

        for(i = wheelCount; i < this.wheels.length; i++) {
            this.wheels[i].domelement.style.display = 'none';
            this.spacers[i].style.display = 'none';
        }

        this.domelement.style.width = 270 * wheelCount - 20 + 'px';
    };

    WheelsContainer.prototype.update = function() {
        for(var i = 0; i < this.wheels.length; i++) {
            this.wheels[i].update();
        }
    };

    //  These are sound tiles on the wheel
    function Node(opts) {
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

        this.domelement.addEventListener('drop', function() {
            interrupt();
            _self.setType(flags.dragging.type);
            flags.dragging = null;
        });
        this.domelement.addEventListener('dragover', function(event) {
            event.preventDefault();
        });
    }

    //  Set the sound/sprite this node is associated with
    Node.prototype.setType = function(type) {
        this.type = type;
        if(this.domelement.hasChildNodes()) this.domelement.removeChild(this.domelement.lastChild);

        var img = document.createElement('img');
        img.setAttribute('src', sounds[type].icon);
        img.style['position'] = 'relative';
        img.style['top'] = '10px';

        var _self = this;
        img.addEventListener('drop', function() {
            _self.domelement.dispatchEvent(new DragEvent('drop'));
        });

        img.addEventListener('dragover', function() {
            _self.domelement.dispatchEvent(new DragEvent('dragover'));
        });

        this.domelement.appendChild(img);
    };

    // Used internally by wheel. Indicated that this node is playing
    Node.prototype.setHighlighted = function(highlighted) {
        if(highlighted) {
            this.domelement.style['background-image'] = 'url(images/base-inverted.png)';
        } else {
            this.domelement.style['background-image'] = 'url(images/base.png)';
        }
    };

    Node.prototype.update = function() {
        var parentRect = this.parent.domelement.getBoundingClientRect();
        var x = (parentRect.left + parentRect.right) / 2 + window.scrollX;
        var y = (parentRect.bottom + parentRect.top) / 2 + window.scrollY;

        this.domelement.style.left = x + 'px';
        this.domelement.style.top = y - this.radius + 'px';  

        this.domelement.style['transform-origin'] = '0 ' + this.radius + 'px';

        var offset = (10 * this.parent.nodeCount + 85);
        if(this.parent.nodeCount > 8) {
            var scale = 1-(this.parent.nodeCount/20) + 0.4;
        } else {
            scale = 1;
        }

        // translate to correct for offset
        this.domelement.style['transform'] = 'scale(' + scale + ') rotate(' + this.rotation + 'rad) translate(-25px, ' + offset + 'px)';
    };

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
            opt.classList.add(constants.loop_length_option_class);
            opt.innerText = i;
            
            loopLengthDiv.appendChild(opt);
            optDivs.push(opt);

            // anonymous function makes sure the
            // value of j is separate from the iterator i
            (function(j) {
                opt.addEventListener('click', function () {
                    interrupt();
                    if(!loopLengthDiv.disabled) {
                        _self.setNodeCount(j);
                    }
                });
            })(i);
        }
        optDivs[node_count - 1].classList.add('selected');

        wheel_container.appendChild(loopLengthDiv);
        this.domelement.loopLengthControl = loopLengthDiv;
        this.domelement.loopLengthControl.optDivs = optDivs;

        //  create wheel

        var wheel = document.createElement('div');
        wheel.classList.add(constants.wheel_class);

        // circle outline
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style['position'] = 'relative';
        svg.setAttribute('width', 250);
        svg.setAttribute('height', 300);

        svg.innerHTML += '<circle cx="125" cy="150" r="80" stroke="#0038b9" stroke-width="2" fill="transparent"/>';
        this.svg = svg;
        this.svg.circle = svg.lastChild;

        wheel_container.appendChild(svg);

        // create nodes
        this.nodes = [];
        for(i = 0; i < 16; i++) {
            var node = new Node({parent: this, type: 'rest'});
            wheel.appendChild(node.domelement);
            this.nodes.push(node);
        }
        this.setNodeCount(node_count);

        wheel_container.appendChild(wheel);

        // more controls
        var loopCountControlSpan = document.createElement('span');
        var loopCountControl = document.createElement('input');
        loopCountControl.style['width'] = '2em';
        loopCountControl.value = '1';
        loopCountControl.addEventListener('keypress', function(event) {
            if(!(event.charCode >= 48 && event.charCode <= 57)) {
                event.preventDefault();
                return false;
            }
        });
        loopCountControl.addEventListener('keyup', function() {
            interrupt();
            if(loopCountControl.value) _self.loopCount = parseInt(loopCountControl.value);
        });

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
        // i.e. inactive nodes are merely hidden
        for(var i = 0; i < nodeCount; i++) {
            this.nodes[i].domelement.style.display = 'inline-block';
        }
        for(i = nodeCount; i < 16; i++) {
            this.nodes[i].domelement.style.display = 'none';
        }
        this.nodeCount = nodeCount;

        // adjust graphics
        var offset = (10 * nodeCount + 35);
        if(nodeCount > 8) {
            var scale = 1-(nodeCount/20) + 0.4;
        } else {
            scale = 1;
        }

        this.svg.circle.setAttribute('r', offset * scale);
                        
        // update node count button grid
        for(var k = 0; k < 16; k++) {
            this.domelement.loopLengthControl.optDivs[k].classList.remove('selected');
        }
        this.domelement.loopLengthControl.optDivs[nodeCount - 1].classList.add('selected');

        this.update();
    };

    Wheel.prototype.setLoopCount = function(loopCount) {
        this.loopCount = loopCount;
        this.domelement.loopCountControl.value = loopCount;
    };

    Wheel.prototype.setPlaying = function(isPlaying) {
        this.isPlaying = isPlaying;
        this.rotation = 0;

        if(!isPlaying) {
            for(var i = 0; i < this.nodes.length; i++) {
                this.nodes[i].setHighlighted(false);
            }
        }
    };

    Wheel.prototype.update = function() {
        // stop animation
        if(this.isPlaying) {
            this.rotation += globals.bpm / 60.0 * (Math.PI * 2.0 / this.nodeCount) / 60;
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
    };

    // helper functions and variables

    var ac; // Initialized as AudioContext in init
    var sp; // initialized as SoundPalette in init
    var wc; // initialized as WheelContainer in init

    var loadSounds = function() {
        var loadSound = function (req, res) {
            var request = new XMLHttpRequest();
            request.open('GET', req.url, true);
            request.responseType = 'arraybuffer';

            request.onload = function () {
                var success = function(buffer) {
                    res({buffer: buffer});
                };

                var error = function(err) { 
                    res(null, err);
                };

                ac.decodeAudioData(request.response, success, error);
            };

            request.send();
        };

        var keys = Object.keys(sounds);
        for(var j = 0; j < keys.length; j++) {
            (function(i) {
                loadSound({url: sounds[keys[i]].url}, function(res, err) {
                    if(err) {
                        console.error('[!] Error loading sound: ' + keys[i]);
                        return;
                    }
                    console.log('Loaded sound: ' + keys[i]);
                    sounds[keys[i]].buffer = res.buffer;
                });
            })(j);
        }
    };

    var interrupt = function() {
        if(flags.playing) stop();
    };

    // keep a list of active sounds so they can be aborted when stopped while playing
    var activeBuffers = [];

    var play = function() {
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
        };

        // plays a single sound
        var playSound = function(name, delay) {
            var source = ac.createBufferSource(); 
            source.buffer = sounds[name].buffer;                    
            source.connect(ac.destination);   
            source.start(ac.currentTime + delay);
            activeBuffers.push(source);
        };

        var sequences = compile();

        for(var i = 0; i < sequences.length; i++) {
            for(var j = 0; j < sequences[i].length; j++) {
                playSound(sequences[i][j], j * 60.0 / globals.bpm);
            }
            wc.wheels[i].setPlaying(true);
        }

        flags.playing = true;
    };

    var stop = function() {
        for(var i = 0; i < wc.wheels.length; i++) {
            wc.wheels[i].setPlaying(false);
        }
        flags.playing = false;

        activeBuffers.forEach(function(source) {
            source.stop();
        });
        activeBuffers = [];
    };

    // generates and downloads string
    var save = function() {
        var output = 'rw v0.0.1\n';
        output += 'tempo:' + globals.bpm + '\n'; 
        output += 'wheels:' + wc.wheelCount + '\n';
        for(var i = 0; i < wc.wheelCount; i++) {
            output += 'wheel' + i + ':\n';
            output += '  size:' + wc.wheels[i].nodeCount + '\n';
            output += '  loop:' + wc.wheels[i].loopCount + '\n';
            output += '  nodes:\n';
            for(var j = 0; j < wc.wheels[i].nodeCount; j++) {
                output += '    ' + wc.wheels[i].nodes[j].type + '\n';
            }
        }
        download('save.rw', output);
    };

    // loads a rythm wheels instance from text
    var load = function(opts) {
        interrupt();

        if(opts === undefined) return alert('Could not parse: Undefined parameter');
        if(opts.text === undefined) return alert('Could not parse: Empty string');
        
        var lines = opts.text.split('\n');
        
        if(lines[0] != 'rw v0.0.1') return alert('Could not parse: Invalid format');

        var stack = [];
        lines.forEach(function(line) {
            var lr = line.split(':');
            var lhs = lr[0].trim();
            var rhs = lr[1];
            
            if (stack[stack.length - 1] == 'nodes') {
                if(stack[stack.length - 2] == wc.wheels[stack[stack.length - 4]].nodeCount) {
                    stack.pop();
                    stack.pop();
                } else {
                    wc.wheels[stack[stack.length - 4]].nodes[stack[stack.length - 2]].setType(line.trim());
                    stack[stack.length - 2]++;
                }
            }

            if (stack[stack.length - 1] == 'wheel') {
                switch(lhs) {
                case 'size':
                    wc.wheels[stack[stack.length - 2]].setNodeCount(parseInt(rhs));
                    break;
                case 'loop':
                    wc.wheels[stack[stack.length - 2]].setLoopCount(parseInt(rhs));
                    break;
                case 'nodes':
                    stack.push(0);
                    stack.push('nodes');
                    break;
                default:
                    stack.pop();
                    stack.pop();
                    break;
                }
            }

            if(stack.length == 0) {
                switch(lhs) {
                case 'tempo':
                    globals.bpm = parseFloat(rhs);
                    document.getElementById(constants.tempo_slider_id).value = Math.log10(globals.bpm / 120);
                    break;
                case 'wheels':
                    wc.setWheelCount(parseInt(rhs));
                    document.getElementById(constants.num_wheels_id).value = parseInt(rhs);
                    break;
                
                case 'wheel0':
                    stack.push(0);
                    stack.push('wheel');
                    break;
                case 'wheel1':
                    stack.push(1);
                    stack.push('wheel');
                    break;
                case 'wheel2':
                    stack.push(2);
                    stack.push('wheel');
                    break;

                default:
                    return alert('Could not parse: Unknown parameter "' + lhs + '"');
                }
            } 
        });
    };

    // modified from stackoverflow - used to load files
    function readSingleFile(e) {
        var file = e.target.files[0];
        if (!file) {
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            var contents = e.target.result;
            load({text: contents});
            
        };
        reader.readAsText(file);
    }

    // modified from stackoverflow - essential for fixing the cursor while dragging

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
      
        document.elementFromPoint(e.clientX, e.clientY).dispatchEvent(new DragEvent('drop'));
    }
    
    function captureMouseEvents (e) {
        preventGlobalMouseEvents ();
        document.addEventListener ('mouseup',   mouseupListener,   EventListenerMode);
        document.addEventListener ('mousemove', mousemoveListener, EventListenerMode);
        e.preventDefault ();
        e.stopPropagation ();
    }

    // from stackoverflow - for saving

    function download(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
      
        element.style.display = 'none';
        document.body.appendChild(element);
      
        element.click();
      
        document.body.removeChild(element);
    }

    //

    this.initialize = function(opts) {
        if(opts === undefined) opts = {};
        if(opts.sounds !== undefined) sounds = opts.sounds;

        sp = new SoundPalette();
        sp.loadLibrary({library: 'HipPop'});

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
        document.body.onresize = function() {
            wc.update();
        };

        document.body.onscroll = function() {
            wc.update();
        };

        document.getElementById(constants.num_wheels_id).addEventListener('change', function(event) {
            wc.setWheelCount(event.target.value);
            wc.update();
        });

        document.getElementById(constants.sound_category_id).addEventListener('change', function(event) {
            sp.loadLibrary({library: event.target.value});
        });

        document.getElementById(constants.play_button_id).addEventListener('click', function() {
            interrupt();
            play();
        });

        document.getElementById(constants.stop_button_id).addEventListener('click', function() {
            stop();
        });

        document.getElementById(constants.save_button_id).addEventListener('click', function() {
            save();
        });

        document.getElementById(constants.tempo_slider_id).addEventListener('change', function(event) {
            interrupt();
            globals.bpm = 120 * Math.pow(10, event.target.value);
        });

        document.getElementById('load').addEventListener('change', readSingleFile, false);

        (function anim() {
            wc.update();
            requestAnimationFrame(anim);
        })();
    };
};

var rw;

// temporary structure for testing
(function() {
    rw = new RhythmWheels();
    rw.initialize({sounds: catalog});
})();