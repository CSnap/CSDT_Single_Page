/**
 * Contains the core logic of the wheels
 *
 * @author Andrew Hunn
 *
 */

const MAX_NUM_OF_BEATS = 16;
const TOTAL_WHEEL_COUNT = 3;

const defaultWheels = {
  wheel1: {
    nodes: ["hihat1", "rest", "hihat1"],
    repeat: 5,
  },
  wheel2: {
    nodes: ["clave1", "maracas1", "maracas1", "rest"],
    repeat: 4,
  },
};
class WheelsContainer {
  constructor() {
    this.wheelsParentContainer = document.getElementById(
      appReferences.wheelsContainer
    );

    this.numberOfWheelsSelect = document.getElementById(
      appReferences.numOfWheels
    );
    this.wheels = [];
    this.spacers = [];
    this.wheelCount = 1;

    this.rapWheel;
  }

  /**
   * Initialize the wheels container with new wheels.
   *
   * @param {Object} opts Object containing an initial default state for the wheels.
   */
  initWheels(opts) {
    for (let i = 0; i < TOTAL_WHEEL_COUNT; i++) {
      this.wheels.push(new Wheel(this.wheels.length));
      this.wheelsParentContainer.appendChild(this.wheels[i].container);
    }

    //Add event listener to container: On change, update the number of wheels visible on the screen
    this.numberOfWheelsSelect.addEventListener("change", (event) => {
      rw.stopRhythm();
      this.setVisibleWheelCount(event.target.value);
      this.updateContainer();
    });

    this.rapWheel = new RecordWheel();
    // If given a wheel configuration, load it. Otherwise, just return.
    if (typeof opts === "undefined") return;
    this.setWheelConfiguration(opts);
  }

  /**
   * Sets the wheels to a desired configuration on wheel container creation.
   *
   * (I kind of wanted to try something complicated, but this can probably be handled better ... )
   * @param {object} opts Processes an object that includes an array of nodes strings (i.e hihat1, rest), and repeat value.
   *
   */
  setWheelConfiguration(opts) {
    // First, get the wheels (max is three, might redo later...)
    const { wheel1, wheel2, wheel3 } = opts;

    // Then, set the visible wheels based on either the number of wheels in config, or the total wheel count.
    // Whichever is lower.
    this.setVisibleWheelCount(
      Math.min(Object.keys(defaultWheels).length, TOTAL_WHEEL_COUNT)
    );

    // Update the container to make those changes.
    this.updateContainer();

    // Then, iterate through the wheels, setting the nodes and repeats for each.
    for (let i = 0; i < this.wheelCount; i++) {
      // Evaluate if the wheel exists, or just move on
      let current = eval(`wheel${i + 1}`);
      if (!current) continue;

      // Set the number of beats based on the node array given in config
      this.wheels[i].setNumOfBeats(current.nodes.length);

      // Iterate through the nodes, setting each type of beat
      for (let j = 0; j < current.nodes.length; j++) {
        this.wheels[i].nodes[j].setNodeType(current.nodes[j]);
      }
      // Set the repeat count
      this.wheels[i].setLoopCount(current.repeat);
    }
  }

  /**
   * Sets which wheels are visible based on the current wheel count.
   *
   * @param {integer} num The number of wheels to be shown
   */
  setVisibleWheelCount(num) {
    this.wheelCount = num;
    this.wheelControlPanels = document.querySelectorAll(".control-div");

    // inactive wheels are just hidden
    for (let i = 0; i < this.wheelCount; i++) {
      this.wheels[i].container.style.display = "flex";
      this.wheelControlPanels[i].style.display = "block";
    }

    for (let i = this.wheelCount; i < this.wheels.length; i++) {
      this.wheels[i].container.style.display = "none";
      this.wheelControlPanels[i].style.display = "none";
    }
    this.rapWheel.controlPanel.style.display =
      globals.outgoingAudio == "" ? "none" : "block";
  }

