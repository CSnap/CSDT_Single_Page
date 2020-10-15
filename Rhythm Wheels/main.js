/* eslint-disable */

let constants = {
    sound_palette_id: 'sound_palette',
    sound_tile_class: 'sound_tile',
    wheels_container_id: 'wheels',
    wheelContainer_class: 'wheel_container',
    wheel_class: 'wheel',
    loop_length_option_class: 'loop_length_option',
    num_wheels_id: 'num_wheels',
    sound_category_id: 'sound_category',
    play_button_id: 'play_button',
    stop_button_id: 'stop_button',
    tempo_slider_id: 'tempo',
    save_button_id: 'save',
    mp3_export_id: 'mp3show',
    title_input_id: 'project_title',
    save_local_button_id: 'save_local',
    projects_div_id: 'projects',
    login_button_id: 'login',
    username_id: 'login-logout',
    logout_button_id: 'logout',
    record_button_id: 'record',

    loginButton: '#login-logout',
    logoutButton: '#logout',
    loginToSaveButton: '#save-cloud-login',
    loginToLoadButton: '#load-cloud-login',
    saveToCloudButton: '#save-cloud',
    loginModal: '#loginModal',
    projectList: 'cloud-project',
    alertMessage: '#appAlert',
    alertMessageText: '#appAlert .modal-dialog .alert strong',
    userName: '#userName',
    userPass: '#userPass',
    loadModal: '#cloudLoading',
    saveModal: '#cloudSaving',
    projectName: '#project-name'
};

let flags = {
    dragging: null,
    playing: false,
    newProject: true,
    modifiedSinceLastSave: false,
    dragFromNode: false,
};

let libraries = {
    'HipPop': ['rest', 'scratch11', 'scratch12', 'scratch13', 'hup1',
        'clap1', 'tube1', 'bassdrum1', 'hihat1', 'bass-drum-reverb',
    ],
    'LatinoCarribean': ['rest', 'open1', 'tip1', 'slap1', 'heel1', 'neck1',
        'mouth1', 'clave1', 'maracas1', 'tamborine1', 'clap4', 'openhighconga4', 'congaslap',
    ],
    'Rock': ['rest', 'acousticbass1', 'acousticsnare1', 'electricsnare1',
        'lowfloortom1', 'openhighconga1', 'hihato1', 'splash1',
        'crash1', 'trap-cymbal-06',
    ],
    'Electro': ['electrocowbell1', 'electrotap1', 'electroclap1',
        'electrokick1', 'electrosnare1', 'hi-hat-reverb', 'snare-w-reverb3', 'trap-cymbal-03', 'lowelectronicconga',
    ],
};

let globals = {
    bpm: 120,
    projectName: 'Untitled',
    userID: -1,
    number_wheels: 1,
    userName: '',
    loadingText: '',
    mp3_text: '',
    record_button: '',
    recorded_audio: '',
    startTime: '',
    endTime: '',
    recordAudioDuration: 0,
};

let sounds = {};


let applicationID = 90;
let rwCloud = new Cloud();

/**
 * Contructs and manages the sound palette
 */
function SoundPalette() {
    // TODO - move where the div for sound palette id is to the upper portion of page
    this.domelement = document.getElementById(constants.sound_palette_id);
    this.soundTiles = [];
}

SoundPalette.prototype.newSoundTile = function (opts) {
    let st = new SoundTile(opts);
    // console.log(st);
    this.soundTiles.push(st);

    this.domelement.appendChild(st.domelement);
    // console.log(st.domelement);
};

SoundPalette.prototype.clearPalette = function () {
    this.soundTiles = [];
    this.domelement.innerHTML = '';
};

SoundPalette.prototype.loadLibrary = function (opts) {
    this.clearPalette();

    let _self = this;
    libraries[opts.library].forEach(function (type) {
        _self.newSoundTile({
            type: type,
        });
    });
};

/**
 * This whole constructor just build the domelement and binds them to
 * some member variables
 * SoundTiles are only in the sound the palette
 *  @param {Object} opts
 *  opts.type: type of Sound tile to create. Is the key
 *  in the catalog
 */
