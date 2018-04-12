var MusicLab = (function (exports) {
'use strict';

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
    if (delayIn === undefined) delayIn = 0;
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
    jqo.draggable({grid: [20, 20]});
    jqo.addClass('flownode');

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

    let portDiv = $('<div></div>');
    portDiv.css('display', 'inline-block');
    portDiv.addClass('flownodeport');

    let jqo = $('<div></div>');
    jqo.css('position', 'absolute');
    jqo.append(portDiv);
    jqo.append(' ' + label);
    this.setContent(jqo);

    this.injectContent(parent.getContent());
    this.updateLayout();

    let connector = null;
    let _self = this;
    portDiv.on('mousedown', function(event) {
        event.originalEvent.stopPropagation();
        event.originalEvent.preventDefault();

        let r = portDiv[0].getBoundingClientRect();
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

            let np = getNearbyPorts(event.originalEvent.clientX, event.originalEvent.clientY);
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
            let np = getNearbyPorts(event.originalEvent.clientX, event.originalEvent.clientY);
            if (np.length > 0) {
                let r = np[0].getContent()[0].getBoundingClientRect();
                let x = (r.left + r.right) / 2 + window.scrollX;
                let y = (r.top + r.bottom) / 2 + window.scrollY;

                let c = new FlowNode.Connector(connector.origin, {x: x, y: y});
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
        console.error('Invalid docking option \'' + this.docking + '\'!');
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
        console.error('Invalid docking option \'' + this.docking + '\'!');
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

    this.getContent().css('left', Math.min(this.origin.x, this.target.x));
    this.getContent().css('top', Math.min(this.origin.y, this.target.y));
};

FlowNode.Connector.prototype.setTarget = function(target) {
    this.target = target;
};

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
}

FourierSynth.prototype = Object.create(FlowNode.prototype);
FourierSynth.prototype.constructor = FourierSynth;

FourierSynth.prototype.injectContent = function(element) {
    FlowNode.prototype.injectContent.call(this, element);
    this.addPort('lb', 11, 'freq. in');
};

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

// export {Synthesizer} from './audio/Synthesizer.js';



// export {FlowNode} from './ui/FlowNode.js';
// export {Track} from './ui/Track.js';
// export {UIElement} from './ui/UIElement.js';

exports.FourierSynth = FourierSynth;

return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXVzaWNMYWIuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY3JpcHRzL3VpL1VJRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9zY3JpcHRzL3VpL1BhbGV0dGUuanMiLCIuLi8uLi9zcmMvc2NyaXB0cy91aS9UcmFjay5qcyIsIi4uLy4uL3NyYy9zY3JpcHRzL3VpL0Zsb3dOb2RlLmpzIiwiLi4vLi4vc3JjL3NjcmlwdHMvbW9kdWxlcy9Gb3VyaWVyU3ludGguanMiLCIuLi8uLi9zcmMvc2NyaXB0cy9NdXNpY0xhYi5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiogQW4gYWJzdHJhY3QgY2xhc3MgZm9yIGhhbmRsaW5nIGludGVncmF0aW9uIHdpdGggSFRNTFxuKlxuKiBFeHRlcm5hbCBkZXBlbmRlbmNpZXM6IGpRdWVyeVxuKi9cbmZ1bmN0aW9uIFVJRWxlbWVudCgpIHtcbiAgICB0aGlzLmlzVUlFbGVtZW50ID0gdHJ1ZTtcblxuICAgIHRoaXMualF1ZXJ5T2JqZWN0ID0gbnVsbDtcbiAgICB0aGlzLmNvbnRlbnRDb250YWluZXIgPSBudWxsO1xuXG4gICAgdGhpcy51aWQgPSBVSUVsZW1lbnQudWlkKys7XG59XG5cblVJRWxlbWVudC51aWQgPSAwO1xuVUlFbGVtZW50Lmxvb2t1cCA9IHt9O1xuXG5VSUVsZW1lbnQubG9va3VwQnlVaWQgPSBmdW5jdGlvbih1aWQpIHtcbiAgICByZXR1cm4gVUlFbGVtZW50Lmxvb2t1cFt1aWRdO1xufTtcblxuLyoqXG4qIFNldHMgY29udGVudCB0byBhIGpRdWVyeSBvYmplY3RcbiogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgYSBqUXVlcnkgb2JqZWN0XG4qL1xuVUlFbGVtZW50LnByb3RvdHlwZS5zZXRDb250ZW50ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHRoaXMualF1ZXJ5T2JqZWN0ID0gZWxlbWVudDtcblxuICAgIFVJRWxlbWVudC5sb29rdXBbdGhpcy51aWRdID0gdGhpcztcbiAgICB0aGlzLmpRdWVyeU9iamVjdC5hdHRyKCd1aWQnLCB0aGlzLnVpZCk7XG59O1xuXG4vKipcbiogSW5qZWN0cyBjb250ZW50IGludG8gYSBqUXVlcnkgb2JqZWN0XG4qIEBwYXJhbSB7alF1ZXJ5IHwgVUlFbGVtZW50fSBlbGVtZW50IGpRdWVyeSBvYmplY3QgdG8gaW5qZWN0IGNvbnRlbnQgaW50b1xuKi9cblVJRWxlbWVudC5wcm90b3R5cGUuaW5qZWN0Q29udGVudCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBpZiAodGhpcy5qUXVlcnlPYmplY3QgPT0gbnVsbCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjogQ29udGVudCBub3Qgc2V0IScpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGVsZW1lbnQuaXNVSUVsZW1lbnQpIHtcbiAgICAgICAgZWxlbWVudC5qUXVlcnlPYmplY3QuYXBwZW5kKHRoaXMualF1ZXJ5T2JqZWN0KTtcbiAgICAgICAgdGhpcy5jb250ZW50Q29udGFpbmVyID0gZWxlbWVudC5qUXVlcnlPYmplY3Q7XG4gICAgfSBlbHNlIGlmIChlbGVtZW50IGluc3RhbmNlb2YgalF1ZXJ5KSB7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kKHRoaXMualF1ZXJ5T2JqZWN0KTtcbiAgICAgICAgdGhpcy5jb250ZW50Q29udGFpbmVyID0gZWxlbWVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjogSW52YWxpZCB0eXBlIChlbGVtZW50KSEnKTtcbiAgICB9XG59O1xuXG4vKipcbiogUmVtb3ZlcyB0aGUgVUlFbGVtZW50IGZyb20gdGhlIGRvY3VtZW50XG4qL1xuVUlFbGVtZW50LnByb3RvdHlwZS5yZW1vdmVDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5qUXVlcnlPYmplY3QucmVtb3ZlKCk7XG4gICAgZGVsZXRlIFVJRWxlbWVudC5sb29rdXBbdGhpcy51aWRdO1xufTtcblxuLyoqXG4qIFJldHVybnMgdGhlIGFzc29jaWF0ZWQgalF1ZXJ5IE9iamVjdFxuKiBAcmV0dXJuIHtqUXVlcnl9XG4qL1xuVUlFbGVtZW50LnByb3RvdHlwZS5nZXRDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMualF1ZXJ5T2JqZWN0O1xufTtcblxuVUlFbGVtZW50LnByb3RvdHlwZS5nZXRDb250ZW50Q29udGFpbmVyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuY29udGVudENvbnRhaW5lcjtcbn07XG5cbmV4cG9ydCB7VUlFbGVtZW50fTtcbiIsImltcG9ydCB7VUlFbGVtZW50fSBmcm9tICcuL1VJRWxlbWVudC5qcyc7XG5cbi8qKlxuICogU2hvd3MgY29tbWFuZHMgZGVwZW5kaW5nIG9uIGNvbnRleHRcbiAqIEBwYXJhbSB7alF1ZXJ5fSBjb250YWluZXIgalF1ZXJ5IGVsZW1lbnQgdGhhdCBjb250YWlucyB0aGlzIHBhbGV0dGUuXG4gKi9cbmZ1bmN0aW9uIFBhbGV0dGUoY29udGFpbmVyKSB7XG4gICAgVUlFbGVtZW50LmNhbGwodGhpcyk7XG5cbiAgICB0aGlzLnZpc2libGUgPSBmYWxzZTtcblxuICAgIC8vIE1lbnUgZm9yIGFkZGluZyBzdHVmZlxuICAgIHRoaXMucGFsZXR0ZSA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgdGhpcy5wYWxldHRlLmFkZENsYXNzKCdmbG93cGFsZXR0ZScpO1xuICAgIHRoaXMucGFsZXR0ZS5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgdGhpcy5wYWxldHRlLmNzcygnd2lkdGgnLCAnMTUwcHgnKTtcbiAgICB0aGlzLnBhbGV0dGUuY3NzKCdoZWlnaHQnLCAnMTUwcHgnKTtcbiAgICB0aGlzLnBhbGV0dGUuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xuXG4gICAgbGV0IGFkZEZsb3dOb2RlID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBhZGRGbG93Tm9kZS5hZGRDbGFzcygnZmxvd3BhbGV0dGVvcHRpb24nKTtcbiAgICBhZGRGbG93Tm9kZS5jc3MoJ3RyYW5zZm9ybScsICd0cmFuc2xhdGUoOTQuNHB4LCAyLjZweCknKTtcblxuICAgIC8vIGxldCBhZGRGbG93Tm9kZSA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgLy8gYWRkRmxvd05vZGUuYWRkQ2xhc3MoJ2Zsb3dwYWxldHRlb3B0aW9uJyk7XG4gICAgLy8gYWRkRmxvd05vZGUuY3NzKCd0cmFuc2Zvcm0nLCAndHJhbnNsYXRlKDk0LjRweCwgMi42cHgpJyk7XG5cbiAgICB0aGlzLnBhbGV0dGUuYXBwZW5kKGFkZEZsb3dOb2RlKTtcbiAgICB0aGlzLnNldENvbnRlbnQodGhpcy5wYWxldHRlKTtcblxuICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuXG4gICAgbGV0IF9zZWxmID0gdGhpcztcbiAgICB0aGlzLnBhbGV0dGUub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgX3NlbGYuaGlkZSgpO1xuICAgIH0pO1xuXG4gICAgYWRkRmxvd05vZGUub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChfc2VsZi5oYW5kbGVyc1snYWRkJ10pIF9zZWxmLmhhbmRsZXJzWydhZGQnXSgpO1xuICAgIH0pO1xufTtcblxuUGFsZXR0ZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRWxlbWVudC5wcm90b3R5cGUpO1xuUGFsZXR0ZS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQYWxldHRlO1xuXG5QYWxldHRlLmdsb2JhbCA9IHt9O1xuLypcbiAqIFJldHVybnMgZ2xvYmFsIHN0YXRpYyBwYWxldHRlIGZyb20gYSBjb250YWluZXJcbiAqL1xuUGFsZXR0ZS5nZXQgPSBmdW5jdGlvbihjb250YWluZXIpIHtcbiAgICBpZiAoUGFsZXR0ZS5nbG9iYWxbY29udGFpbmVyXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIFBhbGV0dGUuZ2xvYmFsW2NvbnRhaW5lcl0gPSBuZXcgUGFsZXR0ZShjb250YWluZXIpO1xuICAgIH1cbiAgICByZXR1cm4gUGFsZXR0ZS5nbG9iYWxbY29udGFpbmVyXTtcbn07XG5cblBhbGV0dGUucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbihjZW50ZXIsIGhhbmRsZXJzKSB7XG4gICAgaWYgKCF0aGlzLnZpc2libGUpIHtcbiAgICAgICAgdGhpcy5pbmplY3RDb250ZW50KHRoaXMuY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy52aXNpYmxlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLnBhbGV0dGUucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuXG5cbiAgICB0aGlzLnBhbGV0dGUuY3NzKCdsZWZ0JywgY2VudGVyLnggLSA3NSk7XG4gICAgdGhpcy5wYWxldHRlLmNzcygndG9wJywgY2VudGVyLnkgLSA3NSk7XG5cbiAgICB0aGlzLmhhbmRsZXJzID0gaGFuZGxlcnM7XG59O1xuXG5QYWxldHRlLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5wYWxldHRlLmFkZENsYXNzKCdoaWRkZW4nKTtcbn07XG5cbmV4cG9ydCB7UGFsZXR0ZX07XG4iLCJpbXBvcnQge0Zsb3dOb2RlfSBmcm9tICcuL0Zsb3dOb2RlLmpzJztcbmltcG9ydCB7UGFsZXR0ZX0gZnJvbSAnLi9QYWxldHRlLmpzJztcbmltcG9ydCB7VUlFbGVtZW50fSBmcm9tICcuL1VJRWxlbWVudC5qcyc7XG5cbi8qKlxuICogQSB0cmFjayBvbiB3aGljaCBwcm9ncmFtIGluc3RydWN0aW9ucyBsaWUgdG8gY3JlYXRlIGFuIGludHVpdGl2ZSBsaW5lYXJcbiAqIHByb2dyZXNzaW9uLlxuKi9cbmZ1bmN0aW9uIFRyYWNrKCkge1xuICAgIFVJRWxlbWVudC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuaXNUcmFjayA9IHRydWU7XG5cbiAgICBsZXQganFvID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBqcW8uY3NzKCd3aWR0aCcsICcxMDAlJyk7XG4gICAganFvLmNzcygnZGlzcGxheScsICdpbmxpbmUtYmxvY2snKTtcblxuICAgIHRoaXMuY2hpbGRyZW4gPSBbXTtcblxuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xufVxuXG5UcmFjay5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRWxlbWVudC5wcm90b3R5cGUpO1xuVHJhY2sucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHJhY2s7XG5cblRyYWNrLnByb3RvdHlwZS5hZGRDaGlsZCA9IGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgaWYgKCFjaGlsZC5pc1RyYWNrRWxlbWVudCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjogSW52YWxpZCB0eXBlIGZvciBjaGlsZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcblxuICAgIGNoaWxkLnBhcmVudFRyYWNrID0gdGhpcztcbiAgICBjaGlsZC5pbmplY3RDb250ZW50KHRoaXMpO1xuXG4gICAgcmV0dXJuIGNoaWxkO1xufTtcblxuVHJhY2sucHJvdG90eXBlLmFkZFN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IHN0YXJ0ID0gbmV3IFRyYWNrLlN0YXJ0Tm9kZSh0aGlzKTtcbiAgICB0aGlzLmFkZENoaWxkKHN0YXJ0KTtcbn07XG5cblRyYWNrLnByb3RvdHlwZS5hZGRTZWdtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IG5ld1NlZ21lbnQgPSBuZXcgVHJhY2suU2VnbWVudCh0aGlzKTtcbiAgICB0aGlzLmFkZENoaWxkKG5ld1NlZ21lbnQpO1xufTtcblxuVHJhY2sucHJvdG90eXBlLmZvcmsgPSBmdW5jdGlvbihuKSB7XG4gICAgaWYgKG4gPT09IHVuZGVmaW5lZCkgbiA9IDI7XG4gICAgbGV0IGZvcmsgPSBuZXcgVHJhY2suRm9yayh0aGlzLCBuKTtcbiAgICB0aGlzLmFkZENoaWxkKGZvcmspO1xuICAgIHJldHVybiBmb3JrO1xufTtcblxuVHJhY2sucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uKGRlbGF5SW4pIHtcbiAgICBpZiAoZGVsYXlJbiA9PT0gdW5kZWZpbmVkKSBkZWxheUluID0gMDtcbiAgICBsZXQgZGVsYXkgPSBkZWxheUluO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodGhpcy5jaGlsZHJlbltpXS5pc0Zsb3dOb2RlKSB7XG4gICAgICAgICAgICBkZWxheSA9IHRoaXMuY2hpbGRyZW5baV0uZXhlYyhkZWxheSk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5jaGlsZHJlbltpXS5pc1RyYWNrRm9yaykge1xuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbltpXS5zdWJUcmFja3MuZm9yRWFjaCgodHJhY2spID0+IHtcbiAgICAgICAgICAgICAgICB0cmFjay5ydW4oZGVsYXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn07XG5cblRyYWNrLkVsZW1lbnQgPSBmdW5jdGlvbihwYXJlbnRUcmFjaykge1xuICAgIFVJRWxlbWVudC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuaXNUcmFja0VsZW1lbnQgPSB0cnVlO1xuXG4gICAgdGhpcy5wYXJlbnRUcmFjayA9IHBhcmVudFRyYWNrID8gcGFyZW50VHJhY2sgOiBudWxsO1xufTtcblxuVHJhY2suRWxlbWVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRWxlbWVudC5wcm90b3R5cGUpO1xuVHJhY2suRWxlbWVudC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUcmFjay5FbGVtZW50O1xuXG5UcmFjay5FbGVtZW50LnByb3RvdHlwZS5nZXRQYXJlbnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5wYXJlbnRUcmFjaztcbn07XG5cblRyYWNrLkZvcmsgPSBmdW5jdGlvbihwYXJlbnRUcmFjaywgbikge1xuICAgIFRyYWNrLkVsZW1lbnQuY2FsbCh0aGlzLCBwYXJlbnRUcmFjayk7XG4gICAgdGhpcy5pc1RyYWNrRm9yayA9IHRydWU7XG5cbiAgICB0aGlzLnN1YlRyYWNrcyA9IFtdO1xuXG4gICAgbGV0IGpxbyA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAganFvLmNzcygndGV4dC1hbGlnbicsICdjZW50ZXInKTtcblxuICAgIGxldCBiYXIgPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIGJhci5jc3MoJ3dpZHRoJywgJzUwJScpO1xuICAgIGJhci5jc3MoJ2hlaWdodCcsICcxMHB4Jyk7XG4gICAgYmFyLmNzcygnYm9yZGVyLXN0eWxlJywgJ3NvbGlkJyk7XG4gICAgYmFyLmNzcygnYm9yZGVyLXdpZHRoJywgJzAgNXB4IDAgNXB4Jyk7XG4gICAgYmFyLmNzcygnYm9yZGVyLWNvbG9yJywgJyMwQTgwREInKTtcbiAgICBiYXIuY3NzKCdtYXJnaW4nLCAnMCBhdXRvJyk7XG4gICAgYmFyLmNzcygnYmFja2dyb3VuZC1jb2xvcicsICcjMEE4MERCJyk7XG4gICAganFvLmFwcGVuZChiYXIpO1xuXG4gICAgbGV0IGNvbnRhaW5lcnMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICBsZXQgY29udGFpbmVyID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICAgICAgY29udGFpbmVyLmNzcygnZGlzcGxheScsICdpbmxpbmUtYmxvY2snKTtcbiAgICAgICAgY29udGFpbmVyLmNzcygndmVydGljYWwtYWxpZ24nLCAndG9wJyk7XG4gICAgICAgIGNvbnRhaW5lci5jc3MoJ3dpZHRoJywgMTAwIC8gbiArICclJyk7XG4gICAgICAgIGNvbnRhaW5lcnMucHVzaChjb250YWluZXIpO1xuICAgICAgICBqcW8uYXBwZW5kKGNvbnRhaW5lcik7XG5cbiAgICAgICAgbGV0IHRyYWNrID0gbmV3IFRyYWNrKCk7XG4gICAgICAgIHRoaXMuc3ViVHJhY2tzLnB1c2godHJhY2spO1xuICAgICAgICB0cmFjay5pbmplY3RDb250ZW50KGNvbnRhaW5lcik7XG4gICAgfVxuXG4gICAgdGhpcy5zZXRDb250ZW50KGpxbyk7XG59O1xuXG5UcmFjay5Gb3JrLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVHJhY2suRWxlbWVudC5wcm90b3R5cGUpO1xuVHJhY2suRm9yay5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBUcmFjay5Gb3JrO1xuXG5UcmFjay5TdGFydE5vZGUgPSBmdW5jdGlvbihwYXJlbnRUcmFjaykge1xuICAgIFRyYWNrLkVsZW1lbnQuY2FsbCh0aGlzKTtcblxuICAgIGxldCBqcW8gPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIGpxby5hZGRDbGFzcygnZmxvd3RyYWNrc3RhcnRub2RlJyk7XG4gICAganFvLmNzcygnbWFyZ2luJywgJzAgYXV0bycpO1xuXG4gICAganFvLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIH0pO1xuXG4gICAgdGhpcy5zZXRDb250ZW50KGpxbyk7XG59O1xuXG5UcmFjay5TdGFydE5vZGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUcmFjay5FbGVtZW50LnByb3RvdHlwZSk7XG5UcmFjay5TdGFydE5vZGUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHJhY2suU3RhcnROb2RlO1xuXG5UcmFjay5TZWdtZW50ID0gZnVuY3Rpb24ocGFyZW50VHJhY2spIHtcbiAgICBUcmFjay5FbGVtZW50LmNhbGwodGhpcyk7XG5cbiAgICB0aGlzLnBhcmVudFRyYWNrID0gcGFyZW50VHJhY2s7XG5cbiAgICBsZXQganFvID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBqcW8uYWRkQ2xhc3MoJ2Zsb3d0cmFjaycpO1xuICAgIGpxby5hZGRDbGFzcygnZmxvd3RyYWNrc2VnbWVudCcpO1xuICAgIGpxby5jc3MoJ3Bvc2l0aW9uJywgJ3JlbGF0aXZlJyk7XG4gICAganFvLmNzcygnbWFyZ2luJywgJzAgYXV0bycpO1xuXG4gICAgdGhpcy5hZGRCdG4gPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIHRoaXMuYWRkQnRuLmFkZENsYXNzKCdmbG93dHJhY2tzZWdtZW50YWRkJyk7XG4gICAgdGhpcy5hZGRCdG4uY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xuICAgIHRoaXMuYWRkQnRuLmNzcygnei1pbmRleCcsICcxJyk7XG5cbiAgICBsZXQgYWRkQnRuSGFuZGxlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgZiA9IG5ldyBGbG93Tm9kZSgpO1xuICAgICAgICBwYXJlbnRUcmFjay5hZGRDaGlsZChmKTtcbiAgICAgICAgcGFyZW50VHJhY2suYWRkU2VnbWVudCgpO1xuICAgIH07XG5cbiAgICB0aGlzLmFkZEJ0bi5vbignY2xpY2snLCAoZXZlbnQpID0+IHtcbiAgICAgICAgbGV0IG9mZnNldCA9IGpxby5vZmZzZXQoKTtcbiAgICAgICAgUGFsZXR0ZS5nZXQoJCgnYm9keScpKS5zaG93KHtcbiAgICAgICAgICAgIHg6IG9mZnNldC5sZWZ0ICsganFvLndpZHRoKCkgLyAyLFxuICAgICAgICAgICAgeTogb2Zmc2V0LnRvcCArIGpxby5oZWlnaHQoKSAvIDIsXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIGFkZDogYWRkQnRuSGFuZGxlcixcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyBqcW8uYXBwZW5kKHRoaXMuYWRkQnRuKTsgLy8gZGlzYWJsaW5nIGlubGluZSBwYWxldHRlIGZvciBub3dcblxuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xuXG4gICAgdGhpcy51cGRhdGVMYXlvdXQoKTtcbn07XG5cblRyYWNrLlNlZ21lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUcmFjay5FbGVtZW50LnByb3RvdHlwZSk7XG5UcmFjay5TZWdtZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRyYWNrLlNlZ21lbnQ7XG5cblRyYWNrLlNlZ21lbnQucHJvdG90eXBlLnVwZGF0ZUxheW91dCA9IGZ1bmN0aW9uKCkge1xuICAgIGxldCBvZmZzZXQgPSB0aGlzLmdldENvbnRlbnQoKS5vZmZzZXQoKTtcblxuICAgIGxldCB4ID1cbiAgICAgICAgb2Zmc2V0LmxlZnQgKyAodGhpcy5nZXRDb250ZW50KCkud2lkdGgoKSAtIHRoaXMuYWRkQnRuLndpZHRoKCkpIC8gMjtcbiAgICBsZXQgeSA9XG4gICAgICAgIG9mZnNldC50b3AgKyAodGhpcy5nZXRDb250ZW50KCkuaGVpZ2h0KCkgLSB0aGlzLmFkZEJ0bi5oZWlnaHQoKSkgLyAyO1xuXG4gICAgdGhpcy5hZGRCdG4uY3NzKCdsZWZ0JywgeCk7XG4gICAgdGhpcy5hZGRCdG4uY3NzKCd0b3AnLCB5KTtcbn07XG5cbmV4cG9ydCB7VHJhY2t9O1xuIiwiaW1wb3J0IHtUcmFja30gZnJvbSAnLi9UcmFjay5qcyc7XG5pbXBvcnQge1VJRWxlbWVudH0gZnJvbSAnLi9VSUVsZW1lbnQuanMnO1xuXG4vKipcbiogQSByZXByZXNlbnRhdGlvbiBvZiBhIG5vZGUgd2l0aGluIGEgcHJvZ3JhbS4gSW5jbHVkZXMgVUkgYW5kIG90aGVyIGZ1bmN0aW9uc1xuKiB0byBpbnRlZ3JhdGUgd2l0aCB0aGUgcHJvZ3JhbSBhcyBhIHdob2xlXG4qXG4qIEV4dGVybmFsIGRlcGVuZGVuY2llczogalF1ZXJ5VUlcbipcbiogQHBhcmFtIHtudW1iZXI9fSB3aWR0aCB3aWR0aCBvZiB0aGUgbm9kZSBpbiB1bml0c1xuKiBAcGFyYW0ge251bWJlcj19IGhlaWdodCBoZWlnaHQgb2YgdGhlIG5vZGUgaW4gdW5pdHNcbiovXG5mdW5jdGlvbiBGbG93Tm9kZSh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgVHJhY2suRWxlbWVudC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuaXNGbG93Tm9kZSA9IHRydWU7XG5cbiAgICB0aGlzLndpZHRoID0gd2lkdGggIT09IHVuZGVmaW5lZCA/IHdpZHRoIDogMTtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodCAhPT0gdW5kZWZpbmVkID8gaGVpZ2h0IDogMTtcbiAgICB0aGlzLnBvcnRzID0gW107XG5cbiAgICBsZXQganFvID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBqcW8uZHJhZ2dhYmxlKHtncmlkOiBbMjAsIDIwXX0pO1xuICAgIGpxby5hZGRDbGFzcygnZmxvd25vZGUnKTtcblxuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xuXG4gICAgdGhpcy5zZXRTaXplKHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcblxuICAgIHRoaXMuZXhlYyA9IGZ1bmN0aW9uKGRlbGF5SW4pIHtcbiAgICAgICAgLy8gZG8gc3R1ZmZcbiAgICAgICAgbGV0IGRlbGF5T3V0ID0gZGVsYXlJbjtcbiAgICAgICAgcmV0dXJuIGRlbGF5T3V0O1xuICAgIH07XG59O1xuXG5GbG93Tm9kZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFRyYWNrLkVsZW1lbnQucHJvdG90eXBlKTtcbkZsb3dOb2RlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZsb3dOb2RlO1xuXG5GbG93Tm9kZS5wcm90b3R5cGUuc2V0U2l6ZSA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3dpZHRoJywgMTEwICogd2lkdGggLSAxMCk7XG4gICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdoZWlnaHQnLCAxMTAgKiBoZWlnaHQgLSAxMCk7XG59O1xuXG5GbG93Tm9kZS5wcm90b3R5cGUuYWRkUG9ydCA9IGZ1bmN0aW9uKGRvY2tpbmcsIG9mZnNldCwgbGFiZWwpIHtcbiAgICBsZXQgcG9ydCA9IG5ldyBGbG93Tm9kZS5Qb3J0KHRoaXMsIGRvY2tpbmcsIG9mZnNldCwgbGFiZWwpO1xuICAgIHRoaXMucG9ydHMucHVzaChwb3J0KTtcbiAgICByZXR1cm4gcG9ydDtcbn07XG5cbi8qKlxuKiBAcGFyYW0ge0Zsb3dOb2RlfSBwYXJlbnRcbiogQHBhcmFtIHtzdHJpbmc9fSBkb2NraW5nXG4qIEBwYXJhbSB7bnVtYmVyPX0gb2Zmc2V0XG4qIEBwYXJhbSB7c3RyaW5nPX0gbGFiZWxcbiovXG5GbG93Tm9kZS5Qb3J0ID0gZnVuY3Rpb24ocGFyZW50LCBkb2NraW5nLCBvZmZzZXQsIGxhYmVsKSB7XG4gICAgVUlFbGVtZW50LmNhbGwodGhpcyk7XG4gICAgdGhpcy5pc0Zsb3dOb2RlUG9ydCA9IHRydWU7XG5cbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLmRvY2tpbmcgPSBkb2NraW5nICE9PSB1bmRlZmluZWQgPyBkb2NraW5nIDogJ3RsJztcbiAgICB0aGlzLm9mZnNldCA9IG9mZnNldCAhPT0gdW5kZWZpbmVkID8gb2Zmc2V0IDogMDtcbiAgICB0aGlzLmxhYmVsID0gbGFiZWwgIT09IHVuZGVmaW5lZCA/IGxhYmVsIDogJyc7XG5cbiAgICBsZXQgcG9ydERpdiA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgcG9ydERpdi5jc3MoJ2Rpc3BsYXknLCAnaW5saW5lLWJsb2NrJyk7XG4gICAgcG9ydERpdi5hZGRDbGFzcygnZmxvd25vZGVwb3J0Jyk7XG5cbiAgICBsZXQganFvID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBqcW8uY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xuICAgIGpxby5hcHBlbmQocG9ydERpdik7XG4gICAganFvLmFwcGVuZCgnICcgKyBsYWJlbCk7XG4gICAgdGhpcy5zZXRDb250ZW50KGpxbyk7XG5cbiAgICB0aGlzLmluamVjdENvbnRlbnQocGFyZW50LmdldENvbnRlbnQoKSk7XG4gICAgdGhpcy51cGRhdGVMYXlvdXQoKTtcblxuICAgIGxldCBjb25uZWN0b3IgPSBudWxsO1xuICAgIGxldCBfc2VsZiA9IHRoaXM7XG4gICAgcG9ydERpdi5vbignbW91c2Vkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgZXZlbnQub3JpZ2luYWxFdmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZXZlbnQub3JpZ2luYWxFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGxldCByID0gcG9ydERpdlswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgbGV0IHggPSAoci5sZWZ0ICsgci5yaWdodCkgLyAyKyB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgbGV0IHkgPSAoci50b3AgKyByLmJvdHRvbSkgLyAyICsgd2luZG93LnNjcm9sbFk7XG5cbiAgICAgICAgY29ubmVjdG9yID0gbmV3IEZsb3dOb2RlLkNvbm5lY3Rvcih7eDogeCwgeTogeX0pO1xuICAgICAgICBjb25uZWN0b3IuaW5qZWN0Q29udGVudChfc2VsZi5wYXJlbnQuZ2V0Q29udGVudENvbnRhaW5lcigpKTtcbiAgICB9KTtcblxuICAgIGxldCBnZXROZWFyYnlQb3J0cyA9IGZ1bmN0aW9uKGNsaWVudFgsIGNsaWVudFkpIHtcbiAgICAgICAgbGV0IG5lYXJieSA9IFtdO1xuICAgICAgICAkKCcuZmxvd25vZGVwb3J0JykuZWFjaCgoaW5kZXgsIGRvbSkgPT4ge1xuICAgICAgICAgICAgbGV0IGVsZW0gPSAkKGRvbSk7XG4gICAgICAgICAgICBsZXQgciA9IGVsZW1bMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgICAgIGxldCBjeCA9IChyLmxlZnQgKyByLnJpZ2h0KSAvIDI7XG4gICAgICAgICAgICBsZXQgY3kgPSAoci50b3AgKyByLmJvdHRvbSkgLyAyO1xuXG4gICAgICAgICAgICBsZXQgZDIgPSBNYXRoLnBvdyhjeCAtIGNsaWVudFgsIDIpICsgTWF0aC5wb3coY3kgLSBjbGllbnRZLCAyKTtcbiAgICAgICAgICAgIGlmIChkMiA8IDEwMCkgbmVhcmJ5LnB1c2goVUlFbGVtZW50Lmxvb2t1cEJ5VWlkKGVsZW0uYXR0cigndWlkJykpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZWFyYnk7XG4gICAgfTtcblxuICAgIHRoaXMucGFyZW50LmdldENvbnRlbnRDb250YWluZXIoKS5vbignbW91c2Vtb3ZlJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChjb25uZWN0b3IgIT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IHggPSBldmVudC5vcmlnaW5hbEV2ZW50LmNsaWVudFggKyB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgICAgIGxldCB5ID0gZXZlbnQub3JpZ2luYWxFdmVudC5jbGllbnRZICsgd2luZG93LnNjcm9sbFk7XG5cbiAgICAgICAgICAgIGxldCBucCA9IGdldE5lYXJieVBvcnRzKGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2xpZW50WCwgZXZlbnQub3JpZ2luYWxFdmVudC5jbGllbnRZKTtcbiAgICAgICAgICAgIGlmIChucC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgbGV0IHIgPSBucFswXS5nZXRDb250ZW50KClbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgeCA9IChyLmxlZnQgKyByLnJpZ2h0KSAvIDIgKyB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgICAgICAgICB5ID0gKHIudG9wICsgci5ib3R0b20pIC8gMisgd2luZG93LnNjcm9sbFk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbm5lY3Rvci5zZXRUYXJnZXQoe3g6IHgsIHk6IHl9KTtcbiAgICAgICAgICAgIGNvbm5lY3Rvci51cGRhdGVMYXlvdXQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5wYXJlbnQuZ2V0Q29udGVudENvbnRhaW5lcigpLm9uKCdtb3VzZXVwJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChjb25uZWN0b3IgIT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IG5wID0gZ2V0TmVhcmJ5UG9ydHMoZXZlbnQub3JpZ2luYWxFdmVudC5jbGllbnRYLCBldmVudC5vcmlnaW5hbEV2ZW50LmNsaWVudFkpO1xuICAgICAgICAgICAgaWYgKG5wLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBsZXQgciA9IG5wWzBdLmdldENvbnRlbnQoKVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICBsZXQgeCA9IChyLmxlZnQgKyByLnJpZ2h0KSAvIDIgKyB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgICAgICAgICBsZXQgeSA9IChyLnRvcCArIHIuYm90dG9tKSAvIDIgKyB3aW5kb3cuc2Nyb2xsWTtcblxuICAgICAgICAgICAgICAgIGxldCBjID0gbmV3IEZsb3dOb2RlLkNvbm5lY3Rvcihjb25uZWN0b3Iub3JpZ2luLCB7eDogeCwgeTogeX0pO1xuICAgICAgICAgICAgICAgIGMuaW5qZWN0Q29udGVudChfc2VsZi5wYXJlbnQuZ2V0Q29udGVudENvbnRhaW5lcigpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29ubmVjdG9yLnJlbW92ZUNvbnRlbnQoKTtcbiAgICAgICAgICAgIGNvbm5lY3RvciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbkZsb3dOb2RlLlBvcnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUVsZW1lbnQucHJvdG90eXBlKTtcbkZsb3dOb2RlLlBvcnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmxvd05vZGUuUG9ydDtcblxuRmxvd05vZGUuUG9ydC5wcm90b3R5cGUudXBkYXRlTGF5b3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgc3dpdGNoICh0aGlzLmRvY2tpbmdbMF0pIHtcbiAgICAgICAgY2FzZSAndCc6XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygndG9wJywgMCk7XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnYm90dG9tJywgJycpO1xuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2xlZnQnLCAnJyk7XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygncmlnaHQnLCAnJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdiJzpcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCd0b3AnLCAnJyk7XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnYm90dG9tJywgMCk7XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnbGVmdCcsICcnKTtcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdyaWdodCcsICcnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2wnOlxuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3RvcCcsICcnKTtcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdib3R0b20nLCAnJyk7XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnbGVmdCcsIDApO1xuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3JpZ2h0JywgJycpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncic6XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygndG9wJywgJycpO1xuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2JvdHRvbScsICcnKTtcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdsZWZ0JywgJycpO1xuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3JpZ2h0JywgMCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIGRvY2tpbmcgb3B0aW9uIFxcJycgKyB0aGlzLmRvY2tpbmcgKyAnXFwnIScpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgbGV0IHBpeGVsT2Zmc2V0ID0gMTUgKiAodGhpcy5vZmZzZXQgKyAxKTtcbiAgICBzd2l0Y2ggKHRoaXMuZG9ja2luZ1sxXSkge1xuICAgICAgICBjYXNlICd0JzpcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCd0b3AnLCBwaXhlbE9mZnNldCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdiJzpcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdib3R0b20nLCBwaXhlbE9mZnNldCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdsJzpcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdsZWZ0JywgcGl4ZWxPZmZzZXQpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncic6XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygncmlnaHQnLCBwaXhlbE9mZnNldCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIGRvY2tpbmcgb3B0aW9uIFxcJycgKyB0aGlzLmRvY2tpbmcgKyAnXFwnIScpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufTtcblxuLyoqXG4qXG4qIEBwYXJhbSB7T2JqZWN0PX0gb3JpZ2luXG4qIEBwYXJhbSB7T2JqZWN0PX0gdGFyZ2V0XG4qL1xuRmxvd05vZGUuQ29ubmVjdG9yID0gZnVuY3Rpb24ob3JpZ2luLCB0YXJnZXQpIHtcbiAgICBVSUVsZW1lbnQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmlzRmxvd05vZGVDb25uZWN0b3IgPSB0cnVlO1xuXG4gICAgdGhpcy5vcmlnaW4gPSBvcmlnaW4gIT09IHVuZGVmaW5lZCA/IG9yaWdpbiA6IHt4OiAwLCB5OiAwfTtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldCAhPT0gdW5kZWZpbmVkID8gdGFyZ2V0IDogdGhpcy5vcmlnaW47XG5cbiAgICBsZXQgbnMgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuICAgIHRoaXMuc3ZnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5zLCAnc3ZnJyk7XG5cbiAgICB0aGlzLnJlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMsICdyZWN0Jyk7XG4gICAgdGhpcy5zdmcuYXBwZW5kQ2hpbGQodGhpcy5yZWN0KTtcblxuICAgIGxldCBqcW8gPSAkKHRoaXMuc3ZnKTtcbiAgICBqcW8uY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xuXG4gICAgdGhpcy51cGRhdGVMYXlvdXQoKTtcbn07XG5cbkZsb3dOb2RlLkNvbm5lY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRWxlbWVudC5wcm90b3R5cGUpO1xuRmxvd05vZGUuQ29ubmVjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZsb3dOb2RlLkNvbm5lY3RvcjtcblxuRmxvd05vZGUuQ29ubmVjdG9yLnByb3RvdHlwZS51cGRhdGVMYXlvdXQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN2Zy5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnd2lkdGgnLFxuICAgIE1hdGguYWJzKHRoaXMub3JpZ2luLnggLSB0aGlzLnRhcmdldC54KSk7XG4gICAgdGhpcy5zdmcuc2V0QXR0cmlidXRlTlMobnVsbCwgJ2hlaWdodCcsXG4gICAgTWF0aC5hYnModGhpcy5vcmlnaW4ueSAtIHRoaXMudGFyZ2V0LnkpKTtcblxuICAgIHRoaXMucmVjdC5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnd2lkdGgnLFxuICAgIE1hdGguYWJzKHRoaXMub3JpZ2luLnggLSB0aGlzLnRhcmdldC54KSk7XG4gICAgdGhpcy5yZWN0LnNldEF0dHJpYnV0ZU5TKG51bGwsICdoZWlnaHQnLFxuICAgIE1hdGguYWJzKHRoaXMub3JpZ2luLnkgLSB0aGlzLnRhcmdldC55KSk7XG4gICAgdGhpcy5yZWN0LnNldEF0dHJpYnV0ZU5TKG51bGwsICdmaWxsJywgJyNmMDYnKTtcblxuICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnbGVmdCcsIE1hdGgubWluKHRoaXMub3JpZ2luLngsIHRoaXMudGFyZ2V0LngpKTtcbiAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3RvcCcsIE1hdGgubWluKHRoaXMub3JpZ2luLnksIHRoaXMudGFyZ2V0LnkpKTtcbn07XG5cbkZsb3dOb2RlLkNvbm5lY3Rvci5wcm90b3R5cGUuc2V0VGFyZ2V0ID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG59O1xuXG5leHBvcnQge0Zsb3dOb2RlfTtcbiIsImltcG9ydCB7Rmxvd05vZGV9IGZyb20gJy4uL3VpL0Zsb3dOb2RlLmpzJztcblxuLyoqXG4qIEEgc3ludGhlc2l6ZXIgbW9kdWxlIHRoYXQgY29tYmluZXMgZGlmZmVyZW50IGZyZXF1ZW5jaWVzXG4qIEByZXR1cm4geyp9IFJldHVybnMgbnVsbCBpZiBlcnJvclxuKi9cbmZ1bmN0aW9uIEZvdXJpZXJTeW50aCgpIHtcbiAgICBGbG93Tm9kZS5jYWxsKHRoaXMsIDMsIDQpO1xuXG4gICAgaWYgKHdpbmRvdy5Ub25lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6IE1vZHVsZSBGb3VyaWVyU3ludGggcmVxdWlyZXMgVG9uZS5qcyEnKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5sZXZlbHMgPSA1O1xuICAgIHRoaXMuZnVuZGFtZW50YWxGcmVxID0gNDQwO1xuICAgIHRoaXMucGFydGlhbHMgPSBbMCwgMCwgMCwgMCwgMF07XG5cbiAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgIHRoaXMub3NjID0gbnVsbDtcblxuICAgIHRoaXMudmlzdWFsaXphdGlvbiA9ICQoJzxkaXY+PC9kaXY+Jyk7XG5cbiAgICB0aGlzLndhdmVTdW0gPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIHRoaXMud2F2ZVN1bS5hdHRyKCdpZCcsICd3YXZlX3N1bV8nICsgdGhpcy51aWQpO1xuICAgIHRoaXMud2F2ZVN1bS5jc3Moe1xuICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6ICd3aGl0ZScsXG4gICAgfSk7XG4gICAgdGhpcy52aXN1YWxpemF0aW9uLmFwcGVuZCh0aGlzLndhdmVTdW0pO1xuXG4gICAgLy8gdGhpcy53YXZlUGFydGlhbHMgPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIC8vIHRoaXMudmlzdWFsaXphdGlvbi5hcHBlbmQodGhpcy53YXZlUGFydGlhbHMpO1xuXG4gICAgbGV0IHNlbGZfID0gdGhpcztcblxuICAgIHRoaXMuY29udHJvbHMgPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIHRoaXMuY29udHJvbHMuY3NzKHtcbiAgICAgICAgJ3RleHQtYWxpZ24nOiAnY2VudGVyJyxcbiAgICB9KTtcblxuICAgIGxldCBmdW5kYW1lbnRhbEZyZXEgPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIGxldCBmZkxhYmVsID0gJCgnPHNwYW4+RnVuZGFtZW50YWwgRnJlcXVlbmN5OiA8L3NwYW4+Jyk7XG4gICAgbGV0IGZmVGV4dCA9ICQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHZhbHVlPScgKyB0aGlzLmZ1bmRhbWVudGFsRnJlcSArICcgLz4nKTtcbiAgICBmZlRleHQub24oJ2lucHV0JywgKCkgPT4ge1xuICAgICAgICB0aGlzLmZ1bmRhbWVudGFsRnJlcSA9IHBhcnNlRmxvYXQoZmZUZXh0LnZhbCgpKTtcbiAgICAgICAgdGhpcy5kcmF3KCk7XG4gICAgICAgIHRoaXMuc3RvcCgpO1xuICAgIH0pO1xuICAgIGZ1bmRhbWVudGFsRnJlcS5hcHBlbmQoZmZMYWJlbCk7XG4gICAgZnVuZGFtZW50YWxGcmVxLmFwcGVuZChmZlRleHQpO1xuICAgIHRoaXMuY29udHJvbHMuYXBwZW5kKGZ1bmRhbWVudGFsRnJlcSk7XG5cbiAgICB0aGlzLnBhcnRpYWxDb250cm9scyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5sZXZlbHM7IGkrKykge1xuICAgICAgICBsZXQgY29udHJvbCA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgICAgIGxldCBsYWJlbCA9IG51bGw7XG4gICAgICAgIGlmIChpID09IDApIHtcbiAgICAgICAgICAgIGxhYmVsID0gJCgnPHNwYW4+Rjwvc3Bhbj4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxhYmVsID0gJCgnPHNwYW4+SCcgKyBpICsgJzwvc3Bhbj4nKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgc2xpZGVyID0gJCgnPGlucHV0IHR5cGU9XCJyYW5nZVwiIG1pbj0tMSBtYXg9MSBzdGVwPTAuMDEgdmFsdWU9MCAvPicpO1xuXG4gICAgICAgICgoaV8pID0+IHsgLy8gY2FwdHVyaW5nIGlcbiAgICAgICAgICAgIHNsaWRlci5vbignaW5wdXQnLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VsZl8ucGFydGlhbHNbaV9dID0gcGFyc2VGbG9hdChzbGlkZXIudmFsKCkpO1xuICAgICAgICAgICAgICAgIHNlbGZfLmRyYXcoKTtcbiAgICAgICAgICAgICAgICBpZiAoc2VsZl8uaXNQbGF5aW5nKSBzZWxmXy5zdGFydCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKGkpO1xuXG4gICAgICAgIGNvbnRyb2wuYXBwZW5kKGxhYmVsKTtcbiAgICAgICAgY29udHJvbC5hcHBlbmQoc2xpZGVyKTtcblxuICAgICAgICB0aGlzLmNvbnRyb2xzLmFwcGVuZChjb250cm9sKTtcblxuICAgICAgICB0aGlzLnBhcnRpYWxDb250cm9scy5wdXNoKGNvbnRyb2wpO1xuICAgIH1cblxuICAgIHRoaXMuc3RhcnRCdXR0b24gPSAkKCc8aW5wdXQgdHlwZT1cImJ1dHRvblwiIHZhbHVlPVwiU3RhcnRcIj4nKTtcbiAgICB0aGlzLnN0YXJ0QnV0dG9uLm9uKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNQbGF5aW5nKSB7XG4gICAgICAgICAgICBzZWxmXy5zdG9wKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmXy5zdGFydCgpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLmNvbnRyb2xzLmFwcGVuZCh0aGlzLnN0YXJ0QnV0dG9uKTtcblxuICAgIGxldCBqcW8gPSB0aGlzLmdldENvbnRlbnQoKTtcbiAgICBqcW8uY3NzKHtcbiAgICAgICAgJ292ZXJmbG93LXgnOiAnaGlkZGVuJyxcbiAgICAgICAgJ3BhZGRpbmcnOiAnMTBweCcsXG4gICAgfSk7XG4gICAganFvLmFwcGVuZCgnPGgyPkZvdXJpZXIgU3ludGg8L2gyPicpO1xuICAgIGpxby5hcHBlbmQodGhpcy52aXN1YWxpemF0aW9uKTtcbiAgICBqcW8uYXBwZW5kKHRoaXMuY29udHJvbHMpO1xuXG4gICAgdGhpcy5zZXRDb250ZW50KGpxbyk7XG59XG5cbkZvdXJpZXJTeW50aC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEZsb3dOb2RlLnByb3RvdHlwZSk7XG5Gb3VyaWVyU3ludGgucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRm91cmllclN5bnRoO1xuXG5Gb3VyaWVyU3ludGgucHJvdG90eXBlLmluamVjdENvbnRlbnQgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgRmxvd05vZGUucHJvdG90eXBlLmluamVjdENvbnRlbnQuY2FsbCh0aGlzLCBlbGVtZW50KTtcbiAgICB0aGlzLmFkZFBvcnQoJ2xiJywgMTEsICdmcmVxLiBpbicpO1xufTtcblxuRm91cmllclN5bnRoLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IHNlbGZfID0gdGhpcztcbiAgICBsZXQgZHJhd1Bsb3QgPSBmdW5jdGlvbihmbikge1xuICAgICAgICBmdW5jdGlvblBsb3Qoe1xuICAgICAgICAgICAgdGFyZ2V0OiAnI3dhdmVfc3VtXycgKyBzZWxmXy51aWQsXG4gICAgICAgICAgICB3aWR0aDogc2VsZl8uZ2V0Q29udGVudCgpLndpZHRoKCksXG4gICAgICAgICAgICBoZWlnaHQ6IDE1MCxcbiAgICAgICAgICAgIGRpc2FibGVab29tOiB0cnVlLFxuICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ3RpbWUgKG1zKScsXG4gICAgICAgICAgICAgICAgZG9tYWluOiBbMCwgMTAwMCAvIHNlbGZfLmZ1bmRhbWVudGFsRnJlcV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeUF4aXM6IHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ2FtcGxpdHVkZScsXG4gICAgICAgICAgICAgICAgZG9tYWluOiBbLTEsIDFdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdyaWQ6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiBbe1xuICAgICAgICAgICAgICAgIGZuOiBmbixcbiAgICAgICAgICAgIH1dLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gc3VtXG4gICAgbGV0IHN1bUZ1biA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wYXJ0aWFscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBzdW1GdW4ucHVzaCh0aGlzLnBhcnRpYWxzW2ldICsgJyAqIHNpbignXG4gICAgICAgICAgICArICgwLjAwMiAqIHRoaXMuZnVuZGFtZW50YWxGcmVxICogKGkgKyAxKSlcbiAgICAgICAgICAgICsgJyAqIFBJICogeCknKTtcbiAgICB9XG4gICAgc3VtRnVuID0gc3VtRnVuLmpvaW4oJyArICcpO1xuXG4gICAgdGhpcy53YXZlU3VtLmVtcHR5KCk7XG4gICAgZHJhd1Bsb3Qoc3VtRnVuKTtcblxuICAgIC8vIHBhcnRpYWxzXG59O1xuXG5Gb3VyaWVyU3ludGgucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuaXNQbGF5aW5nKSB0aGlzLnN0b3AoKTtcbiAgICB0aGlzLm9zYyA9IG5ldyBUb25lLk9tbmlPc2NpbGxhdG9yKHRoaXMuZnVuZGFtZW50YWxGcmVxLCAnc2luZScpO1xuICAgIHRoaXMub3NjLnBhcnRpYWxzID0gdGhpcy5wYXJ0aWFscztcbiAgICB0aGlzLm9zYy50b01hc3RlcigpO1xuICAgIHRoaXMub3NjLnN0YXJ0KCk7XG5cbiAgICB0aGlzLmlzUGxheWluZyA9IHRydWU7XG4gICAgdGhpcy5zdGFydEJ1dHRvbi52YWwoJ1N0b3AnKTtcbn07XG5cbkZvdXJpZXJTeW50aC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmlzUGxheWluZykge1xuICAgICAgICB0aGlzLm9zYy5zdG9wKCk7XG4gICAgICAgIHRoaXMub3NjLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgIHRoaXMuc3RhcnRCdXR0b24udmFsKCdTdGFydCcpO1xufTtcblxuZXhwb3J0IHtGb3VyaWVyU3ludGh9O1xuIiwiLy8gZXhwb3J0IHtTeW50aGVzaXplcn0gZnJvbSAnLi9hdWRpby9TeW50aGVzaXplci5qcyc7XG5cbmV4cG9ydCB7Rm91cmllclN5bnRofSBmcm9tICcuL21vZHVsZXMvRm91cmllclN5bnRoLmpzJztcblxuLy8gZXhwb3J0IHtGbG93Tm9kZX0gZnJvbSAnLi91aS9GbG93Tm9kZS5qcyc7XG4vLyBleHBvcnQge1RyYWNrfSBmcm9tICcuL3VpL1RyYWNrLmpzJztcbi8vIGV4cG9ydCB7VUlFbGVtZW50fSBmcm9tICcuL3VpL1VJRWxlbWVudC5qcyc7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7O0FBS0EsU0FBUyxTQUFTLEdBQUc7SUFDakIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7O0lBRXhCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0lBQ3pCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7O0lBRTdCLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDO0NBQzlCOztBQUVELFNBQVMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ2xCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDOztBQUV0QixTQUFTLENBQUMsV0FBVyxHQUFHLFNBQVMsR0FBRyxFQUFFO0lBQ2xDLE9BQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNoQyxDQUFDOzs7Ozs7QUFNRixTQUFTLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxTQUFTLE9BQU8sRUFBRTtJQUMvQyxJQUFJLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQzs7SUFFNUIsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxD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
