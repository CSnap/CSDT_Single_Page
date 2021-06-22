window.AudioContext = window.AudioContext || window.webkitAudioContext;
let superAudioContext = new AudioContext();

class RhythmWheels {
  constructor(opts) {
    // Loads sounds (support for older projects)
    if (opts === undefined) opts = {};
    if (opts.sounds !== undefined) sounds = opts.sounds;

    this.init();
  }

  init() {
    // keep a list of active sounds so they can be aborted when stopped while playing (compiling audio)
    this.exportBuffers = [];
    this.recordedBufferSource;
    this.recordedBufferSourceExport;
    this.maxTime;
    this.audioRec = "";
    this.audioChunks = [];
    this.recordedAudioArray = [];

    this.isCurrentlyPlaying = false;
    this.activeBuffers = [];
    this.bpmRate;
    // Set the amount of seconds per beat
    this.secondsPerBeat = 60.0 / globals.bpm;
    // Create the containers for the interactive components
    this.soundPalette = new SoundPalette({
      library: "HipHop",
    });

    // Create the wheels container, then establishes an initial configuration for the wheels.
    this.wheelsContainer = new WheelsContainer();
    this.wheelsContainer.initWheels(defaultWheels);

    //Add rap wheel to rhythm wheels for quick refernce.
    this.rapWheel = this.wheelsContainer.rapWheel;

    // Create the application's audio context
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = superAudioContext;

    // Create the sound tile's buffers
    this.initSoundTileBuffers();

    //Since this is an instance of rhythm wheels, set the event listeners for the buttons and input
    this.addLayoutEventListeners();

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
   * Initializes the audio buffers that the sound tiles will reference for playback.
   */
  initSoundTileBuffers() {
    // Grab the keys to iterate through the objects
    this.keys = Object.keys(sounds);

    // Create and set each audio buffer
    for (let j = 0; j < this.keys.length; j++) {
      this.createSoundTileAudioBuffer(
        sounds[this.keys[j]].url,

        (res, err) => {
          if (err) {
            console.error("[!] Error loading sound: " + this.keys[j]);
            return;
          }
          sounds[this.keys[j]].buffer = res.buffer;
        }
      );
    }

    // Throw a log message to verify that the buffers are ready.
    console.log("Sound tile buffers have been created.");
  }

  /**
   * Creates the 'audio buffer' that is attached to the sound. Used for caching.
   *
   * @param {string} soundURL The sound url that can be found in the catalogue
   * @param {function} res The response function that will be called with the sound url get request.
   */
  createSoundTileAudioBuffer(soundURL, res) {
    const myself = this;
    let request = new XMLHttpRequest();
    request.open("GET", soundURL, true);
    request.responseType = "arraybuffer";
    request.onload = () => {
      let success = (buffer) => {
        res({
          buffer: buffer,
        });
      };

      let error = (err) => {
        res(null, err);
      };

      myself.audioContext.decodeAudioData(request.response, success, error);
    };

    request.send();
  }

  /**
   * Playback the audio.
   */
  playRhythm() {
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

  // TODO
  addLayoutEventListeners() {
    this.playButton = document.getElementById(appReferences.playButton);
    this.stopButton = document.getElementById(appReferences.stopButton);
    this.mp3ExportButton = document.getElementById(
      appReferences.mp3ExportButton
    );
    this.tempoSlider = document.getElementById(appReferences.tempoSlider);

    // Play the rhythm
    this.playButton.addEventListener("click", () => this.playRhythm());

    // Stop the rhythm
    this.stopButton.addEventListener("click", () => this.stopRhythm());

    // Export as an MP3
    this.mp3ExportButton.addEventListener("click", () => this.mp3Export());

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

    $(`#${appReferences.localFileImport}`).on("change", (e) => {
      let file = e.target.files[0];
      if (!file) {
        return;
      }
      readSingleFile(e);
    });
  }

  // TODO
  /**
   * Creates an MP3 based on the user's project
   *
   * Step 1: 1. compile- put the wheels' audio into the this.activeBuffers array
   * Step 2: iterate through each of the this.activeBuffers, add to the 'output' buffer which will have the layered audio
   * Step 3: then encode the final array
   */
  mp3Export() {
    let myself = this;

    globals.loadingText.id = "loadingshow";
    globals.mp3_text.id = "mp3hide";

    // clear existing export buffers
    let projectName = document.getElementById(cloudUI.projectNameField).value;
    myself.recordedBufferSourceExport = "";
    exportBuffers = [];

    // compile audio data from rhythm wheels and recording
    myself.compileAudio(true);
    myself.recordedAudioBufferFill(
      myself.wheelsContainer.rapWheel.loopCount,
      true
    );
    let recordedAudioMax =
      myself.wheelsContainer.rapWheel.loopCount * globals.recordAudioDuration;

    // first, check if there is any audio to export (will it be an empty mp3 file)
    if (this.maxTime == 0 && recordedAudioMax == 0) {
      // need to alert that user trying to export empty buffer
      globals.loadingText.id = "loadinghide";
      globals.mp3_text.id = "mp3show";
      window.alert("You are trying to export an empty audio file!");
      return;
    }
    let maxArrTime =
      this.maxTime > recordedAudioMax ? this.maxTime : recordedAudioMax;
    // Get the output buffer (which is an array of datas) with the right number of channels and size/duration
    let layeredAudio = myself.audioContext.createBuffer(
      1,
      48000 * maxArrTime,
      48000
    );
    for (let i = 0; i < exportBuffers.length; ++i) {
      let output = layeredAudio.getChannelData(0);
      let inputBuffer = exportBuffers[i].buffer.getChannelData(0);
      for (let bytes = 0; bytes < inputBuffer.length; ++bytes) {
        output[bytes] += inputBuffer[bytes];
      }
    }
    // overlay the recorded audio into output buffer for exporting if exists
    if (recordedAudioMax > 0) {
      let recordedAudioBytes =
        myself.recordedBufferSourceExport.buffer.getChannelData(0);
      let output = layeredAudio.getChannelData(0);
      for (
        let recordedBytes = 0;
        recordedBytes < recordedAudioBytes.length;
        ++recordedBytes
      ) {
        output[recordedBytes] += recordedAudioBytes[recordedBytes];
      }
    }
    encoder = new Mp3LameEncoder(48000, 128);
    let doubleArray = [
      layeredAudio.getChannelData(0),
      layeredAudio.getChannelData(0),
    ];
    const promise1 = new Promise((resolve, reject) => {
      encoder.encode(doubleArray);
      resolve(encoder);
    });

    // Download once finished
    promise1
      .then((value) => {
        let newblob = encoder.finish();
        globals.loadingText.id = "loadinghide";
        globals.mp3_text.id = "mp3show";
        let blobURL = URL.createObjectURL(newblob);
        let link = document.createElement("a");
        link.href = blobURL;
        link.setAttribute("download", projectName);
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((error) => console.log(error));
  }

  // // TODO
  // /**
  //  * Takes in a blob containing the user's recorded audio attached to a .rw file.
  //  * @param {*} userAudioBlob
  //  */
  // handleSavedAudio(userAudioBlob) {
  //   let myself = this;

  //   this.audioChunks = [];
  //   this.recordedAudioArray = [];
  //   this.audioRec = "";

  //   $(`#${appReferences.recordedAudio}`).attr("autoplay", false);

  //   if (userAudioBlob != "") {
  //     let end = globals.endTime;
  //     let start = globals.startTime;
  //     let blob = userAudioBlob;

  //     $(`#${appReferences.recordedAudio}`).attr("src", URL.createObjectURL(blob));

  //     globals.recordAudioDuration = (end - start) / 1000;

  //     blob.arrayBuffer().then((buffer) => {
  //       this.audioContext.decodeAudioData(
  //         buffer,
  //         function (audioBuf) {
  //           myself.recordedAudioArray.push(audioBuf);
  //           // make rapWheel visible
  //           let rapWheel = document.getElementById(appReferences.recordingWheelContainer);
  //           $("#audioWheelParent").removeClass("d-none");
  //           rapWheel.style.display = "block";
  //         },
  //         function (e) {
  //           console.log("ERROR WITH DECODING RECORDED AUDIO: " + e);
  //         }
  //       );
  //     });
  //   } else {
  //     let rapWheel = document.getElementById(appReferences.recordingWheelContainer);
  //     rapWheel.style.display = "none";
  //     $(`#${appReferences.recordedAudio}`).attr("src", "");
  //   }
  // }

  // TODO Refactor this
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
    return output + JSON.stringify(data);
  }

  generateSaveObject() {
    saveObject = {
      project: this.generateProjectString(),
      image: 81702,
    };
  }
}
