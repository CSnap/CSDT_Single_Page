/**
 * Contains the core logic of the sound tiles and palette
 *
 * @author Andrew Hunn
 *
 */

class SoundTile {
  constructor(opts) {
    this.opts = opts;
    this.type = opts.type;

    this.createSoundTileContainer();
    this.createSoundTile();
    this.assembleSoundTile();
    this.createSoundTileClone();

    this.attachMouseDownListener();
  }

  // Create the container for the sound tile
  createSoundTileContainer() {
    this.container = document.createElement("div");
    this.container.classList.add(constants.sound_tile_class);
  }

  // Create the sound tile components
  createSoundTile() {
    this.tileBase = document.createElement("div");
    this.tileBase.classList.add("sound-tile-base");

    this.tileSprite = document.createElement("img");
    this.tileSprite.setAttribute("src", sounds[this.type].icon);
    this.tileSprite.classList.add("sound-tile-image");

    this.tileLabel = document.createTextNode(sounds[this.type].name);
  }

  // Assemble the sound tile
  assembleSoundTile() {
    this.tileBase.appendChild(this.tileSprite);
    this.container.appendChild(this.tileBase);
    this.container.appendChild(this.tileLabel);
  }

  //   Create the sound tile clone for dragging
  createSoundTileClone() {
    this.draggableSoundTileBase = this.tileBase.cloneNode(true);
    this.draggableSoundTileBase.classList.add("temp-sound-tile");
    document
      .getElementById("temporary_sounds")
      .appendChild(this.draggableSoundTileBase);
  }

  //   Set the cloned sound tile's style based on mouse state
  setTileBeingDragged(mouseEvent, isBeingDragged) {
    this.draggableSoundTileBase.style["display"] = isBeingDragged
      ? "block"
      : "none";
    this.draggableSoundTileBase.style["left"] = `${mouseEvent.clientX - 25}px`;
    this.draggableSoundTileBase.style["top"] = `${mouseEvent.clientY - 25}px`;
  }

  // Attach event listener to the sound tile
  attachMouseDownListener() {
    this.container.addEventListener("mousedown", (event) => {
      // When user clicks, sound plays
      let audioObj = new Audio(sounds[this.type].url);
      audioObj.play();
      this.setTileBeingDragged(event, true);
      flags.dragging = this;
      flags.dragFromNode = false;
      captureMouseEvents(event);
    });
  }
}

class SoundPalette {
  constructor(opts) {
    this.palette = document.getElementById(constants.sound_palette_id);
    this.categorySelector = document.getElementById(
      constants.sound_category_id
    );

    this.soundTiles = [];

    this.init(opts);
  }

  init(opts) {
    // Initialize the palette with the given library
    this.loadSoundLibrary(opts);

    //Attach event listener: on sound category change, update the sound palette library
    this.categorySelector.addEventListener("change", (event) => {
      this.loadSoundLibrary({ library: event.target.value });
    });
  }
  createNewSoundTile(opts) {
    const tile = new SoundTile(opts);
    this.soundTiles.push(tile);
    this.palette.appendChild(tile.container);
  }

  clearPalette() {
    this.soundTiles = [];
    this.palette.innerHTML = "";
  }

  loadSoundLibrary(opts) {
    this.clearPalette();
    libraries[opts.library].map((soundClip) => {
      this.createNewSoundTile({
        type: soundClip,
      });
    });
  }
}

class Node {
  constructor(opts) {
    this.parentWheel = opts.parent;
    this.type = opts.type;
    this.runOnce = "";
    this.radius = 100;
    this.rotation = 0;

    this.createNodeTile();
    this.setNodeType(this.type);
    this.addNodeBaseEventListeners();
  }

  // Create a sound tile
  createNodeTile() {
    this.tileBase = document.createElement("div");
    this.tileBase.classList.add("sound-tile-base", "wheel-sound-tile");
  }

  setNodeType(type) {
    this.type = type;

    if (this.tileBase.hasChildNodes()) {
      this.tileBase.removeChild(this.tileBase.lastChild);
    }

    this.tileSprite = document.createElement("img");
    this.tileSprite.setAttribute("src", sounds[this.type].icon);
    this.tileSprite.classList.add("sound-tile-image");
    this.addTileSpriteEventListeners();

    this.tileBase.appendChild(this.tileSprite);
  }

  addTileSpriteEventListeners() {
    if (!flags.dragFromNode) {
      this.tileSprite.addEventListener("drop", () => {
        this.tileBase.dispatchEvent(new DragEvent("drop"));
      });
    }
    this.tileSprite.addEventListener("dragover", () => {
      this.tileBase.dispatchEvent(new DragEvent("dragover"));
    });
  }

  addNodeBaseEventListeners() {
    this.tileBase.addEventListener("mousedown", (event) => {
      flags.dragging = _self;
      flags.dragFromNode = true;
    });

    this.tileBase.addEventListener("drop", () => {
      interrupt();
      this.setNodeType(flags.dragging.type);
      flags.dragging = null;
    });
    this.tileBase.addEventListener("dragover", (event) => {
      event.preventDefault();
    });
  }

  setHighlighted(isHighlighted) {
    if (isHighlighted) {
      this.tileBase.style["background-image"] = "url(./img/base-inverted.png)";
    } else {
      this.tileBase.style["background-image"] = "url(./img/base.png)";
    }
  }

  update() {
    this.parentRect = this.parentWheel.container.getBoundingClientRect();
    this.x =
      (this.parentRect.left + this.parentRect.right) / 2 + window.scrollX;
    this.y =
      (this.parentRect.bottom + this.parentRect.top) / 2 + window.scrollY + 50;

    this.tileBase.style.left = this.x + "px";
    this.tileBase.style.top = this.y - this.radius + "px";

    this.tileBase.style["transform-origin"] = "0 " + this.radius + "px";

    this.offset = 10 * this.parentWheel.nodeCount + 85;

    this.scale = 1;
    if (this.parentWheel.nodeCount > 8) {
      this.scale = 1 - this.parentWheel.nodeCount / 20 + 0.4;
    } else {
      this.scale = 1;
    }

    // translate to correct for offset
    this.tileBase.style["transform"] =
      "scale(" +
      this.scale +
      ") rotate(" +
      this.rotation +
      "rad) translate(-25px, " +
      this.offset +
      "px)";
  }
}

// TODO There should be a super sound tile class that the wheel tiles utilize.
// TODO There are a few instances of code that can be reused (creating a tile, event listeners, etc.)
