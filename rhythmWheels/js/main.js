/* eslint-disable */
/* eslint-disable padded-blocks */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
/* eslint-disable prefer-let */
/* eslint-disable space-before-function-parent*/

// Application ID attached to Rhythm Wheels
let applicationID = 90;

let rw;
let saveObject;

// Create cloud instance
window.csdtCloud;

// Classes, Ids, etc for GUI Manuplication
let appReferences = {
  soundCategorySelect: "sound_category",

  soundPalette: "sound_palette",
  soundTile: "sound_tile",

  wheelControlsContainer: "wheelControls",
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

  localFileImport: "import_file",

  mp3ExportButton: "mp3show",
  recordButton: "record",
  stopRecordButton: "recordStop",
  recordedAudio: "recordedAudio",
  closeRecordingPrompt: "close-recording",
  recordCountdown: "countdown",
};

// Available sound libraries
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
    "rest",
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

// Sound variables for audio merging
let sounds = {};

// List of HTML element names to make it easier to refactor
let flags = {
  dragging: null,
  playing: false,
  dragFromNode: false,
};

// Project specific values and globals
let rhythmWheelGlobals = {
  bpm: 120,
  projectName: "Untitled",
  userID: "",
  number_wheels: 1,
  userName: "",
  loadingText: "",
  mp3_text: "",
  record_button: "",
  recorded_audio: "",
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

const EventListenerMode = {
  capture: true,
};

// modified from stackoverflow - essential for fixing the cursor while
// dragging
// Useful functions
let captureMouseEvents = function (e) {
  preventGlobalMouseEvents();
  document.addEventListener("mouseup", mouseupListener, EventListenerMode);
  document.addEventListener("mousemove", mousemoveListener, EventListenerMode);
  e.preventDefault();
  e.stopPropagation();
};

let preventGlobalMouseEvents = function () {
  document.body.style["pointer-events"] = "none";
};

let restoreGlobalMouseEvents = function () {
  document.body.style["pointer-events"] = "auto";
};

let mousemoveListener = function (e) {
  e.stopPropagation();

  // flags.dragging.draggableSoundTileBase.style["left"] = e.clientX - 25 + "px";
  // flags.dragging.draggableSoundTileBase.style["top"] = e.clientY - 25 + "px";

  flags.dragging.setTileBeingDragged(e, true);
};

let mouseupListener = function (e) {
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
};

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

initApplication();

// TODO Possibly reset the unused wheels when loading in user projects...