function SoundTile(opts) {
    let container = document.createElement('div');
    this.domelement = container;
    container.setAttribute('class', constants.sound_tile_class);

    let sprite = document.createElement('div');
    sprite.setAttribute('class', 'mx-auto');
    sprite.style['background-image'] = 'url(images/base.png)';
    sprite.style['width'] = '50px';
    sprite.style['height'] = '50px';

    sprite.style.color = 'white';
    sprite.style.textAlign = 'center';

    let img = document.createElement('img');
    img.setAttribute('src', sounds[opts.type].icon);
    img.style['position'] = 'relative';
    img.style['top'] = '10px';
    img.style['z-index'] = '0';

    sprite.appendChild(img);

    this.type = opts.type;

    let label = document.createTextNode(sounds[opts.type].name);
    // place in div sprite and name of sound in pallette
    container.appendChild(sprite);
    container.appendChild(label);

    this.tmpSprite = sprite.cloneNode(true);
    this.tmpSprite.style['position'] = 'absolute';
    this.tmpSprite.style['display'] = 'none';
    document.getElementsByTagName('body')[0].appendChild(this.tmpSprite);

    let _self = this;

    this.domelement.addEventListener('mousedown', function (event) {
        // When user clicks, sound plays
        let audioObj = new Audio(sounds[opts.type].url);
        audioObj.play();
        _self.tmpSprite.style['display'] = 'block';
        _self.tmpSprite.style['left'] = event.clientX - 25 + 'px';
        _self.tmpSprite.style['top'] = event.clientY - 25 + 'px';
        flags.dragging = _self;
        flags.dragFromNode = false;
        captureMouseEvents(event);
    });
}


/**
 * Constructs, manages, and contains all the wheels
 */
function WheelsContainer() {
    this.domelement =
        document.getElementById(constants.wheels_container_id);
    this.wheels = [];
    this.wheelCount = 1;
    this.spacers = [];
    this.rapW = new RecordedAudioContainer();
}

// Only used internally during initialization
WheelsContainer.prototype.newWheel = function () {
    let newWheel = new Wheel(this.wheels.length);
    this.wheels.push(newWheel);

    // required for equally spacing the wheels
    let spacer = document.createElement('span');
    spacer.innerText = '\xa0';
    this.spacers.push(spacer);

    this.domelement.appendChild(newWheel.domelement);
    this.domelement.appendChild(spacer);
};

WheelsContainer.prototype.setWheelCount = function (wheelCount) {
    this.wheelCount = wheelCount;

    // inactive wheels are just hidden

    for (let i = 0; i < wheelCount; i++) {
        this.wheels[i].domelement.style.display = 'inline-block';
        this.spacers[i].style.display = 'inline';
    }

    for (i = wheelCount; i < this.wheels.length; i++) {
        this.wheels[i].domelement.style.display = 'none';
        this.spacers[i].style.display = 'none';
    }

    this.domelement.style.width = 270 * wheelCount - 20 + 'px';
};

WheelsContainer.prototype.update = function () {
    // update the recorded audio Wheel
    this.rapW.update();

    for (let i = 0; i < this.wheels.length; i++) {
        this.wheels[i].update();
    }
};

/**
 * These are sound tiles on the wheel
 * Constructs and manages the sound tiles that are on the wheels
 * @param {*} opts
 *  opts.parent: the wheel that contains the node
 *  opts.type: type of sound tile to set this node to
 */
function Node(opts) {
    // NODE IS HOW WE REPRESENT WHEEL TILES
    this.parent = opts.parent;
    this.runOnce = '';
    this.radius = 100;
    this.rotation = 0;

    let sprite = document.createElement('div');
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

    let _self = this;

    this.domelement.addEventListener('mousedown', function (event) {
        flags.dragging = _self;
        flags.dragFromNode = true;
    });

    this.domelement.addEventListener('drop', function () {
        interrupt();
        _self.setType(flags.dragging.type);
        flags.dragging = null;
    });
    this.domelement.addEventListener('dragover', function (event) {
        event.preventDefault();
    });
}

