/* eslint-disable */
/* eslint-disable padded-blocks */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable prefer-let */
/* eslint-disable space-before-function-parent*/

// Application ID attached to Rhythm Wheels
window.csdtCloud;
let applicationID = 90;

let rw;
let saveObject;
const EventListenerMode = {
  capture: true,
};

//Set up the apps audio context
window.AudioContext = window.AudioContext || window.webkitAudioContext;
let superAudioContext = new AudioContext();

// Customize the sound palette and libraries
let libraries = {
  HipHop: [
    "rest",
    "scratch11",
    "scratch12",
    "scratch13",
    "hup1",
    "clap1",
    "tube1",
    "bassdrum1",
    "hihat1",
    "bass-drum-reverb",
  ],
  LatinoCaribbean: [
    "open1",
    "tip1",
    "slap1",
    "heel1",
    "neck1",
    "mouth1",
    "clave1",
    "maracas1",
    "tamborine1",
    "clap4",
    "openhighconga4",
    "congaslap",
  ],
  Rock: [
    "rest",
    "acousticbass1",
    "acousticsnare1",
    "electricsnare1",
    "lowfloortom1",
    "openhighconga1",
    "hihato1",
    "splash1",
    "crash1",
    "trap-cymbal-06",
  ],
  Electro: [
    "electrocowbell1",
    "electrotap1",
    "electroclap1",
    "electrokick1",
    "electrosnare1",
    "hi-hat-reverb",
    "snare-w-reverb3",
    "trap-cymbal-03",
    "lowelectronicconga",
  ],
  TypeBeats: [
    "orchestra-hit",
    "afghanistan-rabab",
    "ambition-string",
    "cali-wah-guitar",
    "low-sway-futuristic",
    "moonlit-bass",
    "night-funk",
  ],
};
let defaultSoundPalette = {
  library: "HipHop",
};
let sounds = {};

// Customize the wheels
const MAX_NUM_OF_BEATS = 16;
const TOTAL_WHEEL_COUNT = 3;

let defaultWheels = {
  wheel1: {
    nodes: ["hihat1", "rest", "hihat1"],
    repeat: 5,
  },
  wheel2: {
    nodes: ["clave1", "maracas1", "maracas1", "rest"],
    repeat: 4,
  },
};

// Classes, Ids, etc for GUI Manuplication
let appReferences = {
  soundCategorySelect: "sound_category",

  soundPalette: "sound_palette",
  soundTile: "sound_tile",

  wheelControlsContainer: "wheelControls",
  wheelControlsClass: ".control-div",
  wheelsContainer: "wheels",
  individualWheelContainer: "wheel_container",
  individualWheel: "wheel",

  recordingWheelContainer: "audioWheelContainer",
  recordingWheel: "recording-wheel",
  recordingWheelSprite: "testrotate",

  numOfWheels: "num_wheels",
  numOfBeatOption: "loop_length_option",
  numOfRepeatInput: "wheel_repeat_input",
  tempoSlider: "tempo",

  playButton: "play_button",
  stopButton: "stop_button",

  mp3ExportButton: "downloadMP3",
  mp3ExportIcon: "fa-download",
  recordButton: "record",
  stopRecordButton: "recordStop",
  recordedAudio: "recordedAudio",
  closeRecordingPrompt: "close-recording",
  recordCountdown: "countdown",

  recordPrompt: "recordModal",
};

// List of HTML element names to make it easier to refactor
let flags = {
  dragging: null,
  playing: false,
  dragFromNode: false,
};

// Project specific values and globals
let rhythmWheelGlobals = {
  bpm: 120,
  startTime: "",
  endTime: "",
  recordAudioDuration: 0,
  incomingAudio: "",
  outgoingAudio: "",
};
globals = {
  ...globals,
  ...rhythmWheelGlobals,
};

// modified from stackoverflow - essential for fixing the cursor while
// dragging
// Useful functions
function captureMouseEvents(e) {
  preventGlobalMouseEvents();
  document.addEventListener("mouseup", mouseupListener, EventListenerMode);
  document.addEventListener("mousemove", mousemoveListener, EventListenerMode);
  e.preventDefault();
  e.stopPropagation();
}

function preventGlobalMouseEvents() {
  document.body.style["pointer-events"] = "none";
}