  /**
   * When called, update all wheels inside container
   */
  updateContainer() {
    // update the recorded audio Wheel
    this.rapWheel.update();

    for (let i = 0; i < this.wheels.length; i++) {
      this.wheels[i].update();
    }
  }
}
class Wheel {
  constructor(wheelID) {
    this.wheelID = wheelID;
    this.currentNode = "";
    this.nodeCount = 4;
    this.rotation = 0;
    this.isPlaying = false;
    this.loopCount = 1;
    this.recordingWheel = false;

    // Create the initial wheel container
    this.createWheelContainer();

    // Create the control panel for the wheel
    this.createWheelControls();

    // Create the wheel
    this.createWheel();
  }

  /**
   * Creates the container in which the wheel is placed in.
   */
  createWheelContainer(title = `Wheel ${this.wheelID + 1}:`) {
    // Create the container and assign it a class
    this.container = document.createElement("div");
    this.container.classList.add(appReferences.individualWheelContainer);

    // Create the header and assign the wheel a generic wheel title
    this.header = document.createElement("h4");
    this.header.innerHTML = title;

    // Throw the header into the container
    this.container.appendChild(this.header);
  }

  /**
   * Creates the controls for the wheel. Controls appear in the sidebar.
   */
  createWheelControls(title = `Wheel ${this.wheelID + 1}:`) {
    //	Create the actual control panel and give it a class
    this.controlPanel = document.createElement("div");
    this.controlPanel.classList.add("control-div");

    // Create the header for the panel, give it a title, and a class.
    this.controlHeader = document.createElement("h4");
    this.controlHeader.innerHTML = title;
    this.controlHeader.classList.add("control-header");

    // Append the header to the panel
    this.controlPanel.appendChild(this.controlHeader);

    // Next, create the 'Number of Beats' input field, and add it to the panel
    this.createNumOfBeatsField();

    // Then, create the 'Repeat' input field, and add it to the panel
    this.createRepeatField();

    // Append the finished control panel to the sidebar
    document
      .getElementById(appReferences.wheelControlsContainer)
      .appendChild(this.controlPanel);
  }

  /**
   * Creates the number of beats input field for the wheel control panel. Dictates how many tiles the wheel can contain.
   */
  createNumOfBeatsField() {
    // If the wheel is a recording wheel, skip
    if (this.recordingWheel) return;

    // Create the field label
    this.beatCountLabel = document.createElement("label");
    this.beatCountLabel.innerHTML = "Num of Beats:";
    // this.beatCountLabel.classList.add("num_of_beats_label");

    // Create the select input
    this.beatCountSelect = document.createElement("select");
    this.beatCountSelect.classList.add("num_of_beats_select");
    this.beatCountSelect.setAttribute("id", "loopBox");

    // Create the 'Num of Beats' options for the select, up to the max number of beats per wheel
    let beatCountOptions = [];
    for (let i = 1; i <= MAX_NUM_OF_BEATS; i++) {
      const option = document.createElement("option");
      option.classList.add(appReferences.numOfBeatOption);
      option.innerText = i;
      option.value = i;

      this.beatCountSelect.appendChild(option);
      beatCountOptions.push(option);
    }

    //Add event listener to the select that will halt the application, and set the number of beats in the wheel
    this.beatCountSelect.addEventListener("change", (e) => {
      rw.stopRhythm();
      if (!this.beatCountSelect.disabled) {
        this.setNumOfBeats(e.target.value);
      }
    });

    // Set the default value that is selected
    beatCountOptions[this.nodeCount - 1].selected = true;

    // Create the container to hold the input and label
    this.beatCountContainer = document.createElement("div");
    this.beatCountContainer.appendChild(this.beatCountLabel);
    this.beatCountContainer.appendChild(this.beatCountSelect);

    // Append the finished beat input field to the control panel
    this.controlPanel.appendChild(this.beatCountContainer);

    // Make the list of options available to the 'setNumOfBeats' method
    this.beatCountSelect.selectOptions = beatCountOptions;
  }