//  Set the sound/sprite this node is associated with
Node.prototype.setType = function (type) {
    this.type = type;
    if (this.domelement.hasChildNodes()) {
        this.domelement.removeChild(this.domelement.lastChild);
    }

    let img = document.createElement('img');
    img.setAttribute('src', sounds[type].icon);
    img.style['position'] = 'relative';
    img.style['top'] = '10px';

    let _self = this;
    if (!flags.dragFromNode) {
        img.addEventListener('drop', function () {
            _self.domelement.dispatchEvent(new DragEvent('drop'));
        });
    }
    img.addEventListener('dragover', function () {
        _self.domelement.dispatchEvent(new DragEvent('dragover'));
    });
    this.domelement.appendChild(img);
};

// Used internally by wheel. Indicated that this node is playing
Node.prototype.setHighlighted = function (highlighted) {
    if (highlighted) {
        this.domelement.style['background-image'] =
            'url(images/base-inverted.png)';
    } else {
        this.domelement.style['background-image'] = 'url(images/base.png)';
    }
};

Node.prototype.update = function () {
    let parentRect = this.parent.domelement.getBoundingClientRect();
    let x = (parentRect.left + parentRect.right) / 2 + window.scrollX;
    let y = (parentRect.bottom + parentRect.top) / 2 + window.scrollY + 50;

    this.domelement.style.left = x + 'px';
    this.domelement.style.top = y - this.radius + 'px';

    this.domelement.style['transform-origin'] = '0 ' + this.radius + 'px';

    let offset = (10 * this.parent.nodeCount + 85);

    let scale = 1;
    if (this.parent.nodeCount > 8) {
        scale = 1 - (this.parent.nodeCount / 20) + 0.4;
    } else {
        scale = 1;
    }

    // translate to correct for offset
    this.domelement.style['transform'] = 'scale(' + scale + ') rotate(' +
        this.rotation + 'rad) translate(-25px, ' + offset + 'px)';
};

/**
 * Creates and manages the wheel. Contains and stores data about nodes as
 * well.
 * @param {*} opts
 *  opts.nodeCount: initial node count/loop length
 */
function Wheel(opts) {
    this.wheelNumber = opts;
    console.log(this.wheelNumber);
    this.currentNode = '';
    if (opts === undefined) opts = {};
    let nodeCount = opts.nodeCount !== undefined ? opts.nodeCount : 4;

    let wheelContainer = document.createElement('div');
    this.domelement = wheelContainer;
    wheelContainer.setAttribute('class', constants.wheelContainer_class);

    // create loop length control box

    let _self = this;
    let loopLengthDiv = document.createElement('div');
    let desc = document.createElement('p');
    desc.appendChild(document.createTextNode('Number of sounds: '));
    loopLengthDiv.appendChild(desc);
    loopLengthDiv.setAttribute('id', 'loopBox');
    let optDivs = [];
    for (let i = 1; i <= 16; i++) {
        let opt = document.createElement('span');
        opt.classList.add(constants.loop_length_option_class);
        opt.innerText = i;

        loopLengthDiv.appendChild(opt);
        optDivs.push(opt);

        // anonymous function makes sure the
        // value of j is separate from the iterator i
        (function (j) {
            opt.addEventListener('click', function () {
                interrupt();
                if (!loopLengthDiv.disabled) {
                    _self.setNodeCount(j);
                }
            });
        })(i);
    }
    optDivs[nodeCount - 1].classList.add('selected');

    wheelContainer.appendChild(loopLengthDiv);
    this.domelement.loopLengthControl = loopLengthDiv;
    this.domelement.loopLengthControl.optDivs = optDivs;

    //  create wheel

    let wheel = document.createElement('div');
    wheel.classList.add(constants.wheel_class);

    // circle outline
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style['position'] = 'relative';
    svg.setAttribute('width', 250);
    svg.setAttribute('height', 300);
    svg.innerHTML += '<circle' +
        'cx="125"' +
        'cy="150"' +
        'r="80"' +
        'stroke="#0038b9"' +
        'stroke-width="2"' +
        'fill="transparent"' +
        '/>';
    this.svg = svg;
    this.svg.circle = svg.lastChild;

    wheelContainer.appendChild(svg);

    // create nodes
    this.nodes = [];
    for (i = 0; i < 16; i++) {
        let node = new Node({
            parent: this,
            type: 'rest',
        });
        wheel.appendChild(node.domelement);
        this.nodes.push(node);
    }
    this.setNodeCount(nodeCount);

    wheelContainer.appendChild(wheel);

    // more controls
    let loopCountControlSpan = document.createElement('span');
    let loopCountControl = document.createElement('input');
    loopCountControl.style['width'] = '2em';
    loopCountControl.value = '1';
    loopCountControl.addEventListener('keypress', function (event) {
        if (!(event.charCode >= 48 && event.charCode <= 57)) {
            event.preventDefault();
            return false;
        }
    });
    loopCountControl.addEventListener('keyup', function () {
        interrupt();
        if (loopCountControl.value) {
            _self.loopCount = parseInt(loopCountControl.value);
        }
    });

    loopCountControlSpan.appendChild(document.createTextNode('Repeat: '));
    loopCountControlSpan.appendChild(loopCountControl);
    // loopCountControlSpan.appendChild(document.createTextNode(' time(s)'));
    wheelContainer.appendChild(loopCountControlSpan);

    this.domelement.loopCountControl = loopCountControl;

    this.rotation = 0;
    this.isPlaying = false;

    this.loopCount = 1;
}