function restoreGlobalMouseEvents() {
  document.body.style["pointer-events"] = "auto";
}

function mousemoveListener(e) {
  e.stopPropagation();

  // flags.dragging.draggableSoundTileBase.style["left"] = e.clientX - 25 + "px";
  // flags.dragging.draggableSoundTileBase.style["top"] = e.clientY - 25 + "px";

  flags.dragging.setTileBeingDragged(e, true);
}

function mouseupListener(e) {
  restoreGlobalMouseEvents();
  document.removeEventListener("mouseup", mouseupListener, EventListenerMode);
  document.removeEventListener(
    "mousemove",
    mousemoveListener,
    EventListenerMode
  );
  e.stopPropagation();

  // flags.dragging.draggableSoundTileBase.style["display"] = "none";
  flags.dragging.setTileBeingDragged(e, false);

  document
    .elementFromPoint(e.clientX, e.clientY)
    .dispatchEvent(new DragEvent("drop"));
}

function loadRWFile(opts) {
  rw.stopRhythm();

  globals.outgoingAudio = "";

  parser.parse(JSON.parse(opts));

  document.getElementById(appReferences.tempoSlider).value = Math.log10(
    globals.bpm / 120
  );

  document.querySelector(
    `#${appReferences.numOfWheels} [value="` +
      rw.wheelsContainer.wheelCount +
      '"]'
  ).selected = true;

  if (globals.outgoingAudio != "") {
    let audioResult = dataURItoBlob(globals.outgoingAudio);
    rw.rapWheel.processSavedAudio(audioResult);
  } else {
    rw.rapWheel.processSavedAudio("");
  }
}

function initApplication() {
  csdtCloud = new Cloud(applicationID);
  rw = new RhythmWheels({
    sounds: catalog,
  });
}

/**
 * Cloud Connections and overrides
 */

$(`#${cloudUI.signInSubmit}`).on("click", () => {
  csdtCloud.submitSignInRequest();
});

$(`#${cloudUI.signInPrompt}`).on("keydown", function (e) {
  var key = e.which || e.keyCode;
  if (key == 13) {
    csdtCloud.submitSignInRequest();
  }
});

$(`#${cloudUI.signOutSubmit}`).on("click", () => {
  csdtCloud.submitSignOutRequest();
});

$(`#${cloudUI.loadLocalProject}`).on("change", (e) => {
  readSingleFile(e, loadRWFile);
  // csdtCloud.loadFromCloud($(`#${cloudUI.loadProjectList}`).val(), loadRWFile);
});

$(`#${cloudUI.loadProjectSubmit}`).on("click", () => {
  csdtCloud.loadFromCloud($(`#${cloudUI.loadProjectList}`).val(), loadRWFile);
});

$(`#${cloudUI.saveProjectSubmit}`).on("click", () => {
  csdtCloud.setNewProjectStatus(true);
  rw.generateSaveObject();
  csdtCloud.saveToCloud(saveObject, () => {
    console.log("callback function");
  });
});

$(`#${cloudUI.saveLocalProject}`).on("click", () => {
  downloadStringAsFile(
    `${globals.currentProjectName}.rw`,
    rw.generateProjectString()
  );
});

$(`#${cloudUI.saveConfirmedSubmit}`).on("click", () => {
  csdtCloud.setNewProjectStatus(false);
  rw.generateSaveObject();
  csdtCloud.saveToCloud(saveObject, () => {
    console.log("callback function");
  });
});

/**checkForCurrentProject: Initially checks to see if there is a project available to load.
 *
 */
Cloud.prototype.checkForCurrentProject = function () {
  const myself = this;

  console.log("Checking for current project...");

  // First, check if there is a config object (which would contain the project information to load)
  if (typeof config === "undefined") {
    console.log("No project found. Continuing with initialization.");
    globals.isNewProject = true;
  } else {
    // If it was found, attempt to grab the config project id, then load the project file.
    try {
      if (Number.isInteger(Number(config.project.id))) {
        console.log("Project found. Proceeding with project load.");
        myself.loadFromCloud(config.project.id, loadRWFile);
      }
    } catch (err) {
      console.error(
        "Note to Developer: There was an issue loading the config file."
      );
      console.error(`Error Message: ${JSON.stringify(err)}`);
    }
  }
};

// Init the application
initApplication();
