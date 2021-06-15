/* eslint-disable prefer-const */
// has parsing for all previous versions
let parser = {};

parser.parse = function(opts, ref) {
  if (opts === undefined) {
    return alert('Could not parse: Undefined parameter');
  }
  if (opts.string === undefined) {
    return alert('Could not parse: Empty string');
  }

  let lines = opts.string.split('\n');

  if (parser[lines[0]] === undefined) {
    return alert(
        'Could not parse: Unsupported version and/or invalid format'
    );
  }

  parser[lines[0]](opts, ref, lines);
};

parser['rw v0.0.1'] = function(opts, ref, lines) {
  let stack = [];
  lines.forEach(function(line) {
    if (line == '' || /^rw v.*$/.test(line)) return;

    let lr = line.split(':');
    let lhs = lr[0].trim();
    let rhs = lr[1];

    if (stack[stack.length - 1] == 'nodes') {
      if (stack[stack.length - 2] ==
        ref.wc.wheels[stack[stack.length - 4]].nodeCount) {
        stack.pop();
        stack.pop();
      } else {
        ref.wc.wheels[stack[stack.length - 4]]
            .nodes[stack[stack.length - 2]].setType(line.trim());
        stack[stack.length - 2]++;
      }
    }

    if (stack[stack.length - 1] == 'wheel') {
      switch (lhs) {
        case 'size':
          ref.wc.wheels[stack[stack.length - 2]]
              .setNodeCount(parseInt(rhs));
          break;
        case 'loop':
          ref.wc.wheels[stack[stack.length - 2]]
              .setLoopCount(parseInt(rhs));
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

    if (stack.length == 0) {
      switch (lhs) {
        case 'title':
          ref.globals.title = rhs;
          break;

        case 'tempo':
          ref.globals.bpm = parseFloat(rhs);
          document.getElementById(ref.constants.tempo_slider_id).value =
            Math.log10(ref.globals.bpm / 120);
          break;
        case 'wheels':
          ref.wc.setWheelCount(parseInt(rhs));
          document.getElementById(ref.constants.num_wheels_id).value =
            parseInt(rhs);
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
          alert('Could not parse: Unknown parameter "' + lhs + '"');
          return;
      }
    }
  });
};

parser['rw v0.0.2'] = function(opts, ref, lines) {
  let data = JSON.parse(lines[1]);

  ref.globals.projectName = data['title'];
  document.getElementById(ref.constants.project_title).value =
    ref.globals.projectName;
  document.getElementById(constants.project_title_display).innerHTML =
    ref.globals.projectName;

  ref.globals.bpm = data['tempo'];
  document.getElementById(ref.constants.tempo_slider_id).value =
    Math.log10(ref.globals.bpm / 120);

  ref.wc.setWheelCount(data['wheelCount']);

  for (let i = 0; i < data['wheelCount']; i++) {
    let wheel = data['wheels'][i];

    ref.wc.wheels[i].setNodeCount(wheel['size']);
    ref.wc.wheels[i].setLoopCount(wheel['loop']);

    for (let j = 0; j < wheel['size']; j++) {
      ref.wc.wheels[i].nodes[j].setType(wheel.nodes[j]);
    }
  }
  ref.globals.incomingAudio = data['audio'] ? data['audio'] : '';
  ref.globals.startTime = data['audioStart'];
  ref.globals.endTime = data['audioEnd'];
};