Wheel.prototype.setNodeCount = function (nodeCount) {
    // hide nodes that are over the nodeCount
    // i.e. inactive nodes are merely hidden
    for (let i = 0; i < nodeCount; i++) {
        this.nodes[i].domelement.style.display = 'inline-block';
    }
    for (i = nodeCount; i < 16; i++) {
        this.nodes[i].domelement.style.display = 'none';
    }
    this.nodeCount = nodeCount;

    // adjust graphics
    let offset = (10 * nodeCount + 35);
    let scale = 1;
    if (nodeCount > 8) {
        scale = 1 - (nodeCount / 20) + 0.4;
    } else {
        scale = 1;
    }

    this.svg.circle.setAttribute('r', offset * scale);

    // update node count button grid
    for (let k = 0; k < 16; k++) {
        this.domelement
            .loopLengthControl.optDivs[k].classList.remove('selected');
    }
    this.domelement
        .loopLengthControl.optDivs[nodeCount - 1].classList.add('selected');

    this.update();
};

Wheel.prototype.setLoopCount = function (loopCount) {
    this.loopCount = loopCount;
    this.domelement.loopCountControl.value = loopCount;
};

Wheel.prototype.setPlaying = function (isPlaying) {
    this.isPlaying = isPlaying;
    this.rotation = 0;

    if (!isPlaying) {
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].setHighlighted(false);
        }
    }
};

Wheel.prototype.update = function () {
    // stop animation
    if (this.isPlaying) {
        this.rotation +=
            globals.bpm / 60.0 * (Math.PI * 2.0 / this.nodeCount) / 60;
        if (this.rotation >= this.loopCount * Math.PI * 2) {
            this.setPlaying(false);
            console.log('STOP PLAYING');
            rw.activeBuffers[this.wheelNumber].stop();
        }
    }

    // highlights current node

    if (this.isPlaying) {
        let currentPos = this.rotation / (Math.PI * 2) * this.nodeCount;
        this.nodes[Math.floor(currentPos) % this.nodeCount]
            .setHighlighted(currentPos - Math.floor(currentPos) < 0.7);
        currentNode = currentPos;
    };

    // updates notes
    for (let i = 0; i < this.nodeCount; i++) {
        this.nodes[i].rotation =
            this.rotation - Math.PI * 2 * i / this.nodeCount;
        this.nodes[i].update();
    }
};

