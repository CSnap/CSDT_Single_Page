import {FlowNode} from '../ui/FlowNode.js';

/**
* A synthesizer module that combines different frequencies
* @return {*} Returns null if error
*/
function FourierSynth() {
    FlowNode.call(this, 3, 4);

    if (window.Tone === undefined) {
        console.error('Error: Module FourierSynth requires Tone.js!');
        return null;
    }

    this.levels = 5;
    this.fundamentalFreq = 440;
    this.partials = [0, 0, 0, 0, 0];

    this.isPlaying = false;
    this.osc = null;
    this.audioNodeOut = null;

    this.visualization = $('<div></div>');

    this.waveSum = $('<div></div>');
    this.waveSum.attr('id', 'wave_sum_' + this.uid);
    this.waveSum.css({
        'background-color': 'white',
    });
    this.visualization.append(this.waveSum);

    // this.wavePartials = $('<div></div>');
    // this.visualization.append(this.wavePartials);

    let self_ = this;

    this.controls = $('<div></div>');
    this.controls.css({
        'text-align': 'center',
    });

    let fundamentalFreq = $('<div></div>');
    let ffLabel = $('<span>Fundamental Frequency: </span>');
    let ffText = $('<input type="text" value=' + this.fundamentalFreq + ' />');
    ffText.on('input', () => {
        this.fundamentalFreq = parseFloat(ffText.val());
        this.draw();
        this.stop();
    });
    fundamentalFreq.append(ffLabel);
    fundamentalFreq.append(ffText);
    this.controls.append(fundamentalFreq);

    this.partialControls = [];
    for (let i = 0; i < this.levels; i++) {
        let control = $('<div></div>');
        let label = null;
        if (i == 0) {
            label = $('<span>F</span>');
        } else {
            label = $('<span>H' + i + '</span>');
        }
        let slider = $('<input type="range" min=-1 max=1 step=0.01 value=0 />');

        ((i_) => { // capturing i
            slider.on('input', () => {
                self_.partials[i_] = parseFloat(slider.val());
                self_.draw();
                if (self_.isPlaying) self_.start();
            });
        })(i);

        control.append(label);
        control.append(slider);

        this.controls.append(control);

        this.partialControls.push(control);
    }

    this.startButton = $('<input type="button" value="Start">');
    this.startButton.on('click', () => {
        if (this.isPlaying) {
            self_.stop();
        } else {
            self_.start();
        }
    });

    this.controls.append(this.startButton);

    let jqo = this.getContent();
    jqo.css({
        'overflow-x': 'hidden',
        'padding': '10px',
    });
    jqo.append('<h2>Fourier Synth</h2>');
    jqo.append(this.visualization);
    jqo.append(this.controls);

    this.setContent(jqo);

    this.addPort('lb', 11, 'freq. in');
    let portOut = this.addPort('rb', 1, 'out');
    portOut.onConnectOut = function(args) {
        self_.audioNodeOut = args.audioNode;
    };
}

FourierSynth.prototype = Object.create(FlowNode.prototype);
FourierSynth.prototype.constructor = FourierSynth;

FourierSynth.prototype.draw = function() {
    let self_ = this;
    let drawPlot = function(fn) {
        functionPlot({
            target: '#wave_sum_' + self_.uid,
            width: self_.getContent().width(),
            height: 150,
            disableZoom: true,
            xAxis: {
                label: 'time (ms)',
                domain: [0, 1000 / self_.fundamentalFreq],
            },
            yAxis: {
                label: 'amplitude',
                domain: [-1, 1],
            },
            grid: true,
            data: [{
                fn: fn,
            }],
        });
    };

    // sum
    let sumFun = [];
    for (let i = 0; i < this.partials.length; i++) {
        sumFun.push(this.partials[i] + ' * sin('
            + (0.002 * this.fundamentalFreq * (i + 1))
            + ' * PI * x)');
    }
    sumFun = sumFun.join(' + ');

    this.waveSum.empty();
    drawPlot(sumFun);

    // partials
};

FourierSynth.prototype.start = function() {
    if (this.isPlaying) this.stop();
    this.osc = new Tone.OmniOscillator(this.fundamentalFreq, 'sine');
    this.osc.partials = this.partials;
    this.osc.connect(this.audioNodeOut);
    this.osc.start();

    this.isPlaying = true;
    this.startButton.val('Stop');
};

FourierSynth.prototype.stop = function() {
    if (this.isPlaying) {
        this.osc.stop();
        this.osc.dispose();
    }

    this.isPlaying = false;
    this.startButton.val('Start');
};

export {FourierSynth};
