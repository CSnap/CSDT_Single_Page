class RhythmWheels {
  constructor(opts) {
    if (opts === undefined) opts = {};
    if (opts.sounds !== undefined) sounds = opts.sounds;

    this.audioContext = superAudioContext;
    this.encoder;

    this.exportBuffers = [];
    this.activeBuffers = [];

    this.bpmRate;
    this.maxTime = 0;
    this.secondsPerBeat = 60.0 / globals.bpm;

    //TODO Move this to the 'flags' variable
    this.isCurrentlyPlaying = false;

    this.playButton = document.getElementById(appReferences.playButton);
    this.stopButton = document.getElementById(appReferences.stopButton);
    this.mp3ExportButton = document.getElementById(
      appReferences.mp3ExportButton
    );
    this.mp3ExportIcon = document.getElementsByClassName(
      appReferences.mp3ExportIcon
    )[0];
    this.tempoSlider = document.getElementById(appReferences.tempoSlider);

    this.localFileImport = document.getElementById(cloudUI.loadLocalProject);

    this.init();
  }

  /**
   * Initializes Rhythm Wheels by creating the different components, instantiating tile audio buffers, etc.
   */
  init() {
    // Create the containers for the interactive components
    this.soundPalette = new SoundPalette(defaultSoundPalette);

    // Create the wheels container, then establishes an initial configuration for the wheels.
    this.wheelsContainer = new WheelsContainer(defaultWheels);

    //Add rap wheel to rhythm wheels for quick reference.
    this.rapWheel = this.wheelsContainer.rapWheel;

    //Since this is an instance of rhythm wheels, set the event listeners for the buttons and input
    this.bindEventListeners();

    // Animate the wheels
    let anim = () => {
      this.wheelsContainer.updateContainer();
      requestAnimationFrame(anim);
    };

    anim();

    // From the cloud.js, hide the overlay once it is finished.
    setLoadingOverlay(true, false);
  }

  /**
   * Playback the audio.
   */
  playRhythm() {
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    // If currently playing, stop to re buffer the audio, then play.
    this.stopRhythm();

    let sequences = "";
    this.rapWheel.recordedBufferSource = "";

    // Create a promise to compile / fill the appropriate buffers with the user's audio and wheel sequence
    let playPromise = new Promise((resolve, reject) => {
      sequences = this.compileAudio();
      this.rapWheel.fillRecordedAudioBuffer();
      resolve(sequences);
    });

    // Once the buffers are ready, start playing the wheels, and the audio.
    playPromise.then((value) => {
      for (let i = 0; i < value.length; i++) {
        this.wheelsContainer.wheels[i].setPlaying(true);
        this.activeBuffers[i].start(); // if playable sequences, play the audio buffer associated
      }
      this.rapWheel.isPlaying = true;
      this.rapWheel.recordedBufferSource.start(); // ONLY DO THIS IF PREVIOUSLY CALLED
      this.isCurrentlyPlaying = true;
    });
  }

  /**
   * Stops the execution of the currently playing rhythm.
   */
  stopRhythm() {
    // If it is not even playing, just exit out.
    if (!this.isCurrentlyPlaying) return;

    // Set isCurrentlyPlaying flag to false;
    this.isCurrentlyPlaying = false;

    // Set the 'isPlaying' flag on each of the wheels to false;
    this.wheelsContainer.wheels.map((wheel) =>
      wheel.setPlaying(this.isCurrentlyPlaying)
    );

    // Stops each of the ongoing active buffers, then clear the array
    this.activeBuffers.map((source) => source.stop());
    this.activeBuffers = [];

    // Stops the user's recorded audio
    this.rapWheel.stopRecordedAudioPlayback();
    this.rapWheel.recordedBufferSource.stop();
  }

  /**
   * Creates the sequence of nodes to run through, while filling the buffer with the audio in
   * the correct order, with the correct time between sounds.
   *
   * @param {boolean} toExport Pass if the user is exporting an mp3 to the bufferFill method.
   * @returns The complete sequence of wheel nodes.
   */
  compileAudio(toExport) {
    // Create some constants for readability
    const wheelCount = this.wheelsContainer.wheelCount;
    const wheels = this.wheelsContainer.wheels;

    let sequences = [];

    // Recalculate max time every time the app compiles the audio
    this.maxTime = 0;

    // Now, calculate the total sequence time based on the current wheels and nodes.
    for (let i = 0; i < wheelCount; i++) {
      let sequenceTime = this.calculateSequenceTime(
        wheels[i].loopCount,
        wheels[i].nodeCount
      );
      sequences.push([]);

      for (let k = 0; k < wheels[i].loopCount; k++) {
        for (let j = 0; j < wheels[i].nodeCount; j++) {
          sequences[i].push(wheels[i].nodes[j].type);
        }
      }
      // Based on the given sequence and time, create the audio buffer for the wheels (not the recording wheel)
      this.bufferFill(sequences[i], sequenceTime, toExport);
    }

    // Returns the compiled string of audio for the play promise to iterate through.
    return sequences;
  }

  /**
   * Calculates the sequence time, setting the current max time with each call.
   *
   * @param {number} repeats The wheel's number of repeats
   * @param {number} nodes The wheel's number of nodes
   * @returns The calculated sequence time
   */
  calculateSequenceTime(repeats, nodes) {
    let calcTime = (repeats * nodes * 60.0) / globals.bpm;
    this.maxTime = calcTime > this.maxTime ? calcTime : this.maxTime;
    return calcTime;
  }

  /**
   * Fills the appropriate buffer with the given sequence's audio.
   *
   * @param {*} sequence
   * @param {*} sequenceTime
   * @param {*} toExportIn
   * @returns
   */
  bufferFill(sequence, sequenceTime, toExportIn) {
    // create an empty buffer that is not connected to output, dummy variable if rotations = 0
    // only add empty buffer if compiling to play
    if (sequenceTime == 0) {
      if (!toExportIn) {
        activeBuffers.push(this.ac.createBufferSource());
      }
      return;
    }

    // Update the seconds per beat based on current bpmRate
    this.secondsPerBeat = 60.0 / globals.bpm;

    // Create a buffer based on the given sequence time
    let wheelBuffer = this.audioContext.createBuffer(
      1,
      48000 * sequenceTime,
      48000
    );

    // Create audio slices and add them to wheel buffer
    sequence.map((node, index) =>
      this.sliceAudioClip(index, wheelBuffer, node)
    );

    // Connect the finalized buffer to the appropriate source.
    let wheelPlayback = this.audioContext.createBufferSource();
    wheelPlayback.buffer = wheelBuffer;

    wheelPlayback.connect(this.audioContext.destination);

    if (!toExportIn) {
      // Add for playback
      this.activeBuffers.push(wheelPlayback);
    } else {
      // Add for exporting an MP3
      this.exportBuffers.push(wheelPlayback);
    }
  }

  /**
   * Process and append the user's selected audio for buffer population.
   */
  sliceAudioClip(
    sequenceIndex,
    wheelBuffer,
    nameOfNode,
    secondsPerBeat = this.secondsPerBeat
  ) {
    //Do i even need this????
    let soundBuffer = this.audioContext.createBuffer(
      1,
      48000 * secondsPerBeat,
      48000
    );
    let wheelBufferData = wheelBuffer.getChannelData(0);

    soundBuffer = sounds[nameOfNode].buffer;

    let slicedAudio = soundBuffer
      .getChannelData(0)
      .slice(0, 48000 * secondsPerBeat);

    wheelBufferData.set(slicedAudio, sequenceIndex * 48000 * secondsPerBeat);
  }

  /**
   * Binds event listeners with functions from the RW instance to the gui
   */
  bindEventListeners() {
    // Play the rhythm
    this.playButton.addEventListener("click", () => this.playRhythm());

    // Stop the rhythm
    this.stopButton.addEventListener("click", () => this.stopRhythm());

    // Export as an MP3
    this.mp3ExportButton.addEventListener("click", (e) => {
      this.mp3ExportButton.disabled = true;
      this.mp3ExportIcon.classList.add("icn-spinner");

      // To fix a weird issue where the function seemingly fires before the mp3 button changes...
      setTimeout(() => {
        this.mp3Export();
      }, 500);
    });

    // Update the current tempo (or beats per minute bmp)
    this.tempoSlider.addEventListener("change", (event) => {
      this.stopRhythm();
      this.bpmRate = 120 * Math.pow(10, event.target.value);
      globals.bpm = 120 * Math.pow(10, event.target.value);
    });

    // Update the wheels container based on scroll and resize document events
    document.addEventListener("resize", () =>
      this.wheelsContainer.updateContainer()
    );

    document.addEventListener("scroll", () =>
      this.wheelsContainer.updateContainer()
    );

    $(`#${appReferences.recordPrompt}`).on("hide.bs.modal", (e) => {
      this.rapWheel.recordedAudioControls.pause();
    });

    $(`#${appReferences.recordPrompt}`).on("show.bs.modal", (e) => {
      this.rapWheel.recordedAudioControls.currentTime = 0;
    });
  }

  /**
   * Creates an MP3 based on the user's project
   *
   * Step 1: 1. compile- put the wheels' audio into the this.activeBuffers array
   * Step 2: iterate through each of the this.activeBuffers, add to the 'output' buffer which will have the layered audio
   * Step 3: then encode the final array
   */
  mp3Export() {
    let recordedAudioMax, maxArrTime, layeredAudio, doubleArray;

    // clear existing export buffers
    this.rapWheel.recordedBufferSourceExport = "";
    this.exportBuffers = [];

    // compile audio data from rhythm wheels and recording
    this.compileAudio(true);
    this.rapWheel.fillRecordedAudioBuffer(this.rapWheel.loopCount, true);

    recordedAudioMax = this.rapWheel.loopCount * globals.recordAudioDuration;

    // first, check if there is any audio to export (will it be an empty mp3 file)
    if (this.maxTime == 0 && recordedAudioMax == 0) {
      // need to alert that user trying to export empty buffer
      this.mp3ExportButton.disabled = false;
      this.mp3ExportIcon.classList.remove("icn-spinner");
      window.alert("You are trying to export an empty audio file!");
      return;
    }

    maxArrTime =
      this.maxTime > recordedAudioMax ? this.maxTime : recordedAudioMax;

    // Get the output buffer (which is an array of datas) with the right number of channels and size/duration
    layeredAudio = this.audioContext.createBuffer(1, 48000 * maxArrTime, 48000);

    for (let i = 0; i < this.exportBuffers.length; ++i) {
      let output = layeredAudio.getChannelData(0);
      let inputBuffer = this.exportBuffers[i].buffer.getChannelData(0);
      for (let bytes = 0; bytes < inputBuffer.length; ++bytes) {
        output[bytes] += inputBuffer[bytes];
      }
    }

    // overlay the recorded audio into output buffer for exporting if exists
    if (recordedAudioMax > 0) {
      let recordedAudioBytes =
        this.rapWheel.recordedBufferSourceExport.buffer.getChannelData(0);
      let output = layeredAudio.getChannelData(0);
      for (
        let recordedBytes = 0;
        recordedBytes < recordedAudioBytes.length;
        ++recordedBytes
      ) {
        output[recordedBytes] += recordedAudioBytes[recordedBytes];
      }
    }
    this.encoder = new Mp3LameEncoder(48000, 128);

    doubleArray = [
      layeredAudio.getChannelData(0),
      layeredAudio.getChannelData(0),
    ];
    const encodingPromise = new Promise((resolve, reject) => {
      this.encoder.encode(doubleArray);
      resolve("Encoding complete.");
    });

    // Download once finished
    encodingPromise
      .then((value) => {
        console.log(value);
        let mp3Blob = this.encoder.finish();
        let blobURL = URL.createObjectURL(mp3Blob);
        let element = document.createElement("a");

        element.href = blobURL;
        element.setAttribute("download", globals.currentProjectName);
        element.style.display = "none";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        this.mp3ExportButton.disabled = false;
        this.mp3ExportIcon.classList.remove("icn-spinner");
      })
      .catch((error) => {
        console.log(error);
        this.mp3ExportButton.disabled = false;
        this.mp3ExportIcon.classList.remove("icn-spinner");
      });
  }

  /**
   * Creates a project string object used for project saves and exports
   *
   * @returns {string} The string object
   */
  generateProjectString() {
    let output = "rw v0.0.2\n";
    let data = {};
    data["title"] = document.getElementById(cloudUI.projectNameField).value;
    data["tempo"] = globals.bpm;
    data["wheelCount"] = this.wheelsContainer.wheelCount;
    data["wheels"] = [];
    for (let i = 0; i < this.wheelsContainer.wheelCount; i++) {
      let wheel = {};
      wheel["size"] = this.wheelsContainer.wheels[i].nodeCount;
      wheel["loop"] = this.wheelsContainer.wheels[i].loopCount;
      wheel["nodes"] = [];
      for (let j = 0; j < this.wheelsContainer.wheels[i].nodeCount; j++) {
        wheel["nodes"].push(this.wheelsContainer.wheels[i].nodes[j].type);
      }
      data["wheels"].push(wheel);
    }
    data["audio"] = globals.outgoingAudio;
    data["audioStart"] = globals.startTime;
    data["audioEnd"] = globals.endTime;
    data["audioRepeat"] = this.rapWheel.loopCount;

    return output + JSON.stringify(data);
  }

  /**
   * Creates a project save object used with the cloud framework
   *
   */
  generateSaveObject() {
    saveObject = {
      project: this.generateProjectString(),
      image: 81702,
    };
  }
}