function RecordedAudioContainer() {
    _self = this;
    this.domelement = document.getElementById('audioWheelContainer');
    let audioWheel = document.createElement('img');
    audioWheel.setAttribute('src', 'images/audiowheel2.png');
    audioWheel.style['width'] = '150px';
    audioWheel.style['height'] = '150px';

    audioWheel.setAttribute('id', 'testrotate');

    let audioWheelLoopSpan = document.createElement('span');
    let audioWheelLoopCount = document.createElement('input');
    audioWheelLoopCount.style['width'] = '2em';
    audioWheelLoopCount.value = '1';
    audioWheelLoopCount.addEventListener('keypress', function (event) {
        if (!(event.charCode >= 48 && event.charCode <= 57)) {
            event.preventDefault();
            return false;
        }
    });
    audioWheelLoopCount.addEventListener('keyup', function () {
        interrupt();
        if (audioWheelLoopCount.value) {
            _self.loopCount = parseInt(audioWheelLoopCount.value);
        }
    });
    audioWheelLoopSpan.appendChild(document.createTextNode('Repeat: '));
    audioWheelLoopSpan.appendChild(audioWheelLoopCount);
    this.domelement.appendChild(audioWheel);
    this.domelement.appendChild(audioWheelLoopSpan);
    _self.wheelImage = audioWheel;
    _self.loopCount = 1;
    _self.rotation = 0;
    _self.isPlaying = false;
    this.domelement.style.display = 'none';
}

/**
 * Creates and manages the custom audio recorder
 */
RecordedAudioContainer.prototype.update = function () {
    if (this.isPlaying) {
        // 2Pi divided by number of frames that will be rendered
        let addedRotation = (Math.PI * 2.0) / (60.0 * globals.recordAudioDuration);
        this.rotation += addedRotation;
        if (this.rotation > (this.loopCount * Math.PI * 2.0)) {
            this.isPlaying = false;
            this.rotation = 0;
        }
        this.wheelImage.style.transform = 'rotate(' + (this.rotation * 180 / Math.PI) + 'deg)';
    }
};

RecordedAudioContainer.prototype.stopRecordedAudio = function () {
    this.isPlaying = false;
    this.rotation = 0;
    this.wheelImage.style.transform = 'rotate(' + this.rotation + 'deg)';
};



function RhythmWheels() {
    this.init({
        sounds: catalog,
    });
}

RhythmWheels.prototype.init = function (options) {
    let myself = this;

    this.sp;
    this.ac;
    this.wc;
    // keep a list of active sounds so they can be aborted when stopped while
    // playing
    this.audioRec = '';
    this.audioChunks = [];
    this.recordedAudioArray = [];
    this.activeBuffers = [];
    this.exportBuffers = [];
    this.recordedBufferSource;
    this.recordedBufferSourceExport;
    this.maxTime;

    if (options === undefined) options = {}
    if (options.sounds !== undefined) sounds = options.sounds;
    let loginSuccess = function (data) {
        flags.loggedIn = true;
        myself.updateUserGUI();
        myself.getUserProjects();
        console.log(data);
    }
    let loginError = function (err) {
        flags.loggedIn = false;
        console.error(err);
    }
    rwCloud.checkCredentials(loginSuccess, loginError);
    this.sp = new SoundPalette();
    this.sp.loadLibrary({
        library: 'HipPop',
    });
    this.wc = new WheelsContainer();
    this.createWheelsDefault();
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.ac = new AudioContext();

    this.loadSounds();


    document.getElementById(constants.num_wheels_id)
    .addEventListener('change', function(event) {
      wc.setWheelCount(event.target.value);
      wc.update();
    });

    $('#' + constants.num_wheels_id).bind('change', function (e) {
        myself.wc.setWheelCount(event.target.value);
        myself.wc.update();
    });

    $('#' + constants.sound_category_id).bind('change', function (e) {
        myself.sp.loadLibrary({
            library: event.target.value,
        });
    });

    $('#' + constants.play_button_id).bind('click', function (e) {
        myself.interrupt();
        myself.play();
    });

    (function anim() {
        // Visual Event
        myself.wc.update();
        // if (flags.playing) {
        requestAnimationFrame(anim);
        // }
      })();
    // document.getElementById(constants.play_button_id)
    // .addEventListener('click', function() {
    //   interrupt();
    //   play();
    // });

}

RhythmWheels.prototype.createWheelsDefault = function () {


    // rapwheel = new RecordedAudioContainer();
    this.wc.newWheel();
    this.wc.newWheel();
    this.wc.newWheel();

    // programatically create default wheels
    this.wc.setWheelCount(2);
    this.wc.update();
    this.wc.wheels[0].setNodeCount(3);
    this.wc.wheels[0].nodes[0].setType('hihat1');
    this.wc.wheels[0].nodes[2].setType('hihat1');

    this.wc.wheels[1].nodes[0].setType('clave1');
    this.wc.wheels[1].nodes[1].setType('maracas1');
    this.wc.wheels[1].nodes[2].setType('maracas1');

    this.wc.wheels[0].setLoopCount(5);
    this.wc.wheels[1].setLoopCount(4);
}

