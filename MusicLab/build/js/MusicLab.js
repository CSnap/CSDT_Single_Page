var MusicLab = (function (exports) {
'use strict';

// External Imports: Tone.js

/**
 * Provides an interface with Tone.js
 */
function Synthesizer() {
    this.synth = new Tone.Synth().toMaster();
}

Synthesizer.prototype.test = function() {
    let _self = this;
    let loop0 = function(time) {
        _self.synth.triggerAttackRelease('C4', '4n', time + 0);
        _self.synth.triggerAttackRelease('Eb4', '4n', time + 0.5);
        _self.synth.triggerAttackRelease('G4', '4n', time + 1);
        _self.synth.triggerAttackRelease('Bb4', '4n', time + 1.5);
        _self.synth.triggerAttackRelease('C4', '4n', time + 2);
        _self.synth.triggerAttackRelease('Eb4', '4n', time + 2.5);
        _self.synth.triggerAttackRelease('G4', '4n', time + 3);
        _self.synth.triggerAttackRelease('Bb4', '4n', time + 3.5);
    };

    Tone.Transport.schedule(loop0, 0);
    Tone.Transport.loopEnd = '1m';
    Tone.Transport.loop = true;

    Tone.Transport.start();
};

/**
* An abstract class for handling integration with HTML
*
* External dependencies: jQuery
*/
function UIElement() {
    this.isUIElement = true;

    this.jQueryObject = null;
    this.contentContainer = null;

    this.uid = UIElement.uid++;
}

UIElement.uid = 0;
UIElement.lookup = {};

UIElement.lookupByUid = function(uid) {
    return UIElement.lookup[uid];
};

/**
* Sets content to a jQuery object
* @param {jQuery} element a jQuery object
*/
UIElement.prototype.setContent = function(element) {
    this.jQueryObject = element;

    UIElement.lookup[this.uid] = this;
    this.jQueryObject.attr('uid', this.uid);
};

/**
* Injects content into a jQuery object
* @param {jQuery | UIElement} element jQuery object to inject content into
*/
UIElement.prototype.injectContent = function(element) {
    if (this.jQueryObject == null) {
        console.error('Error: Content not set!');
        return;
    }

    if (element.isUIElement) {
        element.jQueryObject.append(this.jQueryObject);
        this.contentContainer = element.jQueryObject;
    } else if (element instanceof jQuery) {
        element.append(this.jQueryObject);
        this.contentContainer = element;
    } else {
        console.error('Error: Invalid type (element)!');
    }
};

/**
* Removes the UIElement from the document
*/
UIElement.prototype.removeContent = function() {
    this.jQueryObject.remove();
    delete UIElement.lookup[this.uid];
};

/**
* Returns the associated jQuery Object
* @return {jQuery}
*/
UIElement.prototype.getContent = function() {
    return this.jQueryObject;
};

UIElement.prototype.getContentContainer = function() {
    return this.contentContainer;
};

/**
* A synthesizer module that combines different frequencies
* @return {*} Returns null if error
*/
function FourierSynth() {
    UIElement.call(this);

    if (window.Tone === undefined) {
        console.error('Error: Module FourierSynth requires Tone.js!');
        return null;
    }

    this.levels = 5;
    this.fundamentalFreq = 440;
    this.partials = [0, 0, 0, 0, 0];

    this.isPlaying = false;
    this.osc = null;

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
        let slider = $('<input type="range" min=0 max=1 step=0.01 value=0 />');

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

    let jqo = $('<div></div>');
    jqo.css({
        'width': '400px',
        'overflow-x': 'hidden',
        'padding': '10px',
        'border-radius': '10px',
        'background-color': 'white',
    });
    jqo.append(this.visualization);
    jqo.append(this.controls);

    this.setContent(jqo);
}

FourierSynth.prototype = Object.create(UIElement.prototype);
FourierSynth.prototype.constructor = FourierSynth;

FourierSynth.prototype.draw = function() {
    let self_ = this;
    let drawPlot = function(fn) {
        functionPlot({
            title: 'Waveform',
            target: '#wave_sum_' + self_.uid,
            width: 400,
            height: 200,
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
    this.osc.toMaster();
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

/**
 * Shows commands depending on context
 * @param {jQuery} container jQuery element that contains this palette.
 */
function Palette(container) {
    UIElement.call(this);

    this.visible = false;

    // Menu for adding stuff
    this.palette = $('<div></div>');
    this.palette.addClass('flowpalette');
    this.palette.addClass('hidden');
    this.palette.css('width', '150px');
    this.palette.css('height', '150px');
    this.palette.css('position', 'absolute');

    let addFlowNode = $('<div></div>');
    addFlowNode.addClass('flowpaletteoption');
    addFlowNode.css('transform', 'translate(94.4px, 2.6px)');

    // let addFlowNode = $('<div></div>');
    // addFlowNode.addClass('flowpaletteoption');
    // addFlowNode.css('transform', 'translate(94.4px, 2.6px)');

    this.palette.append(addFlowNode);
    this.setContent(this.palette);

    this.container = container;

    let _self = this;
    this.palette.on('mouseleave', function() {
        _self.hide();
    });

    addFlowNode.on('click', function() {
        if (_self.handlers['add']) _self.handlers['add']();
    });
}

Palette.prototype = Object.create(UIElement.prototype);
Palette.prototype.constructor = Palette;

Palette.global = {};
/*
 * Returns global static palette from a container
 */
Palette.get = function(container) {
    if (Palette.global[container] === undefined) {
        Palette.global[container] = new Palette(container);
    }
    return Palette.global[container];
};

Palette.prototype.show = function(center, handlers) {
    if (!this.visible) {
        this.injectContent(this.container);
        this.visible = true;
    }

    this.palette.removeClass('hidden');


    this.palette.css('left', center.x - 75);
    this.palette.css('top', center.y - 75);

    this.handlers = handlers;
};

Palette.prototype.hide = function() {
    this.palette.addClass('hidden');
};

/**
 * A track on which program instructions lie to create an intuitive linear
 * progression.
*/
function Track() {
    UIElement.call(this);
    this.isTrack = true;

    let jqo = $('<div></div>');
    jqo.css('width', '100%');
    jqo.css('display', 'inline-block');

    this.children = [];

    this.setContent(jqo);
}

Track.prototype = Object.create(UIElement.prototype);
Track.prototype.constructor = Track;

Track.prototype.addChild = function(child) {
    if (!child.isTrackElement) {
        console.error('Error: Invalid type for child');
        return;
    }

    this.children.push(child);

    child.parentTrack = this;
    child.injectContent(this);

    return child;
};

Track.prototype.addStart = function() {
    let start = new Track.StartNode(this);
    this.addChild(start);
};

Track.prototype.addSegment = function() {
    let newSegment = new Track.Segment(this);
    this.addChild(newSegment);
};

Track.prototype.fork = function(n) {
    if (n === undefined) n = 2;
    let fork = new Track.Fork(this, n);
    this.addChild(fork);
    return fork;
};

Track.prototype.run = function(delayIn) {
    if(delayIn === undefined) delayIn = 0;
    let delay = delayIn;
    for (let i = 0; i < this.children.length; i++) {
        if (this.children[i].isFlowNode) {
            delay = this.children[i].exec(delay);
        } else if (this.children[i].isTrackFork) {
            this.children[i].subTracks.forEach((track) => {
                track.run(delay);
            });
            break;
        }
    }
};

Track.Element = function(parentTrack) {
    UIElement.call(this);
    this.isTrackElement = true;

    this.parentTrack = parentTrack ? parentTrack : null;
};

Track.Element.prototype = Object.create(UIElement.prototype);
Track.Element.prototype.constructor = Track.Element;

Track.Element.prototype.getParent = function() {
    return this.parentTrack;
};

Track.Fork = function(parentTrack, n) {
    Track.Element.call(this, parentTrack);
    this.isTrackFork = true;

    this.subTracks = [];

    let jqo = $('<div></div>');
    jqo.css('text-align', 'center');

    let bar = $('<div></div>');
    bar.css('width', '50%');
    bar.css('height', '10px');
    bar.css('border-style', 'solid');
    bar.css('border-width', '0 5px 0 5px');
    bar.css('border-color', '#0A80DB');
    bar.css('margin', '0 auto');
    bar.css('background-color', '#0A80DB');
    jqo.append(bar);

    let containers = [];
    for (let i = 0; i < n; i++) {
        let container = $('<div></div>');
        container.css('display', 'inline-block');
        container.css('vertical-align', 'top');
        container.css('width', 100 / n + '%');
        containers.push(container);
        jqo.append(container);

        let track = new Track();
        this.subTracks.push(track);
        track.injectContent(container);
    }

    this.setContent(jqo);
};

Track.Fork.prototype = Object.create(Track.Element.prototype);
Track.Fork.prototype.constructor = Track.Fork;

Track.StartNode = function(parentTrack) {
    Track.Element.call(this);

    let jqo = $('<div></div>');
    jqo.addClass('flowtrackstartnode');
    jqo.css('margin', '0 auto');

    jqo.on('click', function() {
        console.log('This will eventually compile and run the music (to reduce delays). Fow now, enjoy John Cage\'s 4:33');
    });

    this.setContent(jqo);
};

Track.StartNode.prototype = Object.create(Track.Element.prototype);
Track.StartNode.prototype.constructor = Track.StartNode;

Track.Segment = function(parentTrack) {
    Track.Element.call(this);

    this.parentTrack = parentTrack;

    let jqo = $('<div></div>');
    jqo.addClass('flowtrack');
    jqo.addClass('flowtracksegment');
    jqo.css('position', 'relative');
    jqo.css('margin', '0 auto');

    this.addBtn = $('<div></div>');
    this.addBtn.addClass('flowtracksegmentadd');
    this.addBtn.css('position', 'absolute');
    this.addBtn.css('z-index', '1');

    let addBtnHandler = function() {
        let f = new FlowNode();
        parentTrack.addChild(f);
        parentTrack.addSegment();
    };

    this.addBtn.on('click', (event) => {
        let offset = jqo.offset();
        Palette.get($('body')).show({
            x: offset.left + jqo.width() / 2,
            y: offset.top + jqo.height() / 2,
        }, {
            add: addBtnHandler,
        });
    });

    // jqo.append(this.addBtn); // disabling inline palette for now

    this.setContent(jqo);

    this.updateLayout();
};

Track.Segment.prototype = Object.create(Track.Element.prototype);
Track.Segment.prototype.constructor = Track.Segment;

Track.Segment.prototype.updateLayout = function() {
    let offset = this.getContent().offset();

    let x =
        offset.left + (this.getContent().width() - this.addBtn.width()) / 2;
    let y =
        offset.top + (this.getContent().height() - this.addBtn.height()) / 2;

    this.addBtn.css('left', x);
    this.addBtn.css('top', y);
};

/**
* A representation of a node within a program. Includes UI and other functions
* to integrate with the program as a whole
*
* External dependencies: jQueryUI
*
* @param {number=} width width of the node in units
* @param {number=} height height of the node in units
*/
function FlowNode(width, height) {
    Track.Element.call(this);
    this.isFlowNode = true;

    this.width = width !== undefined ? width : 1;
    this.height = height !== undefined ? height : 1;
    this.ports = [];

    let jqo = $('<div></div>');
    jqo.addClass('flownode');
    jqo.css('margin', '0 auto');

    this.setContent(jqo);

    this.setSize(this.width, this.height);

    this.exec = function(delayIn) {
        // do stuff
        let delayOut = delayIn;
        return delayOut;
    };
}

FlowNode.prototype = Object.create(Track.Element.prototype);
FlowNode.prototype.constructor = FlowNode;

FlowNode.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;

    this.getContent().css('width', 110 * width - 10);
    this.getContent().css('height', 110 * height - 10);
};

FlowNode.prototype.addPort = function(docking, offset, label) {
    let port = new FlowNode.Port(this, docking, offset, label);
    this.ports.push(port);
    return port;
};

/**
* @param {FlowNode} parent
* @param {string=} docking
* @param {number=} offset
* @param {string=} label
*/
FlowNode.Port = function(parent, docking, offset, label) {
    UIElement.call(this);
    this.isFlowNodePort = true;

    this.parent = parent;
    this.docking = docking !== undefined ? docking : 'tl';
    this.offset = offset !== undefined ? offset : 0;
    this.label = label !== undefined ? label : '';

    let jqo = $('<div></div>');
    jqo.addClass('flownodeport');
    jqo.css('position', 'absolute');
    this.setContent(jqo);

    this.injectContent(parent.getContent());
    this.updateLayout();

    let connector = null;
    let _self = this;
    jqo.on('mousedown', function(event) {
        event.originalEvent.stopPropagation();

        let r = _self.getContent()[0].getBoundingClientRect();
        let x = (r.left + r.right) / 2+ window.scrollX;
        let y = (r.top + r.bottom) / 2 + window.scrollY;

        connector = new FlowNode.Connector({x: x, y: y});
        connector.injectContent(_self.parent.getContentContainer());
    });

    let getNearbyPorts = function(clientX, clientY) {
        let nearby = [];
        $('.flownodeport').each((index, dom) => {
            let elem = $(dom);
            let r = elem[0].getBoundingClientRect();

            let cx = (r.left + r.right) / 2;
            let cy = (r.top + r.bottom) / 2;

            let d2 = Math.pow(cx - clientX, 2) + Math.pow(cy - clientY, 2);
            if (d2 < 100) nearby.push(UIElement.lookupByUid(elem.attr('uid')));
        });
        return nearby;
    };

    this.parent.getContentContainer().on('mousemove', (event) => {
        if (connector != null) {
            let x = event.originalEvent.clientX + window.scrollX;
            let y = event.originalEvent.clientY + window.scrollY;

            let np = getNearbyPorts(event.originalEvent.clientX,
                event.originalEvent.clientY);
                if (np.length > 0) {
                    let r = np[0].getContent()[0].getBoundingClientRect();
                    x = (r.left + r.right) / 2 + window.scrollX;
                    y = (r.top + r.bottom) / 2+ window.scrollY;
                }

                connector.setTarget({x: x, y: y});
                connector.updateLayout();
            }
        });

        this.parent.getContentContainer().on('mouseup', (event) => {
            if (connector != null) {
                let np = getNearbyPorts(event.originalEvent.clientX,
                    event.originalEvent.clientY);
                    if (np.length > 0) {
                        let r = np[0].getContent()[0].getBoundingClientRect();
                        let x = (r.left + r.right) / 2 + window.scrollX;
                        let y = (r.top + r.bottom) / 2 + window.scrollY;

                        let c = new FlowNode.Connector(connector.origin,
                            {x: x, y: y});
                        c.injectContent(_self.parent.getContentContainer());
                    }

                    connector.removeContent();
                    connector = null;
                }
            });
        };

        FlowNode.Port.prototype = Object.create(UIElement.prototype);
        FlowNode.Port.prototype.constructor = FlowNode.Port;

        FlowNode.Port.prototype.updateLayout = function() {
            switch (this.docking[0]) {
                case 't':
                this.getContent().css('top', 0);
                this.getContent().css('bottom', '');
                this.getContent().css('left', '');
                this.getContent().css('right', '');
                break;
                case 'b':
                this.getContent().css('top', '');
                this.getContent().css('bottom', 0);
                this.getContent().css('left', '');
                this.getContent().css('right', '');
                break;
                case 'l':
                this.getContent().css('top', '');
                this.getContent().css('bottom', '');
                this.getContent().css('left', 0);
                this.getContent().css('right', '');
                break;
                case 'r':
                this.getContent().css('top', '');
                this.getContent().css('bottom', '');
                this.getContent().css('left', '');
                this.getContent().css('right', 0);
                break;
                default:
                console.error(
                    'Invalid docking option \'' + this.docking + '\'!');
                return false;
            }

            let pixelOffset = 15 * (this.offset + 1);
            switch (this.docking[1]) {
                case 't':
                this.getContent().css('top', pixelOffset);
                break;
                case 'b':
                this.getContent().css('bottom', pixelOffset);
                break;
                case 'l':
                this.getContent().css('left', pixelOffset);
                break;
                case 'r':
                this.getContent().css('right', pixelOffset);
                break;
                default:
                console.error(
                    'Invalid docking option \'' + this.docking + '\'!');
                return false;
            }
        };

        /**
        *
        * @param {Object=} origin
        * @param {Object=} target
        */
        FlowNode.Connector = function(origin, target) {
            UIElement.call(this);
            this.isFlowNodeConnector = true;

            this.origin = origin !== undefined ? origin : {x: 0, y: 0};
            this.target = target !== undefined ? target : this.origin;

            let ns = 'http://www.w3.org/2000/svg';
            this.svg = document.createElementNS(ns, 'svg');

            this.rect = document.createElementNS(ns, 'rect');
            this.svg.appendChild(this.rect);

            let jqo = $(this.svg);
            jqo.css('position', 'absolute');
            this.setContent(jqo);

            this.updateLayout();
        };

        FlowNode.Connector.prototype = Object.create(UIElement.prototype);
        FlowNode.Connector.prototype.constructor = FlowNode.Connector;

        FlowNode.Connector.prototype.updateLayout = function() {
            this.svg.setAttributeNS(null, 'width',
            Math.abs(this.origin.x - this.target.x));
            this.svg.setAttributeNS(null, 'height',
            Math.abs(this.origin.y - this.target.y));

            this.rect.setAttributeNS(null, 'width',
            Math.abs(this.origin.x - this.target.x));
            this.rect.setAttributeNS(null, 'height',
            Math.abs(this.origin.y - this.target.y));
            this.rect.setAttributeNS(null, 'fill', '#f06');

            this.getContent()
                .css('left', Math.min(this.origin.x, this.target.x));
            this.getContent()
                .css('top', Math.min(this.origin.y, this.target.y));
        };

        FlowNode.Connector.prototype.setTarget = function(target) {
            this.target = target;
        };

exports.Synthesizer = Synthesizer;
exports.FourierSynth = FourierSynth;
exports.FlowNode = FlowNode;
exports.Track = Track;
exports.UIElement = UIElement;

return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXVzaWNMYWIuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY3JpcHRzL2F1ZGlvL1N5bnRoZXNpemVyLmpzIiwiLi4vLi4vc3JjL3NjcmlwdHMvdWkvVUlFbGVtZW50LmpzIiwiLi4vLi4vc3JjL3NjcmlwdHMvbW9kdWxlcy9Gb3VyaWVyU3ludGguanMiLCIuLi8uLi9zcmMvc2NyaXB0cy91aS9QYWxldHRlLmpzIiwiLi4vLi4vc3JjL3NjcmlwdHMvdWkvVHJhY2suanMiLCIuLi8uLi9zcmMvc2NyaXB0cy91aS9GbG93Tm9kZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBFeHRlcm5hbCBJbXBvcnRzOiBUb25lLmpzXG5cbi8qKlxuICogUHJvdmlkZXMgYW4gaW50ZXJmYWNlIHdpdGggVG9uZS5qc1xuICovXG5mdW5jdGlvbiBTeW50aGVzaXplcigpIHtcbiAgICB0aGlzLnN5bnRoID0gbmV3IFRvbmUuU3ludGgoKS50b01hc3RlcigpO1xufVxuXG5TeW50aGVzaXplci5wcm90b3R5cGUudGVzdCA9IGZ1bmN0aW9uKCkge1xuICAgIGxldCBfc2VsZiA9IHRoaXM7XG4gICAgbGV0IGxvb3AwID0gZnVuY3Rpb24odGltZSkge1xuICAgICAgICBfc2VsZi5zeW50aC50cmlnZ2VyQXR0YWNrUmVsZWFzZSgnQzQnLCAnNG4nLCB0aW1lICsgMCk7XG4gICAgICAgIF9zZWxmLnN5bnRoLnRyaWdnZXJBdHRhY2tSZWxlYXNlKCdFYjQnLCAnNG4nLCB0aW1lICsgMC41KTtcbiAgICAgICAgX3NlbGYuc3ludGgudHJpZ2dlckF0dGFja1JlbGVhc2UoJ0c0JywgJzRuJywgdGltZSArIDEpO1xuICAgICAgICBfc2VsZi5zeW50aC50cmlnZ2VyQXR0YWNrUmVsZWFzZSgnQmI0JywgJzRuJywgdGltZSArIDEuNSk7XG4gICAgICAgIF9zZWxmLnN5bnRoLnRyaWdnZXJBdHRhY2tSZWxlYXNlKCdDNCcsICc0bicsIHRpbWUgKyAyKTtcbiAgICAgICAgX3NlbGYuc3ludGgudHJpZ2dlckF0dGFja1JlbGVhc2UoJ0ViNCcsICc0bicsIHRpbWUgKyAyLjUpO1xuICAgICAgICBfc2VsZi5zeW50aC50cmlnZ2VyQXR0YWNrUmVsZWFzZSgnRzQnLCAnNG4nLCB0aW1lICsgMyk7XG4gICAgICAgIF9zZWxmLnN5bnRoLnRyaWdnZXJBdHRhY2tSZWxlYXNlKCdCYjQnLCAnNG4nLCB0aW1lICsgMy41KTtcbiAgICB9O1xuXG4gICAgVG9uZS5UcmFuc3BvcnQuc2NoZWR1bGUobG9vcDAsIDApO1xuICAgIFRvbmUuVHJhbnNwb3J0Lmxvb3BFbmQgPSAnMW0nO1xuICAgIFRvbmUuVHJhbnNwb3J0Lmxvb3AgPSB0cnVlO1xuXG4gICAgVG9uZS5UcmFuc3BvcnQuc3RhcnQoKTtcbn07XG5cbmV4cG9ydCB7U3ludGhlc2l6ZXJ9O1xuIiwiLyoqXG4qIEFuIGFic3RyYWN0IGNsYXNzIGZvciBoYW5kbGluZyBpbnRlZ3JhdGlvbiB3aXRoIEhUTUxcbipcbiogRXh0ZXJuYWwgZGVwZW5kZW5jaWVzOiBqUXVlcnlcbiovXG5mdW5jdGlvbiBVSUVsZW1lbnQoKSB7XG4gICAgdGhpcy5pc1VJRWxlbWVudCA9IHRydWU7XG5cbiAgICB0aGlzLmpRdWVyeU9iamVjdCA9IG51bGw7XG4gICAgdGhpcy5jb250ZW50Q29udGFpbmVyID0gbnVsbDtcblxuICAgIHRoaXMudWlkID0gVUlFbGVtZW50LnVpZCsrO1xufVxuXG5VSUVsZW1lbnQudWlkID0gMDtcblVJRWxlbWVudC5sb29rdXAgPSB7fTtcblxuVUlFbGVtZW50Lmxvb2t1cEJ5VWlkID0gZnVuY3Rpb24odWlkKSB7XG4gICAgcmV0dXJuIFVJRWxlbWVudC5sb29rdXBbdWlkXTtcbn07XG5cbi8qKlxuKiBTZXRzIGNvbnRlbnQgdG8gYSBqUXVlcnkgb2JqZWN0XG4qIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IGEgalF1ZXJ5IG9iamVjdFxuKi9cblVJRWxlbWVudC5wcm90b3R5cGUuc2V0Q29udGVudCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICB0aGlzLmpRdWVyeU9iamVjdCA9IGVsZW1lbnQ7XG5cbiAgICBVSUVsZW1lbnQubG9va3VwW3RoaXMudWlkXSA9IHRoaXM7XG4gICAgdGhpcy5qUXVlcnlPYmplY3QuYXR0cigndWlkJywgdGhpcy51aWQpO1xufTtcblxuLyoqXG4qIEluamVjdHMgY29udGVudCBpbnRvIGEgalF1ZXJ5IG9iamVjdFxuKiBAcGFyYW0ge2pRdWVyeSB8IFVJRWxlbWVudH0gZWxlbWVudCBqUXVlcnkgb2JqZWN0IHRvIGluamVjdCBjb250ZW50IGludG9cbiovXG5VSUVsZW1lbnQucHJvdG90eXBlLmluamVjdENvbnRlbnQgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKHRoaXMualF1ZXJ5T2JqZWN0ID09IG51bGwpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6IENvbnRlbnQgbm90IHNldCEnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChlbGVtZW50LmlzVUlFbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQualF1ZXJ5T2JqZWN0LmFwcGVuZCh0aGlzLmpRdWVyeU9iamVjdCk7XG4gICAgICAgIHRoaXMuY29udGVudENvbnRhaW5lciA9IGVsZW1lbnQualF1ZXJ5T2JqZWN0O1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIGpRdWVyeSkge1xuICAgICAgICBlbGVtZW50LmFwcGVuZCh0aGlzLmpRdWVyeU9iamVjdCk7XG4gICAgICAgIHRoaXMuY29udGVudENvbnRhaW5lciA9IGVsZW1lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6IEludmFsaWQgdHlwZSAoZWxlbWVudCkhJyk7XG4gICAgfVxufTtcblxuLyoqXG4qIFJlbW92ZXMgdGhlIFVJRWxlbWVudCBmcm9tIHRoZSBkb2N1bWVudFxuKi9cblVJRWxlbWVudC5wcm90b3R5cGUucmVtb3ZlQ29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMualF1ZXJ5T2JqZWN0LnJlbW92ZSgpO1xuICAgIGRlbGV0ZSBVSUVsZW1lbnQubG9va3VwW3RoaXMudWlkXTtcbn07XG5cbi8qKlxuKiBSZXR1cm5zIHRoZSBhc3NvY2lhdGVkIGpRdWVyeSBPYmplY3RcbiogQHJldHVybiB7alF1ZXJ5fVxuKi9cblVJRWxlbWVudC5wcm90b3R5cGUuZ2V0Q29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmpRdWVyeU9iamVjdDtcbn07XG5cblVJRWxlbWVudC5wcm90b3R5cGUuZ2V0Q29udGVudENvbnRhaW5lciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnRlbnRDb250YWluZXI7XG59O1xuXG5leHBvcnQge1VJRWxlbWVudH07XG4iLCJpbXBvcnQge1VJRWxlbWVudH0gZnJvbSAnLi4vdWkvVUlFbGVtZW50LmpzJztcblxuLyoqXG4qIEEgc3ludGhlc2l6ZXIgbW9kdWxlIHRoYXQgY29tYmluZXMgZGlmZmVyZW50IGZyZXF1ZW5jaWVzXG4qIEByZXR1cm4geyp9IFJldHVybnMgbnVsbCBpZiBlcnJvclxuKi9cbmZ1bmN0aW9uIEZvdXJpZXJTeW50aCgpIHtcbiAgICBVSUVsZW1lbnQuY2FsbCh0aGlzKTtcblxuICAgIGlmICh3aW5kb3cuVG9uZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOiBNb2R1bGUgRm91cmllclN5bnRoIHJlcXVpcmVzIFRvbmUuanMhJyk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHRoaXMubGV2ZWxzID0gNTtcbiAgICB0aGlzLmZ1bmRhbWVudGFsRnJlcSA9IDQ0MDtcbiAgICB0aGlzLnBhcnRpYWxzID0gWzAsIDAsIDAsIDAsIDBdO1xuXG4gICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcbiAgICB0aGlzLm9zYyA9IG51bGw7XG5cbiAgICB0aGlzLnZpc3VhbGl6YXRpb24gPSAkKCc8ZGl2PjwvZGl2PicpO1xuXG4gICAgdGhpcy53YXZlU3VtID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICB0aGlzLndhdmVTdW0uYXR0cignaWQnLCAnd2F2ZV9zdW1fJyArIHRoaXMudWlkKTtcbiAgICB0aGlzLndhdmVTdW0uY3NzKHtcbiAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAnd2hpdGUnLFxuICAgIH0pO1xuICAgIHRoaXMudmlzdWFsaXphdGlvbi5hcHBlbmQodGhpcy53YXZlU3VtKTtcblxuICAgIC8vIHRoaXMud2F2ZVBhcnRpYWxzID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICAvLyB0aGlzLnZpc3VhbGl6YXRpb24uYXBwZW5kKHRoaXMud2F2ZVBhcnRpYWxzKTtcblxuICAgIGxldCBzZWxmXyA9IHRoaXM7XG5cbiAgICB0aGlzLmNvbnRyb2xzID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICB0aGlzLmNvbnRyb2xzLmNzcyh7XG4gICAgICAgICd0ZXh0LWFsaWduJzogJ2NlbnRlcicsXG4gICAgfSk7XG5cbiAgICBsZXQgZnVuZGFtZW50YWxGcmVxID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBsZXQgZmZMYWJlbCA9ICQoJzxzcGFuPkZ1bmRhbWVudGFsIEZyZXF1ZW5jeTogPC9zcGFuPicpO1xuICAgIGxldCBmZlRleHQgPSAkKCc8aW5wdXQgdHlwZT1cInRleHRcIiB2YWx1ZT0nICsgdGhpcy5mdW5kYW1lbnRhbEZyZXEgKyAnIC8+Jyk7XG4gICAgZmZUZXh0Lm9uKCdpbnB1dCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5mdW5kYW1lbnRhbEZyZXEgPSBwYXJzZUZsb2F0KGZmVGV4dC52YWwoKSk7XG4gICAgICAgIHRoaXMuZHJhdygpO1xuICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICB9KTtcbiAgICBmdW5kYW1lbnRhbEZyZXEuYXBwZW5kKGZmTGFiZWwpO1xuICAgIGZ1bmRhbWVudGFsRnJlcS5hcHBlbmQoZmZUZXh0KTtcbiAgICB0aGlzLmNvbnRyb2xzLmFwcGVuZChmdW5kYW1lbnRhbEZyZXEpO1xuXG4gICAgdGhpcy5wYXJ0aWFsQ29udHJvbHMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGV2ZWxzOyBpKyspIHtcbiAgICAgICAgbGV0IGNvbnRyb2wgPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgICAgICBsZXQgbGFiZWwgPSBudWxsO1xuICAgICAgICBpZiAoaSA9PSAwKSB7XG4gICAgICAgICAgICBsYWJlbCA9ICQoJzxzcGFuPkY8L3NwYW4+Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYWJlbCA9ICQoJzxzcGFuPkgnICsgaSArICc8L3NwYW4+Jyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNsaWRlciA9ICQoJzxpbnB1dCB0eXBlPVwicmFuZ2VcIiBtaW49MCBtYXg9MSBzdGVwPTAuMDEgdmFsdWU9MCAvPicpO1xuXG4gICAgICAgICgoaV8pID0+IHsgLy8gY2FwdHVyaW5nIGlcbiAgICAgICAgICAgIHNsaWRlci5vbignaW5wdXQnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZl8ucGFydGlhbHNbaV9dID0gcGFyc2VGbG9hdChzbGlkZXIudmFsKCkpO1xuICAgICAgICAgICAgICAgIHNlbGZfLmRyYXcoKTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZl8uaXNQbGF5aW5nKSBzZWxmXy5zdGFydCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKGkpO1xuXG4gICAgICAgIGNvbnRyb2wuYXBwZW5kKGxhYmVsKTtcbiAgICAgICAgY29udHJvbC5hcHBlbmQoc2xpZGVyKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmFwcGVuZChjb250cm9sKTtcblxuICAgICAgICB0aGlzLnBhcnRpYWxDb250cm9scy5wdXNoKGNvbnRyb2wpO1xuICAgIH1cblxuICAgIHRoaXMuc3RhcnRCdXR0b24gPSAkKCc8aW5wdXQgdHlwZT1cImJ1dHRvblwiIHZhbHVlPVwiU3RhcnRcIj4nKTtcbiAgICB0aGlzLnN0YXJ0QnV0dG9uLm9uKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNQbGF5aW5nKSB7XG4gICAgICAgICAgICBzZWxmXy5zdG9wKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmXy5zdGFydCgpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmNvbnRyb2xzLmFwcGVuZCh0aGlzLnN0YXJ0QnV0dG9uKTtcblxuICAgIGxldCBqcW8gPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIGpxby5jc3Moe1xuICAgICAgICAnd2lkdGgnOiAnNDAwcHgnLFxuICAgICAgICAnb3ZlcmZsb3cteCc6ICdoaWRkZW4nLFxuICAgICAgICAncGFkZGluZyc6ICcxMHB4JyxcbiAgICAgICAgJ2JvcmRlci1yYWRpdXMnOiAnMTBweCcsXG4gICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ3doaXRlJyxcbiAgICB9KTtcbiAgICBqcW8uYXBwZW5kKHRoaXMudmlzdWFsaXphdGlvbik7XG4gICAganFvLmFwcGVuZCh0aGlzLmNvbnRyb2xzKTtcblxuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xufVxuXG5Gb3VyaWVyU3ludGgucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUVsZW1lbnQucHJvdG90eXBlKTtcbkZvdXJpZXJTeW50aC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGb3VyaWVyU3ludGg7XG5cbkZvdXJpZXJTeW50aC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uKCkge1xuICAgIGxldCBzZWxmXyA9IHRoaXM7XG4gICAgbGV0IGRyYXdQbG90ID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgZnVuY3Rpb25QbG90KHtcbiAgICAgICAgICAgIHRpdGxlOiAnV2F2ZWZvcm0nLFxuICAgICAgICAgICAgdGFyZ2V0OiAnI3dhdmVfc3VtXycgKyBzZWxmXy51aWQsXG4gICAgICAgICAgICB3aWR0aDogNDAwLFxuICAgICAgICAgICAgaGVpZ2h0OiAyMDAsXG4gICAgICAgICAgICBkaXNhYmxlWm9vbTogdHJ1ZSxcbiAgICAgICAgICAgIHhBeGlzOiB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICd0aW1lIChtcyknLFxuICAgICAgICAgICAgICAgIGRvbWFpbjogWzAsIDEwMDAgLyBzZWxmXy5mdW5kYW1lbnRhbEZyZXFdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHlBeGlzOiB7XG4gICAgICAgICAgICAgICAgbGFiZWw6ICdhbXBsaXR1ZGUnLFxuICAgICAgICAgICAgICAgIGRvbWFpbjogWy0xLCAxXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBncmlkOiB0cnVlLFxuICAgICAgICAgICAgZGF0YTogW3tcbiAgICAgICAgICAgICAgICBmbjogZm4sXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIHN1bVxuICAgIGxldCBzdW1GdW4gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucGFydGlhbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc3VtRnVuLnB1c2godGhpcy5wYXJ0aWFsc1tpXSArICcgKiBzaW4oJ1xuICAgICAgICAgICAgKyAoMC4wMDIgKiB0aGlzLmZ1bmRhbWVudGFsRnJlcSAqIChpICsgMSkpXG4gICAgICAgICAgICArICcgKiBQSSAqIHgpJyk7XG4gICAgfVxuICAgIHN1bUZ1biA9IHN1bUZ1bi5qb2luKCcgKyAnKTtcblxuICAgIHRoaXMud2F2ZVN1bS5lbXB0eSgpO1xuICAgIGRyYXdQbG90KHN1bUZ1bik7XG5cbiAgICAvLyBwYXJ0aWFsc1xufTtcblxuRm91cmllclN5bnRoLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmlzUGxheWluZykgdGhpcy5zdG9wKCk7XG4gICAgdGhpcy5vc2MgPSBuZXcgVG9uZS5PbW5pT3NjaWxsYXRvcih0aGlzLmZ1bmRhbWVudGFsRnJlcSwgJ3NpbmUnKTtcbiAgICB0aGlzLm9zYy5wYXJ0aWFscyA9IHRoaXMucGFydGlhbHM7XG4gICAgdGhpcy5vc2MudG9NYXN0ZXIoKTtcbiAgICB0aGlzLm9zYy5zdGFydCgpO1xuXG4gICAgdGhpcy5pc1BsYXlpbmcgPSB0cnVlO1xuICAgIHRoaXMuc3RhcnRCdXR0b24udmFsKCdTdG9wJyk7XG59O1xuXG5Gb3VyaWVyU3ludGgucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5pc1BsYXlpbmcpIHtcbiAgICAgICAgdGhpcy5vc2Muc3RvcCgpO1xuICAgICAgICB0aGlzLm9zYy5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcbiAgICB0aGlzLnN0YXJ0QnV0dG9uLnZhbCgnU3RhcnQnKTtcbn07XG5cbmV4cG9ydCB7Rm91cmllclN5bnRofTtcbiIsImltcG9ydCB7VUlFbGVtZW50fSBmcm9tICcuL1VJRWxlbWVudC5qcyc7XG5cbi8qKlxuICogU2hvd3MgY29tbWFuZHMgZGVwZW5kaW5nIG9uIGNvbnRleHRcbiAqIEBwYXJhbSB7alF1ZXJ5fSBjb250YWluZXIgalF1ZXJ5IGVsZW1lbnQgdGhhdCBjb250YWlucyB0aGlzIHBhbGV0dGUuXG4gKi9cbmZ1bmN0aW9uIFBhbGV0dGUoY29udGFpbmVyKSB7XG4gICAgVUlFbGVtZW50LmNhbGwodGhpcyk7XG5cbiAgICB0aGlzLnZpc2libGUgPSBmYWxzZTtcblxuICAgIC8vIE1lbnUgZm9yIGFkZGluZyBzdHVmZlxuICAgIHRoaXMucGFsZXR0ZSA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgdGhpcy5wYWxldHRlLmFkZENsYXNzKCdmbG93cGFsZXR0ZScpO1xuICAgIHRoaXMucGFsZXR0ZS5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgdGhpcy5wYWxldHRlLmNzcygnd2lkdGgnLCAnMTUwcHgnKTtcbiAgICB0aGlzLnBhbGV0dGUuY3NzKCdoZWlnaHQnLCAnMTUwcHgnKTtcbiAgICB0aGlzLnBhbGV0dGUuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xuXG4gICAgbGV0IGFkZEZsb3dOb2RlID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBhZGRGbG93Tm9kZS5hZGRDbGFzcygnZmxvd3BhbGV0dGVvcHRpb24nKTtcbiAgICBhZGRGbG93Tm9kZS5jc3MoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoOTQuNHB4LCAyLjZweCknKTtcblxuICAgIC8vIGxldCBhZGRGbG93Tm9kZSA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgLy8gYWRkRmxvd05vZGUuYWRkQ2xhc3MoJ2Zsb3dwYWxldHRlb3B0aW9uJyk7XG4gICAgLy8gYWRkRmxvd05vZGUuY3NzKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDk0LjRweCwgMi42cHgpJyk7XG5cbiAgICB0aGlzLnBhbGV0dGUuYXBwZW5kKGFkZEZsb3dOb2RlKTtcbiAgICB0aGlzLnNldENvbnRlbnQodGhpcy5wYWxldHRlKTtcblxuICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuXG4gICAgbGV0IF9zZWxmID0gdGhpcztcbiAgICB0aGlzLnBhbGV0dGUub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3NlbGYuaGlkZSgpO1xuICAgIH0pO1xuXG4gICAgYWRkRmxvd05vZGUub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChfc2VsZi5oYW5kbGVyc1snYWRkJ10pIF9zZWxmLmhhbmRsZXJzWydhZGQnXSgpO1xuICAgIH0pO1xufTtcblxuUGFsZXR0ZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRWxlbWVudC5wcm90b3R5cGUpO1xuUGFsZXR0ZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQYWxldHRlO1xuXG5QYWxldHRlLmdsb2JhbCA9IHt9O1xuLypcbiAqIFJldHVybnMgZ2xvYmFsIHN0YXRpYyBwYWxldHRlIGZyb20gYSBjb250YWluZXJcbiAqL1xuUGFsZXR0ZS5nZXQgPSBmdW5jdGlvbihjb250YWluZXIpIHtcbiAgICBpZiAoUGFsZXR0ZS5nbG9iYWxbY29udGFpbmVyXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIFBhbGV0dGUuZ2xvYmFsW2NvbnRhaW5lcl0gPSBuZXcgUGFsZXR0ZShjb250YWluZXIpO1xuICAgIH1cbiAgICByZXR1cm4gUGFsZXR0ZS5nbG9iYWxbY29udGFpbmVyXTtcbn07XG5cblBhbGV0dGUucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbihjZW50ZXIsIGhhbmRsZXJzKSB7XG4gICAgaWYgKCF0aGlzLnZpc2libGUpIHtcbiAgICAgICAgdGhpcy5pbmplY3RDb250ZW50KHRoaXMuY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLnBhbGV0dGUucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuXG5cbiAgICB0aGlzLnBhbGV0dGUuY3NzKCdsZWZ0JywgY2VudGVyLnggLSA3NSk7XG4gICAgdGhpcy5wYWxldHRlLmNzcygndG9wJywgY2VudGVyLnkgLSA3NSk7XG5cbiAgICB0aGlzLmhhbmRsZXJzID0gaGFuZGxlcnM7XG59O1xuXG5QYWxldHRlLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5wYWxldHRlLmFkZENsYXNzKCdoaWRkZW4nKTtcbn07XG5cbmV4cG9ydCB7UGFsZXR0ZX07XG4iLCJpbXBvcnQge0Zsb3dOb2RlfSBmcm9tICcuL0Zsb3dOb2RlLmpzJztcbmltcG9ydCB7UGFsZXR0ZX0gZnJvbSAnLi9QYWxldHRlLmpzJztcbmltcG9ydCB7VUlFbGVtZW50fSBmcm9tICcuL1VJRWxlbWVudC5qcyc7XG5cbi8qKlxuICogQSB0cmFjayBvbiB3aGljaCBwcm9ncmFtIGluc3RydWN0aW9ucyBsaWUgdG8gY3JlYXRlIGFuIGludHVpdGl2ZSBsaW5lYXJcbiAqIHByb2dyZXNzaW9uLlxuKi9cbmZ1bmN0aW9uIFRyYWNrKCkge1xuICAgIFVJRWxlbWVudC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuaXNUcmFjayA9IHRydWU7XG5cbiAgICBsZXQganFvID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBqcW8uY3NzKCd3aWR0aCcsICcxMDAlJyk7XG4gICAganFvLmNzcygnZGlzcGxheScsICdpbmxpbmUtYmxvY2snKTtcblxuICAgIHRoaXMuY2hpbGRyZW4gPSBbXTtcblxuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xufVxuXG5UcmFjay5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRWxlbWVudC5wcm90b3R5cGUpO1xuVHJhY2sucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHJhY2s7XG5cblRyYWNrLnByb3RvdHlwZS5hZGRDaGlsZCA9IGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgaWYgKCFjaGlsZC5pc1RyYWNrRWxlbWVudCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjogSW52YWxpZCB0eXBlIGZvciBjaGlsZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcblxuICAgIGNoaWxkLnBhcmVudFRyYWNrID0gdGhpcztcbiAgICBjaGlsZC5pbmplY3RDb250ZW50KHRoaXMpO1xuXG4gICAgcmV0dXJuIGNoaWxkO1xufTtcblxuVHJhY2sucHJvdG90eXBlLmFkZFN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IHN0YXJ0ID0gbmV3IFRyYWNrLlN0YXJ0Tm9kZSh0aGlzKTtcbiAgICB0aGlzLmFkZENoaWxkKHN0YXJ0KTtcbn07XG5cblRyYWNrLnByb3RvdHlwZS5hZGRTZWdtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IG5ld1NlZ21lbnQgPSBuZXcgVHJhY2suU2VnbWVudCh0aGlzKTtcbiAgICB0aGlzLmFkZENoaWxkKG5ld1NlZ21lbnQpO1xufTtcblxuVHJhY2sucHJvdG90eXBlLmZvcmsgPSBmdW5jdGlvbihuKSB7XG4gICAgaWYgKG4gPT09IHVuZGVmaW5lZCkgbiA9IDI7XG4gICAgbGV0IGZvcmsgPSBuZXcgVHJhY2suRm9yayh0aGlzLCBuKTtcbiAgICB0aGlzLmFkZENoaWxkKGZvcmspO1xuICAgIHJldHVybiBmb3JrO1xufTtcblxuVHJhY2sucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKGRlbGF5SW4pIHtcbiAgICBpZihkZWxheUluID09PSB1bmRlZmluZWQpIGRlbGF5SW4gPSAwO1xuICAgIGxldCBkZWxheSA9IGRlbGF5SW47XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmICh0aGlzLmNoaWxkcmVuW2ldLmlzRmxvd05vZGUpIHtcbiAgICAgICAgICAgIGRlbGF5ID0gdGhpcy5jaGlsZHJlbltpXS5leGVjKGRlbGF5KTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNoaWxkcmVuW2ldLmlzVHJhY2tGb3JrKSB7XG4gICAgICAgICAgICB0aGlzLmNoaWxkcmVuW2ldLnN1YlRyYWNrcy5mb3JFYWNoKCh0cmFjaykgPT4ge1xuICAgICAgICAgICAgICAgIHRyYWNrLnJ1bihkZWxheSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuVHJhY2suRWxlbWVudCA9IGZ1bmN0aW9uKHBhcmVudFRyYWNrKSB7XG4gICAgVUlFbGVtZW50LmNhbGwodGhpcyk7XG4gICAgdGhpcy5pc1RyYWNrRWxlbWVudCA9IHRydWU7XG5cbiAgICB0aGlzLnBhcmVudFRyYWNrID0gcGFyZW50VHJhY2sgPyBwYXJlbnRUcmFjayA6IG51bGw7XG59O1xuXG5UcmFjay5FbGVtZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVUlFbGVtZW50LnByb3RvdHlwZSk7XG5UcmFjay5FbGVtZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRyYWNrLkVsZW1lbnQ7XG5cblRyYWNrLkVsZW1lbnQucHJvdG90eXBlLmdldFBhcmVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnBhcmVudFRyYWNrO1xufTtcblxuVHJhY2suRm9yayA9IGZ1bmN0aW9uKHBhcmVudFRyYWNrLCBuKSB7XG4gICAgVHJhY2suRWxlbWVudC5jYWxsKHRoaXMsIHBhcmVudFRyYWNrKTtcbiAgICB0aGlzLmlzVHJhY2tGb3JrID0gdHJ1ZTtcblxuICAgIHRoaXMuc3ViVHJhY2tzID0gW107XG5cbiAgICBsZXQganFvID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBqcW8uY3NzKCd0ZXh0LWFsaWduJywgJ2NlbnRlcicpO1xuXG4gICAgbGV0IGJhciA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgYmFyLmNzcygnd2lkdGgnLCAnNTAlJyk7XG4gICAgYmFyLmNzcygnaGVpZ2h0JywgJzEwcHgnKTtcbiAgICBiYXIuY3NzKCdib3JkZXItc3R5bGUnLCAnc29saWQnKTtcbiAgICBiYXIuY3NzKCdib3JkZXItd2lkdGgnLCAnMCA1cHggMCA1cHgnKTtcbiAgICBiYXIuY3NzKCdib3JkZXItY29sb3InLCAnIzBBODBEQicpO1xuICAgIGJhci5jc3MoJ21hcmdpbicsICcwIGF1dG8nKTtcbiAgICBiYXIuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgJyMwQTgwREInKTtcbiAgICBqcW8uYXBwZW5kKGJhcik7XG5cbiAgICBsZXQgY29udGFpbmVycyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIGxldCBjb250YWluZXIgPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgICAgICBjb250YWluZXIuY3NzKCdkaXNwbGF5JywgJ2lubGluZS1ibG9jaycpO1xuICAgICAgICBjb250YWluZXIuY3NzKCd2ZXJ0aWNhbC1hbGlnbicsICd0b3AnKTtcbiAgICAgICAgY29udGFpbmVyLmNzcygnd2lkdGgnLCAxMDAgLyBuICsgJyUnKTtcbiAgICAgICAgY29udGFpbmVycy5wdXNoKGNvbnRhaW5lcik7XG4gICAgICAgIGpxby5hcHBlbmQoY29udGFpbmVyKTtcblxuICAgICAgICBsZXQgdHJhY2sgPSBuZXcgVHJhY2soKTtcbiAgICAgICAgdGhpcy5zdWJUcmFja3MucHVzaCh0cmFjayk7XG4gICAgICAgIHRyYWNrLmluamVjdENvbnRlbnQoY29udGFpbmVyKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldENvbnRlbnQoanFvKTtcbn07XG5cblRyYWNrLkZvcmsucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUcmFjay5FbGVtZW50LnByb3RvdHlwZSk7XG5UcmFjay5Gb3JrLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRyYWNrLkZvcms7XG5cblRyYWNrLlN0YXJ0Tm9kZSA9IGZ1bmN0aW9uKHBhcmVudFRyYWNrKSB7XG4gICAgVHJhY2suRWxlbWVudC5jYWxsKHRoaXMpO1xuXG4gICAgbGV0IGpxbyA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAganFvLmFkZENsYXNzKCdmbG93dHJhY2tzdGFydG5vZGUnKTtcbiAgICBqcW8uY3NzKCdtYXJnaW4nLCAnMCBhdXRvJyk7XG5cbiAgICBqcW8ub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdUaGlzIHdpbGwgZXZlbnR1YWxseSBjb21waWxlIGFuZCBydW4gdGhlIG11c2ljICh0byByZWR1Y2UgZGVsYXlzKS4gRm93IG5vdywgZW5qb3kgSm9obiBDYWdlXFwncyA0OjMzJyk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnNldENvbnRlbnQoanFvKTtcbn07XG5cblRyYWNrLlN0YXJ0Tm9kZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFRyYWNrLkVsZW1lbnQucHJvdG90eXBlKTtcblRyYWNrLlN0YXJ0Tm9kZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUcmFjay5TdGFydE5vZGU7XG5cblRyYWNrLlNlZ21lbnQgPSBmdW5jdGlvbihwYXJlbnRUcmFjaykge1xuICAgIFRyYWNrLkVsZW1lbnQuY2FsbCh0aGlzKTtcblxuICAgIHRoaXMucGFyZW50VHJhY2sgPSBwYXJlbnRUcmFjaztcblxuICAgIGxldCBqcW8gPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIGpxby5hZGRDbGFzcygnZmxvd3RyYWNrJyk7XG4gICAganFvLmFkZENsYXNzKCdmbG93dHJhY2tzZWdtZW50Jyk7XG4gICAganFvLmNzcygncG9zaXRpb24nLCAncmVsYXRpdmUnKTtcbiAgICBqcW8uY3NzKCdtYXJnaW4nLCAnMCBhdXRvJyk7XG5cbiAgICB0aGlzLmFkZEJ0biA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgdGhpcy5hZGRCdG4uYWRkQ2xhc3MoJ2Zsb3d0cmFja3NlZ21lbnRhZGQnKTtcbiAgICB0aGlzLmFkZEJ0bi5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XG4gICAgdGhpcy5hZGRCdG4uY3NzKCd6LWluZGV4JywgJzEnKTtcblxuICAgIGxldCBhZGRCdG5IYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCBmID0gbmV3IEZsb3dOb2RlKCk7XG4gICAgICAgIHBhcmVudFRyYWNrLmFkZENoaWxkKGYpO1xuICAgICAgICBwYXJlbnRUcmFjay5hZGRTZWdtZW50KCk7XG4gICAgfTtcblxuICAgIHRoaXMuYWRkQnRuLm9uKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICBsZXQgb2Zmc2V0ID0ganFvLm9mZnNldCgpO1xuICAgICAgICBQYWxldHRlLmdldCgkKCdib2R5JykpLnNob3coe1xuICAgICAgICAgICAgeDogb2Zmc2V0LmxlZnQgKyBqcW8ud2lkdGgoKSAvIDIsXG4gICAgICAgICAgICB5OiBvZmZzZXQudG9wICsganFvLmhlaWdodCgpIC8gMixcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgYWRkOiBhZGRCdG5IYW5kbGVyLFxuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8vIGpxby5hcHBlbmQodGhpcy5hZGRCdG4pOyAvLyBkaXNhYmxpbmcgaW5saW5lIHBhbGV0dGUgZm9yIG5vd1xuXG4gICAgdGhpcy5zZXRDb250ZW50KGpxbyk7XG5cbiAgICB0aGlzLnVwZGF0ZUxheW91dCgpO1xufTtcblxuVHJhY2suU2VnbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFRyYWNrLkVsZW1lbnQucHJvdG90eXBlKTtcblRyYWNrLlNlZ21lbnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHJhY2suU2VnbWVudDtcblxuVHJhY2suU2VnbWVudC5wcm90b3R5cGUudXBkYXRlTGF5b3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IG9mZnNldCA9IHRoaXMuZ2V0Q29udGVudCgpLm9mZnNldCgpO1xuXG4gICAgbGV0IHggPVxuICAgICAgICBvZmZzZXQubGVmdCArICh0aGlzLmdldENvbnRlbnQoKS53aWR0aCgpIC0gdGhpcy5hZGRCdG4ud2lkdGgoKSkgLyAyO1xuICAgIGxldCB5ID1cbiAgICAgICAgb2Zmc2V0LnRvcCArICh0aGlzLmdldENvbnRlbnQoKS5oZWlnaHQoKSAtIHRoaXMuYWRkQnRuLmhlaWdodCgpKSAvIDI7XG5cbiAgICB0aGlzLmFkZEJ0bi5jc3MoJ2xlZnQnLCB4KTtcbiAgICB0aGlzLmFkZEJ0bi5jc3MoJ3RvcCcsIHkpO1xufTtcblxuZXhwb3J0IHtUcmFja307XG4iLCJpbXBvcnQge1RyYWNrfSBmcm9tICcuL1RyYWNrLmpzJztcbmltcG9ydCB7VUlFbGVtZW50fSBmcm9tICcuL1VJRWxlbWVudC5qcyc7XG5cbi8qKlxuKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgbm9kZSB3aXRoaW4gYSBwcm9ncmFtLiBJbmNsdWRlcyBVSSBhbmQgb3RoZXIgZnVuY3Rpb25zXG4qIHRvIGludGVncmF0ZSB3aXRoIHRoZSBwcm9ncmFtIGFzIGEgd2hvbGVcbipcbiogRXh0ZXJuYWwgZGVwZW5kZW5jaWVzOiBqUXVlcnlVSVxuKlxuKiBAcGFyYW0ge251bWJlcj19IHdpZHRoIHdpZHRoIG9mIHRoZSBub2RlIGluIHVuaXRzXG4qIEBwYXJhbSB7bnVtYmVyPX0gaGVpZ2h0IGhlaWdodCBvZiB0aGUgbm9kZSBpbiB1bml0c1xuKi9cbmZ1bmN0aW9uIEZsb3dOb2RlKHdpZHRoLCBoZWlnaHQpIHtcbiAgICBUcmFjay5FbGVtZW50LmNhbGwodGhpcyk7XG4gICAgdGhpcy5pc0Zsb3dOb2RlID0gdHJ1ZTtcblxuICAgIHRoaXMud2lkdGggPSB3aWR0aCAhPT0gdW5kZWZpbmVkID8gd2lkdGggOiAxO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0ICE9PSB1bmRlZmluZWQgPyBoZWlnaHQgOiAxO1xuICAgIHRoaXMucG9ydHMgPSBbXTtcblxuICAgIGxldCBqcW8gPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIGpxby5hZGRDbGFzcygnZmxvd25vZGUnKTtcbiAgICBqcW8uY3NzKCdtYXJnaW4nLCAnMCBhdXRvJyk7XG5cbiAgICB0aGlzLnNldENvbnRlbnQoanFvKTtcblxuICAgIHRoaXMuc2V0U2l6ZSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG5cbiAgICB0aGlzLmV4ZWMgPSBmdW5jdGlvbihkZWxheUluKSB7XG4gICAgICAgIC8vIGRvIHN0dWZmXG4gICAgICAgIGxldCBkZWxheU91dCA9IGRlbGF5SW47XG4gICAgICAgIHJldHVybiBkZWxheU91dDtcbiAgICB9O1xufTtcblxuRmxvd05vZGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUcmFjay5FbGVtZW50LnByb3RvdHlwZSk7XG5GbG93Tm9kZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGbG93Tm9kZTtcblxuRmxvd05vZGUucHJvdG90eXBlLnNldFNpemUgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCd3aWR0aCcsIDExMCAqIHdpZHRoIC0gMTApO1xuICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnaGVpZ2h0JywgMTEwICogaGVpZ2h0IC0gMTApO1xufTtcblxuRmxvd05vZGUucHJvdG90eXBlLmFkZFBvcnQgPSBmdW5jdGlvbihkb2NraW5nLCBvZmZzZXQsIGxhYmVsKSB7XG4gICAgbGV0IHBvcnQgPSBuZXcgRmxvd05vZGUuUG9ydCh0aGlzLCBkb2NraW5nLCBvZmZzZXQsIGxhYmVsKTtcbiAgICB0aGlzLnBvcnRzLnB1c2gocG9ydCk7XG4gICAgcmV0dXJuIHBvcnQ7XG59O1xuXG4vKipcbiogQHBhcmFtIHtGbG93Tm9kZX0gcGFyZW50XG4qIEBwYXJhbSB7c3RyaW5nPX0gZG9ja2luZ1xuKiBAcGFyYW0ge251bWJlcj19IG9mZnNldFxuKiBAcGFyYW0ge3N0cmluZz19IGxhYmVsXG4qL1xuRmxvd05vZGUuUG9ydCA9IGZ1bmN0aW9uKHBhcmVudCwgZG9ja2luZywgb2Zmc2V0LCBsYWJlbCkge1xuICAgIFVJRWxlbWVudC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuaXNGbG93Tm9kZVBvcnQgPSB0cnVlO1xuXG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5kb2NraW5nID0gZG9ja2luZyAhPT0gdW5kZWZpbmVkID8gZG9ja2luZyA6ICd0bCc7XG4gICAgdGhpcy5vZmZzZXQgPSBvZmZzZXQgIT09IHVuZGVmaW5lZCA/IG9mZnNldCA6IDA7XG4gICAgdGhpcy5sYWJlbCA9IGxhYmVsICE9PSB1bmRlZmluZWQgPyBsYWJlbCA6ICcnO1xuXG4gICAgbGV0IGpxbyA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAganFvLmFkZENsYXNzKCdmbG93bm9kZXBvcnQnKTtcbiAgICBqcW8uY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xuXG4gICAgdGhpcy5pbmplY3RDb250ZW50KHBhcmVudC5nZXRDb250ZW50KCkpO1xuICAgIHRoaXMudXBkYXRlTGF5b3V0KCk7XG5cbiAgICBsZXQgY29ubmVjdG9yID0gbnVsbDtcbiAgICBsZXQgX3NlbGYgPSB0aGlzO1xuICAgIGpxby5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQub3JpZ2luYWxFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICBsZXQgciA9IF9zZWxmLmdldENvbnRlbnQoKVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgbGV0IHggPSAoci5sZWZ0ICsgci5yaWdodCkgLyAyKyB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgbGV0IHkgPSAoci50b3AgKyByLmJvdHRvbSkgLyAyICsgd2luZG93LnNjcm9sbFk7XG5cbiAgICAgICAgY29ubmVjdG9yID0gbmV3IEZsb3dOb2RlLkNvbm5lY3Rvcih7eDogeCwgeTogeX0pO1xuICAgICAgICBjb25uZWN0b3IuaW5qZWN0Q29udGVudChfc2VsZi5wYXJlbnQuZ2V0Q29udGVudENvbnRhaW5lcigpKTtcbiAgICB9KTtcblxuICAgIGxldCBnZXROZWFyYnlQb3J0cyA9IGZ1bmN0aW9uKGNsaWVudFgsIGNsaWVudFkpIHtcbiAgICAgICAgbGV0IG5lYXJieSA9IFtdO1xuICAgICAgICAkKCcuZmxvd25vZGVwb3J0JykuZWFjaCgoaW5kZXgsIGRvbSkgPT4ge1xuICAgICAgICAgICAgbGV0IGVsZW0gPSAkKGRvbSk7XG4gICAgICAgICAgICBsZXQgciA9IGVsZW1bMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgICAgIGxldCBjeCA9IChyLmxlZnQgKyByLnJpZ2h0KSAvIDI7XG4gICAgICAgICAgICBsZXQgY3kgPSAoci50b3AgKyByLmJvdHRvbSkgLyAyO1xuXG4gICAgICAgICAgICBsZXQgZDIgPSBNYXRoLnBvdyhjeCAtIGNsaWVudFgsIDIpICsgTWF0aC5wb3coY3kgLSBjbGllbnRZLCAyKTtcbiAgICAgICAgICAgIGlmIChkMiA8IDEwMCkgbmVhcmJ5LnB1c2goVUlFbGVtZW50Lmxvb2t1cEJ5VWlkKGVsZW0uYXR0cigndWlkJykpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZWFyYnk7XG4gICAgfTtcblxuICAgIHRoaXMucGFyZW50LmdldENvbnRlbnRDb250YWluZXIoKS5vbignbW91c2Vtb3ZlJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChjb25uZWN0b3IgIT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IHggPSBldmVudC5vcmlnaW5hbEV2ZW50LmNsaWVudFggKyB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgICAgIGxldCB5ID0gZXZlbnQub3JpZ2luYWxFdmVudC5jbGllbnRZICsgd2luZG93LnNjcm9sbFk7XG5cbiAgICAgICAgICAgIGxldCBucCA9IGdldE5lYXJieVBvcnRzKGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgICBldmVudC5vcmlnaW5hbEV2ZW50LmNsaWVudFkpO1xuICAgICAgICAgICAgICAgIGlmIChucC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByID0gbnBbMF0uZ2V0Q29udGVudCgpWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB4ID0gKHIubGVmdCArIHIucmlnaHQpIC8gMiArIHdpbmRvdy5zY3JvbGxYO1xuICAgICAgICAgICAgICAgICAgICB5ID0gKHIudG9wICsgci5ib3R0b20pIC8gMisgd2luZG93LnNjcm9sbFk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29ubmVjdG9yLnNldFRhcmdldCh7eDogeCwgeTogeX0pO1xuICAgICAgICAgICAgICAgIGNvbm5lY3Rvci51cGRhdGVMYXlvdXQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5wYXJlbnQuZ2V0Q29udGVudENvbnRhaW5lcigpLm9uKCdtb3VzZXVwJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoY29ubmVjdG9yICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBsZXQgbnAgPSBnZXROZWFyYnlQb3J0cyhldmVudC5vcmlnaW5hbEV2ZW50LmNsaWVudFgsXG4gICAgICAgICAgICAgICAgICAgIGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2xpZW50WSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChucC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgciA9IG5wWzBdLmdldENvbnRlbnQoKVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB4ID0gKHIubGVmdCArIHIucmlnaHQpIC8gMiArIHdpbmRvdy5zY3JvbGxYO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHkgPSAoci50b3AgKyByLmJvdHRvbSkgLyAyICsgd2luZG93LnNjcm9sbFk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBjID0gbmV3IEZsb3dOb2RlLkNvbm5lY3Rvcihjb25uZWN0b3Iub3JpZ2luLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt4OiB4LCB5OiB5fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjLmluamVjdENvbnRlbnQoX3NlbGYucGFyZW50LmdldENvbnRlbnRDb250YWluZXIoKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25uZWN0b3IucmVtb3ZlQ29udGVudCgpO1xuICAgICAgICAgICAgICAgICAgICBjb25uZWN0b3IgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIEZsb3dOb2RlLlBvcnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUVsZW1lbnQucHJvdG90eXBlKTtcbiAgICAgICAgRmxvd05vZGUuUG9ydC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGbG93Tm9kZS5Qb3J0O1xuXG4gICAgICAgIEZsb3dOb2RlLlBvcnQucHJvdG90eXBlLnVwZGF0ZUxheW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgc3dpdGNoICh0aGlzLmRvY2tpbmdbMF0pIHtcbiAgICAgICAgICAgICAgICBjYXNlICd0JzpcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3RvcCcsIDApO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnYm90dG9tJywgJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnbGVmdCcsICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3JpZ2h0JywgJycpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2InOlxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygndG9wJywgJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnYm90dG9tJywgMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdsZWZ0JywgJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygncmlnaHQnLCAnJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnbCc6XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCd0b3AnLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdib3R0b20nLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdsZWZ0JywgMCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdyaWdodCcsICcnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdyJzpcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3RvcCcsICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2JvdHRvbScsICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2xlZnQnLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdyaWdodCcsIDApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgJ0ludmFsaWQgZG9ja2luZyBvcHRpb24gXFwnJyArIHRoaXMuZG9ja2luZyArICdcXCchJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgcGl4ZWxPZmZzZXQgPSAxNSAqICh0aGlzLm9mZnNldCArIDEpO1xuICAgICAgICAgICAgc3dpdGNoICh0aGlzLmRvY2tpbmdbMV0pIHtcbiAgICAgICAgICAgICAgICBjYXNlICd0JzpcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3RvcCcsIHBpeGVsT2Zmc2V0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdiJzpcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2JvdHRvbScsIHBpeGVsT2Zmc2V0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdsJzpcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2xlZnQnLCBwaXhlbE9mZnNldCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncic6XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdyaWdodCcsIHBpeGVsT2Zmc2V0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICdJbnZhbGlkIGRvY2tpbmcgb3B0aW9uIFxcJycgKyB0aGlzLmRvY2tpbmcgKyAnXFwnIScpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgKlxuICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gb3JpZ2luXG4gICAgICAgICogQHBhcmFtIHtPYmplY3Q9fSB0YXJnZXRcbiAgICAgICAgKi9cbiAgICAgICAgRmxvd05vZGUuQ29ubmVjdG9yID0gZnVuY3Rpb24ob3JpZ2luLCB0YXJnZXQpIHtcbiAgICAgICAgICAgIFVJRWxlbWVudC5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5pc0Zsb3dOb2RlQ29ubmVjdG9yID0gdHJ1ZTtcblxuICAgICAgICAgICAgdGhpcy5vcmlnaW4gPSBvcmlnaW4gIT09IHVuZGVmaW5lZCA/IG9yaWdpbiA6IHt4OiAwLCB5OiAwfTtcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0ICE9PSB1bmRlZmluZWQgPyB0YXJnZXQgOiB0aGlzLm9yaWdpbjtcblxuICAgICAgICAgICAgbGV0IG5zID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbiAgICAgICAgICAgIHRoaXMuc3ZnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5zLCAnc3ZnJyk7XG5cbiAgICAgICAgICAgIHRoaXMucmVjdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucywgJ3JlY3QnKTtcbiAgICAgICAgICAgIHRoaXMuc3ZnLmFwcGVuZENoaWxkKHRoaXMucmVjdCk7XG5cbiAgICAgICAgICAgIGxldCBqcW8gPSAkKHRoaXMuc3ZnKTtcbiAgICAgICAgICAgIGpxby5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XG4gICAgICAgICAgICB0aGlzLnNldENvbnRlbnQoanFvKTtcblxuICAgICAgICAgICAgdGhpcy51cGRhdGVMYXlvdXQoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBGbG93Tm9kZS5Db25uZWN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUVsZW1lbnQucHJvdG90eXBlKTtcbiAgICAgICAgRmxvd05vZGUuQ29ubmVjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZsb3dOb2RlLkNvbm5lY3RvcjtcblxuICAgICAgICBGbG93Tm9kZS5Db25uZWN0b3IucHJvdG90eXBlLnVwZGF0ZUxheW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5zdmcuc2V0QXR0cmlidXRlTlMobnVsbCwgJ3dpZHRoJyxcbiAgICAgICAgICAgIE1hdGguYWJzKHRoaXMub3JpZ2luLnggLSB0aGlzLnRhcmdldC54KSk7XG4gICAgICAgICAgICB0aGlzLnN2Zy5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnaGVpZ2h0JyxcbiAgICAgICAgICAgIE1hdGguYWJzKHRoaXMub3JpZ2luLnkgLSB0aGlzLnRhcmdldC55KSk7XG5cbiAgICAgICAgICAgIHRoaXMucmVjdC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnd2lkdGgnLFxuICAgICAgICAgICAgTWF0aC5hYnModGhpcy5vcmlnaW4ueCAtIHRoaXMudGFyZ2V0LngpKTtcbiAgICAgICAgICAgIHRoaXMucmVjdC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnaGVpZ2h0JyxcbiAgICAgICAgICAgIE1hdGguYWJzKHRoaXMub3JpZ2luLnkgLSB0aGlzLnRhcmdldC55KSk7XG4gICAgICAgICAgICB0aGlzLnJlY3Quc2V0QXR0cmlidXRlTlMobnVsbCwgJ2ZpbGwnLCAnI2YwNicpO1xuXG4gICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKVxuICAgICAgICAgICAgICAgIC5jc3MoJ2xlZnQnLCBNYXRoLm1pbih0aGlzLm9yaWdpbi54LCB0aGlzLnRhcmdldC54KSk7XG4gICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKVxuICAgICAgICAgICAgICAgIC5jc3MoJ3RvcCcsIE1hdGgubWluKHRoaXMub3JpZ2luLnksIHRoaXMudGFyZ2V0LnkpKTtcbiAgICAgICAgfTtcblxuICAgICAgICBGbG93Tm9kZS5Db25uZWN0b3IucHJvdG90eXBlLnNldFRhcmdldCA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgZXhwb3J0IHtGbG93Tm9kZX07XG5cblxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOzs7OztBQUtBLFNBQVMsV0FBVyxHQUFHO0lBQ25CLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7Q0FDNUM7O0FBRUQsV0FBVyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsV0FBVztJQUNwQyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDakIsSUFBSSxLQUFLLEdBQUcsU0FBUyxJQUFJLEVBQUU7UUFDdkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN2RCxLQUFLLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQzFELEtBQUssQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdkQsS0FBSyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztRQUMxRCxLQUFLLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELEtBQUssQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDMUQsS0FBSyxDQUFDLEtBQUssQ0FBQyxv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
