/* eslint-disable prefer-const */
// has parsing for all previous versions
let parser = {};

parser.parse = function (opts, ref) {
  if (opts === undefined) {
    return alert("Could not parse: Undefined parameter");
  }
  if (opts.string === undefined) {
    return alert("Could not parse: Empty string");
  }

  let lines = opts.string.split("\n");

  if (parser[lines[0]] === undefined) {
    return alert("Could not parse: Unsupported version and/or invalid format");
  }

  parser[lines[0]](opts, ref, lines);
};

parser["rw v0.0.1"] = function (opts, ref, lines) {
  let stack = [];
  lines.forEach(function (line) {
    if (line == "" || /^rw v.*$/.test(line)) return;

    let lr = line.split(":");
    let lhs = lr[0].trim();
    let rhs = lr[1];

    if (stack[stack.length - 1] == "nodes") {
      if (
        stack[stack.length - 2] ==
        ref.wheelsContainer.wheels[stack[stack.length - 4]].nodeCount
      ) {
        stack.pop();
        stack.pop();
      } else {
        ref.wheelsContainer.wheels[stack[stack.length - 4]].nodes[
          stack[stack.length - 2]
        ].setType(line.trim());
        stack[stack.length - 2]++;
      }
    }

    if (stack[stack.length - 1] == "wheel") {
      switch (lhs) {
        case "size":
          ref.wheelsContainer.wheels[stack[stack.length - 2]].setNodeCount(
            parseInt(rhs)
          );
          break;
        case "loop":
          ref.wheelsContainer.wheels[stack[stack.length - 2]].setLoopCount(
            parseInt(rhs)
          );
          break;
        case "nodes":
          stack.push(0);
          stack.push("nodes");
          break;
        default:
          stack.pop();
          stack.pop();
          break;
      }
    }

    if (stack.length == 0) {
      switch (lhs) {
        case "title":
          ref.globals.title = rhs;
          break;

        case "tempo":
          ref.globals.bpm = parseFloat(rhs);
          document.getElementById(ref.appReferences.tempoSlider).value =
            Math.log10(ref.globals.bpm / 120);
          break;
        case "wheels":
          ref.wc.setWheelCount(parseInt(rhs));
          document.getElementById(ref.appReferences.numOfWheels).value =
            parseInt(rhs);
          break;

        case "wheel0":
          stack.push(0);
          stack.push("wheel");
          break;
        case "wheel1":
          stack.push(1);
          stack.push("wheel");
          break;
        case "wheel2":
          stack.push(2);
          stack.push("wheel");
          break;

        default:
          alert('Could not parse: Unknown parameter "' + lhs + '"');
          return;
      }
    }
  });
};

parser["rw v0.0.2"] = function (opts, ref, lines) {
  let data = JSON.parse(lines[1]);

  globals.currentProjectName = data["title"];
  document.getElementById(cloudUI.projectNameField).value =
    globals.currentProjectName;
  document.getElementById(cloudUI.projectNameField).innerHTML =
    globals.currentProjectName;

  globals.bpm = data["tempo"];

  document.getElementById(appReferences.tempoSlider).value = Math.log10(
    globals.bpm / 120
  );

  rw.wheelsContainer.setVisibleWheelCount(data["wheelCount"]);

  for (let i = 0; i < data["wheelCount"]; i++) {
    let wheel = data["wheels"][i];

    rw.wheelsContainer.wheels[i].setNumOfBeats(wheel["size"]);
    rw.wheelsContainer.wheels[i].setLoopCount(wheel["loop"]);

    for (let j = 0; j < wheel["size"]; j++) {
      rw.wheelsContainer.wheels[i].nodes[j].setNodeType(wheel.nodes[j]);
    }
  }
  globals.outgoingAudio = data["audio"] ? data["audio"] : "";
  globals.startTime = data["audioStart"];
  globals.endTime = data["audioEnd"];
};