RhythmWheels.prototype.loadSounds = function () {
    let myself = this;
    let loadSound = function (req, res) {
        let request = new XMLHttpRequest();
        request.open('GET', req.url, true);
        request.responseType = 'arraybuffer';
        request.onload = function () {
            let success = function (buffer) {
                res({
                    buffer: buffer,
                });
            };

            let error = function (err) {
                res(null, err);
            };

            myself.ac.decodeAudioData(request.response, success, error);
        };

        request.send();
    };

    let keys = Object.keys(sounds);
    for (let j = 0; j < keys.length; j++) {
        (function (i) {
            loadSound({
                url: sounds[keys[i]].url,
            }, function (res, err) {
                if (err) {
                    console.error('[!] Error loading sound: ' + keys[i]);
                    return;
                }
                // console.log('Loaded sound: ' + keys[i]);
                sounds[keys[i]].buffer = res.buffer;
            });
        })(j);
    }

};

RhythmWheels.prototype.updateUserGUI = function () {
    let base = (globals.userName == "" ? 'LOGIN' : (globals.userName).toUpperCase());
    let loginURL = (globals.userID != -1 ? '/users/' + globals.userID : '');

    //Updates the login button
    $(constants.loginButton).html("<i class='fas fa-user'></i>&nbsp; " + base);

    // Update login button functionality
    if (flags.loggedIn) {
        $(constants.loginButton).attr('href', loginURL);
        $(constants.loginButton).attr('data-toggle', '');
        $(constants.loginButton).attr('data-target', '');
    } else {
        $(constants.loginButton).removeAttr('href');
        $(constants.loginButton).attr('data-toggle', 'modal');
        $(constants.loginButton).attr('data-target', constants.loginModal);
    }

    // Updates the logout button
    $(constants.logoutButton).attr('hidden', !flags.loggedIn);

    // If the user is not logged in, this button appears to log the user in before saving to cloud
    $(constants.loginToSaveButton).attr('hidden', flags.loggedIn);
    $(constants.saveToCloudButton).attr('hidden', !flags.loggedIn);

    // If the user is not logged in, the projects are disabled and the login to load button appears
    $(constants.loginToLoadButton).attr('hidden', flags.loggedIn);
    $('#' + constants.projectList).attr('disabled', !flags.loggedIn);
    $(constants.logoutButton).on('click', function () {
        logout()
    });

};

RhythmWheels.prototype.getUserProjects = function () {
    let myself = this;
    let err = function (data) {
        // No projects are available for user
        updateUserProjects([]);
    };
    let suc = function (data) {
        // Update the list of projects
        let filteredData = [];

        try {
            filteredData = data.filter(d => d.application === applicationID);
            myself.updateUserProjects(filteredData);
        } catch (error) {
            console.error(error);
        }
    };
    console.log("Loading...");
    rwCloud.getProjectList(suc, err);
};

RhythmWheels.prototype.updateUserProjects = function (projects) {

    let projectListDiv = document.getElementById(constants.projectList);

    if (projects.length == 0) {
        projectListDiv.innerHTML = '<option selected>No projects are available...</option>';
    } else {
        projectListDiv.innerHTML = '';

        // projects will be sorted first here
        projects.forEach(function (project) {

            // if (project.application == applicationID) {
            let projectDiv = document.createElement('option');
            projectDiv.innerText = project.name
            projectListDiv.appendChild(projectDiv);

            projectDiv.value = project.id;
            if (projectDiv.value == globals.projectID) {
                let att = document.createAttribute("selected");
                projectDiv.setAttributeNode(att);
            }

            projectDiv.addEventListener('click', function (e) {
                loadFromCloud(project.id);
            });
            // }//

        });

        $('<option selected>Choose...</option>').prependTo($('#' + constants.projectList));
    }
};


RhythmWheels.prototype.interrupt = function () {
    if (flags.playing) stop();
    this.updateModifiedStatus(true);
}