  /**
   * Creates the repeat input field for the wheel. Dictates how many times it should complete a rotation.
   */
  createRepeatField() {
    // Create the repeat input
    this.repeatInput = document.createElement("input");
    this.repeatInput.type = "number";
    this.repeatInput.value = 1;
    this.repeatInput.classList.add(appReferences.numOfRepeatInput);

    // Add event listener to prevent user from entering anything other than a number -- Not sure if this is really needed since the type is now a number...
    this.repeatInput.addEventListener("keypress", (event) => {
      if (!isFinite(event.key)) {
        event.preventDefault();
        return false;
      }
    });

    // Add event listener to halt the application, then update the number of repeats for the wheel.
    this.repeatInput.addEventListener("keyup", () => {
      rw.stopRhythm();
      if (this.repeatInput.value) {
        this.setLoopCount(parseInt(this.repeatInput.value));
        // this.loopCount = parseInt(this.repeatInput.value);
      }
    });

    // Create the container for the input and label
    this.repeatContainer = document.createElement("div");
    this.repeatContainer.classList.add("wheel-repeat-label");
    this.repeatLabel = document.createElement("label");
    this.repeatLabel.innerHTML = "Repeat: ";

    // Append the input and label to the container
    this.repeatContainer.appendChild(this.repeatLabel);
    this.repeatContainer.appendChild(this.repeatInput);

    // Append the repeat field to the wheel's control panel
    this.controlPanel.appendChild(this.repeatContainer);
  }

  /**
   * Creates the actual wheel the user will be interacting with.
   */
  createWheel() {
    //  Start with a div for the wheel (not to be confused with the parent div that holds wheel)
    this.wheel = document.createElement("div");
    this.wheel.classList.add(appReferences.individualWheel);

    // Creating a svg to add to the wheel for proper spacing -- Need to investigate other ways of achieving the same spacing without doing this..
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style["position"] = "relative";
    svg.setAttribute("width", 250);
    svg.setAttribute("height", 260);
    svg.innerHTML +=
      "<circle" +
      'cx="125"' +
      'cy="150"' +
      'r="80"' +
      'stroke="#0038b9"' +
      'stroke-width="2"' +
      'fill="transparent"' +
      "/>";
    this.svg = svg;
    this.svg.circle = svg.lastChild;

    // Add the svg to the container (not the wheel)
    this.container.appendChild(svg);

    // Then, create the nodes (which will go into the wheel)
    this.createWheelNodes();

    // Add the finished wheel with nodes into the wheel container.
    this.container.appendChild(this.wheel);
  }

  /**
   * Creates new node instances for the wheel
   */
  createWheelNodes() {
    // Create the nodes for the wheel
    this.nodes = [];
    for (let i = 0; i < 16; i++) {
      let node = new Node({
        parent: this,
        type: "rest",
      });

      // Add each node to the wheel
      this.wheel.appendChild(node.tileBase);

      // Push the nodes to the node array for reference elsewhere in the application -- need to find out where exactly...
      this.nodes.push(node);
    }

    // Init the wheel with the created nodes
    this.setNumOfBeats(this.nodeCount);
  }

  /**
   * Sets the wheel nodes in place based on the number of beats. (i.e. arrange the nodes into a wheel, calculating where each node should be at.)
   *
   * @param {integer} nodeCount The number of nodes the wheel should have.
   */
  setNumOfBeats(nodeCount) {
    // hide nodes that are over the nodeCount
    // i.e. inactive nodes are merely hidden
    for (let i = 0; i < nodeCount; i++) {
      this.nodes[i].tileBase.style.display = "inline-block";
    }
    for (let i = nodeCount; i < 16; i++) {
      this.nodes[i].tileBase.style.display = "none";
    }

    // Set the current node count
    this.nodeCount = nodeCount;

    // adjust the node graphics
    let offset = 10 * nodeCount + 35;
    let scale = 1;
    if (nodeCount > 8) {
      scale = 1 - nodeCount / 20 + 0.4;
    } else {
      scale = 1;
    }

    // Adjust the svg spacing based on the number of nodes
    this.svg.circle.setAttribute("r", offset * scale);

    // Set each beat count option to false.
    for (let i = 0; i < 16; i++) {
      this.beatCountSelect.options[i].selected = false;
    }

    //Set the current node count as the selected value.
    this.beatCountSelect.options[nodeCount - 1].selected = true;

    // Update the wheel visually
    this.update();
  }

