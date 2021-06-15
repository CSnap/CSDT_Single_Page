const maxNumOfBeats = 16;

function WheelsContainer() {
  this.init();
  this.createWheels(3);
}

// Creates the wheels container. Generates the wheels desired.
WheelsContainer.prototype.init = function () {
  this.domelement = document.getElementById(constants.wheels_container_id);
  this.wheels = [];
  this.wheelCount = 1;
  this.spacers = [];
  this.rapWheel = new RecordedAudioContainer();
};

// Generates the wheels
WheelsContainer.prototype.createWheels = function (num) {
  for (let i = 0; i < num; i++) {
    let newWheel = new Wheel(this.wheels.length);
    this.wheels.push(newWheel);

    // required for equally spacing the wheels
    let spacer = document.createElement("span");
    spacer.innerText = "\xa0";
    this.spacers.push(spacer);

    this.domelement.appendChild(newWheel.container);
    this.domelement.appendChild(spacer);
  }
};

// Sets the visible wheel count
WheelsContainer.prototype.setWheelCount = function (wheelCount) {
  this.wheelCount = wheelCount;

  // inactive wheels are just hidden
  for (let i = 0; i < wheelCount; i++) {
    this.wheels[i].container.style.display = "flex";
    this.spacers[i].style.display = "inline";
  }

  for (i = wheelCount; i < this.wheels.length; i++) {
    this.wheels[i].container.style.display = "none";
    this.spacers[i].style.display = "none";
  }

  // Not a good fix for the weird wheel container height increase with only wheel, but this works for now..
  if (wheelCount == 1) {
    this.spacers[0].style.display = "none";
  }

  //this.domelement.style.width = 270 * wheelCount - 20 + 'px';
  this.domelement.style.width = "100%";
};

// Pushes an update to each wheel in the wheel container.
WheelsContainer.prototype.update = function () {
  // update the recorded audio Wheel
  this.rapWheel.update();

  for (let i = 0; i < this.wheels.length; i++) {
    this.wheels[i].update();
  }
};

class Wheel {
  constructor(wheelID) {
    this.wheelID = wheelID;
    this.currentNode = "";
    this.nodeCount = 4;
    this.rotation = 0;
    this.isPlaying = false;
    this.loopCount = 1;

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
  createWheelContainer() {
    // Create the container and assign it a class
    this.container = document.createElement("div");
    this.container.classList.add(constants.wheelContainer_class);

    // Create the header and assign the wheel a generic wheel title
    this.header = document.createElement("h4");
    this.header.innerHTML = `Wheel ${this.wheelID + 1}:`;

    // Throw the header into the container
    this.container.appendChild(this.header);
  }

  /**
   * Creates the controls for the wheel. Controls appear in the sidebar.
   */
  createWheelControls() {
    //	Create the actual control panel and give it a class
    this.controlPanel = document.createElement("div");
    this.controlPanel.classList.add("control-div");

    // Create the header for the panel, give it a title, and a class.
    this.controlHeader = document.createElement("h4");
    this.controlHeader.innerHTML = `Wheel ${this.wheelID + 1}:`;
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
    for (let i = 1; i <= maxNumOfBeats; i++) {
      const option = document.createElement("option");
      option.classList.add(constants.loop_length_option_class);
      option.innerText = i;
      option.value = i;

      this.beatCountSelect.appendChild(option);
      beatCountOptions.push(option);
    }

    //Add event listener to the select that will halt the application, and set the number of beats in the wheel
    $(this.beatCountSelect).on("change", (e) => {
      interrupt();
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
    this.repeatInput.classList.add("wheel_repeat_input");

    // Add event listener to prevent user from entering anything other than a number -- Not sure if this is really needed since the type is now a number...
    this.repeatInput.addEventListener("keypress", (event) => {
      if (!isFinite(event.key)) {
        event.preventDefault();
        return false;
      }
    });

    // Add event listener to halt the application, then update the number of repeats for the wheel.
    this.repeatInput.addEventListener("keyup", () => {
      interrupt();
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
    this.wheel.classList.add(constants.wheel_class);

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
        activeBuffers[this.wheelID].stop();
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

// Things to do later: Terminology change between nodes, sound tiles, etc. Kind of confusing..