RhythmWheels.prototype.updateModifiedStatus = function (bool) {
    flags.modifiedSinceLastSave = bool;

    $('#' + constants.save_button_id).attr('disabled', !(bool && flags.loggedIn));
}

RhythmWheels.prototype.compile = function (toExport) {
    let sequences = [];
    // reset maxTime every time you compile
    maxTime = 0;
    // Check # wheels, determine their sequence time (# beats in a wheel [loops*nodes] * seconds per node [60s / beats per minute])
    for (let i = 0; i < this.wc.wheelCount; i++) {
        let sequenceTime =
            this.wc.wheels[i].loopCount *
            this.wc.wheels[i].nodeCount *
            60.0 / globals.bpm;
        if (sequenceTime > maxTime) maxTime = sequenceTime;
        sequences.push([]);
        for (let k = 0; k < this.wc.wheels[i].loopCount; k++) {
            for (let j = 0; j < this.wc.wheels[i].nodeCount; j++) {
                sequences[i].push(this.wc.wheels[i].nodes[j].type);
            }
        }
        // fill out the audio buffer for each wheel
        this.bufferFill(sequences[i], sequenceTime, toExport);
    }
    return sequences;
}

// helper functions for filling buffer for playing audio, or buffer for exporting audio as mp3
RhythmWheels.prototype.bufferFill = function (sequenceIn, sequenceTimeIn, toExportIn) {
    // step 1 create WheelBuffer with createBuffer. Duration = sequenceTimeIn
    // step 2 for each sound in sequenceIn, create a soundBuffer which is length = seconds/perbeat, and has the sound loaded
    // step 3 append this soundBuffer to WheelBuffer
    // step 4 push WheelBuffer to activeBuffers

    // 48000 Hz is sample rate, 48000 * sequenceTimeIn is frames. Therefore, duration = sequenceTimeIn
    // step 1
    let secondsPerBeat = 60.0 / globals.bpm;
    if (sequenceTimeIn == 0) {
        // only add empty buffer if compiling to play
        if (!toExportIn) {
            // create an empty buffer that is not connected to output, dummy variable if rotations = 0
            let testPlay = this.ac.createBufferSource();
            this.activeBuffers.push(testPlay);
        }
        return;
    }
    let wheelBuffer = this.ac.createBuffer(1, 48000 * (sequenceTimeIn), 48000);
    // step 2
    for (let i = 0; i < sequenceIn.length; ++i) {
        let soundBuffer = this.ac.createBuffer(1, 48000 * secondsPerBeat, 48000);
        let name = sequenceIn[i];
        this.soundBuffer = sounds[name].buffer; // buffer with just the sound effect
        // step 3
        let setWheel = wheelBuffer.getChannelData(0);
        // fit sound effect into the amount of time for that beat
        let testSlice = soundBuffer.getChannelData(0).slice(0, 48000 * secondsPerBeat);
        setWheel.set(testSlice, i * 48000 * secondsPerBeat);
    }

    // step4
    let testPlay = this.ac.createBufferSource();
    testPlay.buffer = wheelBuffer;
    testPlay.connect(this.ac.destination);
    // compile from play() call
    if (!toExportIn) {
        this.activeBuffers.push(testPlay);
    } else {
        // compile from toExport() call
        this.exportBuffers.push(testPlay);
    }
};


// recorded audio compiling
RhythmWheels.prototype.recordedAudioBufferFill = function (repeatRecordingIn, toExportIn) {
    // first check if there is anything to play
    if (this.recordedAudioArray.length == 0 || repeatRecordingIn == 0) {
        if (!toExportIn) {
            recordedBufferSource = this.ac.createBufferSource();
        }
        return;
    }
    let recorededRawBuffer = this.recordedAudioArray[0].getChannelData(0);
    let recordWheelBuffer = this.ac.createBuffer(1, 48000 * (repeatRecordingIn * globals.recordAudioDuration), 48000);
    let setRecordWheel = recordWheelBuffer.getChannelData(0);
    for (let j = 0; j < repeatRecordingIn; ++j) {
        setRecordWheel.set(recorededRawBuffer, j * 48000 * globals.recordAudioDuration);
    }
    testPlay = this.ac.createBufferSource();
    testPlay.buffer = recordWheelBuffer;
    testPlay.connect(this.ac.destination);
    if (!toExportIn) {
        recordedBufferSource = testPlay;
    } else {
        recordedBufferSourceExport = testPlay;
    }
};