  /**
   * Sets the number of times the wheel will repeat (or loop)
   *
   * @param {integer} loopCount How many times should the wheel rotate around?
   */
  setLoopCount(loopCount) {
    this.loopCount = loopCount;
    this.repeatInput.value = loopCount;
  }

  /**
   * Sets the playback status of the wheel. Controls the current rotation and highlights for the individual nodes based on status.
   *
   * @param {bool} isPlaying Is the wheel currently playing audio?
   */
  setPlaying(isPlaying) {
    this.isPlaying = isPlaying;
    this.rotation = 0;

    if (!isPlaying) {
      for (let i = 0; i < this.nodes.length; i++) {
        this.nodes[i].setHighlighted(false);
      }
    }
  }

  /**
   * Sets the rotation value for the wheel
   *
   * @param {number} val The rotation value for the wheel
   */
  setWheelRotation(val) {
    this.rotation = val;
  }

  /**
   * Just sets the playback flag for the wheel ---- Might not really need, but more refactoring is needed later anyways.
   *
   * @param {boolean} isPlaying Is the wheel currently playing audio?
   */
  setWheelPlayStatus(isPlaying) {
    this.isPlaying = isPlaying;
  }

  /**
   * Just sets the loop count value of the wheel. --- Might not really need, but more refactoring is needed later anyways.
   *
   * @param {boolean} isPlaying Is the wheel currently playing audio?
   */
  setWheelRepeat(val) {
    this.loopCount = val;
  }

  /**
   * Based on the current wheel values, animate the wheel (or halt animation)
   */
  update() {
    // stop animation
    if (this.isPlaying) {
      this.rotation +=
        ((globals.bpm / 60.0) * ((Math.PI * 2.0) / this.nodeCount)) / 60;
      if (this.rotation >= this.loopCount * Math.PI * 2) {
        this.setPlaying(false);

        //TODO Fix this rw reference
        rw.activeBuffers[this.wheelID].stop();
      }
    }

    // highlights current node
    if (this.isPlaying) {
      let currentPos = (this.rotation / (Math.PI * 2)) * this.nodeCount;
      this.nodes[Math.floor(currentPos) % this.nodeCount].setHighlighted(
        currentPos - Math.floor(currentPos) < 0.7
      );
      this.currentNode = currentPos;
    }

    // updates notes
    for (let i = 0; i < this.nodeCount; i++) {
      this.nodes[i].rotation =
        this.rotation - (Math.PI * 2 * i) / this.nodeCount;
      this.nodes[i].update();
    }
  }
}

class RecordWheel {
  constructor() {
    this.exportBuffers = [];
    this.recordedBufferSource;
    this.recordedBufferSourceExport;
    this.maxTime;
    this.audioRec = "";
    this.audioChunks = [];
    this.recordedAudioArray = [];
    this.activeBuffers = [];
    this.loopCount = 1;
    this.rotation = 0;
    this.isPlaying = false;
    this.recordingWheelSprite = "./img/audiowheel2.png";

    this.startRecordButton = document.getElementById(
      appReferences.recordButton
    );
    this.stopRecordButton = document.getElementById(
      appReferences.stopRecordButton
    );
    this.recordedAudioControls = document.getElementById(
      appReferences.recordedAudio
    );
    this.recordingCountdown = document.getElementById(
      appReferences.recordCountdown
    );

    this.parentContainer = document.getElementById(
      appReferences.wheelsContainer
    );

    this.controlsContainer = document.getElementById(
      appReferences.wheelControlsContainer
    );

    // Create the initial wheel container
    this.createWheelContainer();

    // Create the control panel for the wheel
    this.createRecordingWheelControls();

    // Create the wheel
    this.createRecordingWheel();

    this.addEventListeners();

    this.testRecordingModal();
  }

  testRecordingModal() {
    this.recordedAudioControls.hidden = true;
    let recordingContainer =
      document.getElementsByClassName("recording-view")[0];

    let recordingButton = document.getElementsByClassName("recording-icon")[0];

    let recordingText = document.getElementById("recording-time");
    recordingText.hidden = true;
    let playbackButton =
      document.getElementsByClassName("recording-playback")[0];

    playbackButton.classList.add("d-none");

    recordingButton.addEventListener("click", () => {
      recordingButton.classList.add("recording-playback");
      recordingText.style.color = "red";
    });
  }

  /**
   * Attach event listeners to the specific recording wheel / modal elements
   */
  addEventListeners() {
    // Start recording audio
    this.startRecordButton.addEventListener("click", () =>
      this.promptRecordingCountdown()
    );
    // Stop the audio recording
    this.stopRecordButton.addEventListener("click", () => this.stopRecording());

    // TODO When reworking the recording modal, should automatically call
    $(`.${appReferences.closeRecordingPrompt}`).on("click", () => {
      try {
        this.stopRecording();
      } catch (e) {
        console.error(e);
      }
      this.recordedAudioControls.pause();
    });

    // Add event listener to prevent user from entering anything other than a number -- Not sure if this is really needed since the type is now a number...
    this.repeatInput.addEventListener("keypress", (event) => {
      if (!isFinite(event.key)) {
        event.preventDefault();
        return false;
      }
    });

    // Add event listener to halt the application, then update the number of repeats for the wheel.
    this.repeatInput.addEventListener("keyup", () => {
      rw.stopRhythm();
      if (this.repeatInput.value) {
        this.setLoopCount(parseInt(this.repeatInput.value));
        // this.loopCount = parseInt(this.repeatInput.value);
      }
    });
  }

  /**
   * Creates the controls for the wheel. Controls appear in the sidebar.
   * Technically could make this extend wheel, but not today...
   */
  createRecordingWheelControls() {
    //	Create the actual control panel and give it a class
    this.controlPanel = document.createElement("div");
    this.controlPanel.classList.add("control-div");

    // Create the header for the panel, give it a title, and a class.
    this.controlHeader = document.createElement("h4");
    this.controlHeader.innerHTML = `Recording:`;
    this.controlHeader.classList.add("control-header");

    // Append the header to the panel
    this.controlPanel.appendChild(this.controlHeader);

    // Then, create the 'Repeat' input field, and add it to the panel
    this.createRepeatField();

    // Append the finished control panel to the sidebar
    this.controlsContainer.appendChild(this.controlPanel);
  }

  /**
   * Creates the container in which the wheel is placed in.
   * Technically could make this extend wheel, but not today...
   */
  createWheelContainer() {
    // Create the container and assign it a class
    this.container = document.createElement("div");
    this.container.classList.add(appReferences.individualWheelContainer);
    this.container.id = appReferences.recordingWheel;

    // Create the header and assign the wheel a generic wheel title
    this.header = document.createElement("h4");
    this.header.innerHTML = "Recording: ";

    // Throw the header into the container
    this.container.appendChild(this.header);
  }