RhythmWheels.prototype.play = function () {
    recordedBufferSource = '';
    let sequences = '';
    let playPromise = new Promise((resolve, reject) => {
        sequences = this.compile();
        this.recordedAudioBufferFill(this.wc.rapW.loopCount, false);
        resolve(sequences);
    });
    playPromise.then((value) => {
        console.log(value);
        // iterate first through wheels, then iterate through nodes
        for (let i = 0; i < value.length; i++) {
            this.wc.wheels[i].setPlaying(true);
            // if playable sequences, play the audio buffer associated
            this.activeBuffers[i].start();
        }
        this.wc.rapW.isPlaying = true;
        recordedBufferSource.start(); // ONLY DO THIS IF PREVIOUSLY CALLED
        flags.playing = true;
    });
};


RhythmWheels.prototype.stop = function () {
    for (let i = 0; i < wc.wheels.length; i++) {
        this.wc.wheels[i].setPlaying(false);
    }
    flags.playing = false;
    this.activeBuffers.forEach(function (source) {
        source.stop();
    });
    this.wc.rapW.stopRecordedAudio();
    this.recordedBufferSource.stop();
    this.activeBuffers = [];
};

RhythmWheels.prototype.mp3Export = function () {
    /* 1. compile- put the wheels' audio into the activeBuffers array
    // 2. iterate through each of the activeBuffers, add to the 'output' buffer which will have the layered audio
       3. then encode the final array
    */
    // clear existing export buffers
    let projectName = document.getElementById(constants.title_input_id).value;
    recordedBufferSourceExport = '';
    exportBuffers = [];
    // compile audio data from rhythm wheels and recording
    compile(true);
    recordedAudioBufferFill(wc.rapW.loopCount, true);
    let recordedAudioMax = wc.rapW.loopCount * globals.recordAudioDuration;
    // first, check if there is any audio to export (will it be an empty mp3 file)
    if (maxTime == 0 && recordedAudioMax == 0) {
        // need to alert that user trying to export empty buffer
        globals.loadingText.id = 'loadinghide';
        globals.mp3_text.id = 'mp3show';
        window.alert('You are trying to export an empty audio file!');
        return;
    }
    let maxArrTime = maxTime > recordedAudioMax ? maxTime : recordedAudioMax;
    // Get the output buffer (which is an array of datas) with the right number of channels and size/duration
    let layeredAudio = ac.createBuffer(1, 48000 * (maxArrTime), 48000);
    for (let i = 0; i < exportBuffers.length; ++i) {
        let output = layeredAudio.getChannelData(0);
        let inputBuffer = exportBuffers[i].buffer.getChannelData(0);
        for (let bytes = 0; bytes < inputBuffer.length; ++bytes) {
            output[bytes] += inputBuffer[bytes];
        }
    }
    // overlay the recorded audio into output buffer for exporting if exists
    if (recordedAudioMax > 0) {
        let recordedAudioBytes = recordedBufferSourceExport.buffer.getChannelData(0);
        let output = layeredAudio.getChannelData(0);
        for (let recordedBytes = 0; recordedBytes < recordedAudioBytes.length; ++recordedBytes) {
            output[recordedBytes] += recordedAudioBytes[recordedBytes];
        }
    }
    encoder = new Mp3LameEncoder(48000, 128);
    let doubleArray = [layeredAudio.getChannelData(0), layeredAudio.getChannelData(0)];
    const promise1 = new Promise((resolve, reject) => {
        encoder.encode(doubleArray);
        resolve(encoder);
    });
    promise1.then((value) => {
            let newblob = encoder.finish();
            globals.loadingText.id = 'loadinghide';
            globals.mp3_text.id = 'mp3show';
            let blobURL = URL.createObjectURL(newblob);
            let link = document.createElement('a');
            link.href = blobURL;
            link.setAttribute('download', projectName);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch((error) => console.log(error));
};





let rw = new RhythmWheels();
// Global stuff