  /**
   * Creates the repeat input field for the wheel. Dictates how many times it should complete a rotation.
   */
  createRepeatField() {
    // Create the repeat input
    this.repeatInput = document.createElement("input");
    this.repeatInput.type = "number";
    this.repeatInput.classList.add(appReferences.numOfRepeatInput);

    // Create the container for the input and label
    this.repeatContainer = document.createElement("div");
    this.repeatContainer.classList.add("wheel-repeat-label");
    this.repeatLabel = document.createElement("label");
    this.repeatLabel.innerHTML = "Repeat: ";

    // Append the input and label to the container
    this.repeatContainer.appendChild(this.repeatLabel);
    this.repeatContainer.appendChild(this.repeatInput);

    // Append the repeat field to the wheel's control panel
    this.controlPanel.appendChild(this.repeatContainer);
  }

  /**
   * Creates the actual wheel
   * Technically could make this extend wheel, but not today...
   */
  createRecordingWheel() {
    //  Start with a div for the wheel (not to be confused with the parent div that holds wheel)
    this.wheel = document.createElement("div");
    this.wheel.id = appReferences.recordingWheel_image;

    // Create the image
    this.wheelImage = document.createElement("img");
    this.wheelImage.setAttribute("src", this.recordingWheelSprite);

    // Add the img to the container
    this.wheel.appendChild(this.wheelImage);

    // Add the finished wheel with nodes into the wheel container.
    this.container.appendChild(this.wheel);
    this.container.classList.remove("d-flex");
    this.container.classList.add("d-none");

    this.parentContainer.appendChild(this.container);
  }

  /**
   * Updates the animation of the wheel depending on the duration of the audio / if it is even playing
   */
  update() {
    if (this.isPlaying) {
      // 2Pi divided by number of frames that will be rendered
      let addedRotation =
        (Math.PI * 2.0) / (60.0 * globals.recordAudioDuration);
      this.rotation += addedRotation;
      if (this.rotation > this.loopCount * Math.PI * 2.0) {
        this.isPlaying = false;
        this.rotation = 0;
      }
      this.wheelImage.style.transform =
        "rotate(" + (this.rotation * 180) / Math.PI + "deg)";
    }
  }

  /**
   * Sets the playback status of the wheel, as well as fix the rotation of the wheel on stop
   */
  stopRecordedAudioPlayback() {
    this.isPlaying = false;
    this.rotation = 0;
    this.wheelImage.style.transform = "rotate(" + this.rotation + "deg)";
  }

  // TODO add css class that counts down when visible
  promptRecordingCountdown() {
    this.startRecordButton.hidden = true;
    this.stopRecordButton.hidden = false;

    this.recordingCountdown.style.visibility = "visible";
    this.audioRec = "";
    this.audioChunks = [];
    this.recordedAudioArray = [];
    setTimeout(() => {
      this.startRecording();
    }, 3000);

    let i = 3;
    this.recordingCountdown.innerHTML = i.toString();
    let countdownTimer = setInterval(() => {
      i -= 1;
      this.recordingCountdown.innerHTML = i.toString();
      if (i == 0) {
        clearInterval(countdownTimer);
      }
    }, 1000);
  }

  startRecording() {
    this.recordingCountdown.style.visibility = "hidden";

    globals.startTime = new Date().getTime();

    // Get access to the microphone, then handle audio recording
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then((stream) => {
        this.audioRec = new MediaRecorder(stream);
        this.audioRec.addEventListener("dataavailable", (e) =>
          this.processMicrophoneAudio(e)
        );
        this.audioRec.start();
        superAudioContext.resume();
      });
  }

  processMicrophoneAudio(e) {
    this.audioRec.stream.getTracks().forEach((track) => track.stop());
    let myself = this;
    this.audioChunks.push(e.data);

    if (this.audioRec.state == "inactive") {
      let blob = new Blob(this.audioChunks, {
        type: "audio/mpeg-3",
      });

      // Converting blob to base64 for file saving
      let reader = new window.FileReader();

      reader.addEventListener("loadend", () => {
        globals.outgoingAudio = reader.result;
      });

      reader.readAsDataURL(blob);

      globals.endTime = new Date().getTime();

      this.recordedAudioControls.setAttribute("src", URL.createObjectURL(blob));
      this.recordedAudioControls.setAttribute("autoplay", true);

      globals.recordAudioDuration =
        (globals.endTime - globals.startTime) / 1000;

      blob.arrayBuffer().then((buffer) => {
        rw.audioContext.decodeAudioData(
          buffer,
          (audioBuf) => {
            myself.recordedAudioArray.push(audioBuf);
            // make rapWheel visible
            myself.container.classList.remove("d-none");
            myself.container.classList.add("d-flex");
          },
          function (e) {
            console.log("ERROR WITH DECODING RECORDED AUDIO: " + e);
          }
        );
      });
    }
  }

  processSavedAudio(userAudioBlob) {
    let myself = this;
    console.log(userAudioBlob);
    this.audioChunks = [];
    this.recordedAudioArray = [];
    this.audioRec = "";

    this.recordedAudioControls.setAttribute("src", "");
    this.recordedAudioControls.setAttribute("autoplay", false);

    if (userAudioBlob == "") {
      if (!myself.container.classList.contains("d-none")) {
        myself.container.classList.add("d-none");
        myself.container.classList.remove("d-flex");
        myself.controlPanel.style.display = "none";
      }
      return;
    }

    this.recordedAudioControls.setAttribute(
      "src",
      URL.createObjectURL(userAudioBlob)
    );
    this.recordedAudioControls.pause();

    globals.recordAudioDuration = (globals.endTime - globals.startTime) / 1000;

    userAudioBlob.arrayBuffer().then((buffer) => {
      rw.audioContext.decodeAudioData(
        buffer,
        (audioBuf) => {
          myself.recordedAudioArray.push(audioBuf);
          // make rapWheel visible
          myself.container.classList.remove("d-none");
          myself.container.classList.add("d-flex");

          //
          myself.controlPanel.style.display = "block";
        },
        (error) => {
          console.error("Note to Developer: Error decoding recorded audio.");
          console.error(`Error Message: ${JSON.stringify(error)}`);
        }
      );
    });
  }

  /**
   * Stops the actual recording of the audio, not the playback.
   */
  stopRecording() {
    this.startRecordButton.hidden = false;
    this.stopRecordButton.hidden = true;
    if (this.audioRec.state == "inactive") return;
    this.audioRec.stop();
  }

  /**
   * Creates the audio buffer for the user's recorded audio.
   *
   * @param {bool} toExportIn Flag to make sure that the current buffer is used for MP3 export or not.
   */
  fillRecordedAudioBuffer(toExportIn = false) {
    // Init a buffer source
    if (!toExportIn)
      this.recordedBufferSource = superAudioContext.createBufferSource();

    // Then, if the audio array is empty, just return
    if (this.recordedAudioArray.length == 0 || this.loopCount == 0) return;

    // If there is audio, create the actual buffer
    let recordedRawBuffer = this.recordedAudioArray[0].getChannelData(0);
    let recordWheelBuffer = superAudioContext.createBuffer(
      1,
      48000 * (this.loopCount * globals.recordAudioDuration),
      48000
    );

    // Next, prep the number of iterations the recorded audio should be
    let setRecordWheel = recordWheelBuffer.getChannelData(0);
    for (let j = 0; j < this.loopCount; ++j) {
      setRecordWheel.set(
        recordedRawBuffer,
        j * 48000 * globals.recordAudioDuration
      );
    }

    //Connect the finalized buffer the appropriate source.
    let recordPlayback = superAudioContext.createBufferSource();
    recordPlayback.buffer = recordWheelBuffer;
    recordPlayback.connect(superAudioContext.destination);
    if (!toExportIn) {
      this.recordedBufferSource = recordPlayback;
    } else {
      this.recordedBufferSourceExport = recordPlayback;
    }
  }
}

// TODO Terminology change between nodes, sound tiles, etc. Kind of confusing..
// TODO Attach record audio duration, start, end to record wheel
