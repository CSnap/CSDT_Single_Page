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
* A representation of a node within a program. Includes UI and other functions
* to integrate with the program as a whole
*
* External dependencies: jQueryUI
*
* @param {number=} width width of the node in units
* @param {number=} height height of the node in units
*/
function FlowNode(width, height) {
    UIElement.call(this);
    this.isFlowNode = true;

    this.width = width !== undefined ? width : 1;
    this.height = height !== undefined ? height : 1;
    this.ports = [];

    let self_ = this;
    let ondrag = function() {
        self_.ports.forEach((port) => port.ondrag());
    };

    let jqo = $('<div></div>');
    jqo.draggable({grid: [20, 20], drag: ondrag});
    jqo.addClass('flownode');

    this.setContent(jqo);

    this.setSize(this.width, this.height);

    this.exec = function(delayIn) {
        // do stuff
        let delayOut = delayIn;
        return delayOut;
    };
}

FlowNode.prototype = Object.create(UIElement.prototype);
FlowNode.prototype.constructor = FlowNode;

FlowNode.prototype.injectContent = function(element) {
    UIElement.prototype.injectContent.call(this, element);
    let self_ = this;
    this.ports.forEach((port) => port.injectContent(self_.getContent()));
};

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

    this.portDiv = $('<div></div>');
    this.portDiv.css('display', 'inline-block');
    this.portDiv.addClass('flownodeport');

    let jqo = $('<div></div>');
    jqo.addClass('flownodeportcontainer');
    jqo.css('position', 'absolute');
    jqo.append(this.portDiv);
    jqo.append(' ' + label);
    this.setContent(jqo);

    this.updateLayout();

    this.connectionsIn = [];
    this.connectionsOut = [];

    let connector = null;
    let _self = this;
    this.portDiv.on('mousedown', function(event) {
        event.originalEvent.stopPropagation();
        event.originalEvent.preventDefault();

        let r = _self.portDiv[0].getBoundingClientRect();
        let x = (r.left + r.right) / 2+ window.scrollX;
        let y = (r.top + r.bottom) / 2 + window.scrollY;

        connector = new FlowNode.Connector({x: x, y: y});
        connector.injectContent(_self.parent.getContentContainer());
    });

    let getNearbyPorts = function(clientX, clientY) {
        let nearby = [];
        $('.flownodeportcontainer').each((index, dom) => {
            let elem = $(dom);
            let inner = $(dom).children('.flownodeport');
            let r = inner[0].getBoundingClientRect();

            let cx = (r.left + r.right) / 2;
            let cy = (r.top + r.bottom) / 2;

            let d2 = Math.pow(cx - clientX, 2) + Math.pow(cy - clientY, 2);
            if (d2 < 100) nearby.push(UIElement.lookupByUid(elem.attr('uid')));
        });
        return nearby;
    };

    $('body').on('mousemove', (event) => {
        if (connector != null) {
            let x = event.originalEvent.clientX + window.scrollX;
            let y = event.originalEvent.clientY + window.scrollY;

            let np = getNearbyPorts(event.originalEvent.clientX,
                event.originalEvent.clientY);
            if (np.length > 0) {
                let inner = np[0].portDiv;
                let r = inner[0].getBoundingClientRect();
                x = (r.left + r.right) / 2 + window.scrollX;
                y = (r.top + r.bottom) / 2 + window.scrollY;
            }

            connector.setTarget({x: x, y: y});
            connector.updateLayout();
        }
    });

    $('body').on('mouseup', (event) => {
        if (connector != null) {
            let np = getNearbyPorts(event.originalEvent.clientX,
                event.originalEvent.clientY);
            if (np.length > 0) {
                let inner = np[0].portDiv;
                let r = inner[0].getBoundingClientRect();
                let x = (r.left + r.right) / 2 + window.scrollX;
                let y = (r.top + r.bottom) / 2 + window.scrollY;

                let c = new FlowNode.Connector(connector.origin, {x: x, y: y});
                c.injectContent(_self.parent.getContentContainer());

                np[0].addConnectionIn(c);
                _self.addConnectionOut(c);

                np[0].onConnectIn(_self.args());
                _self.onConnectOut(np[0].args());
            }

            connector.removeContent();
            connector = null;
        }
    });

    this.ondrag = function() {
        let r = _self.portDiv[0].getBoundingClientRect();
        let x = (r.left + r.right) / 2 + window.scrollX;
        let y = (r.top + r.bottom) / 2 + window.scrollY;

        _self.connectionsIn.forEach((connection) => {
            connection.setTarget({x: x, y: y});
            connection.updateLayout();
        });

        _self.connectionsOut.forEach((connection) => {
            connection.setOrigin({x: x, y: y});
            connection.updateLayout();
        });
    };

    this.args = function() {
        return null;
    };

    this.onConnectIn = function() {
        return false;
    };

    this.onConnectOut = function() {
        return false;
    };
};

FlowNode.Port.prototype = Object.create(UIElement.prototype);
FlowNode.Port.prototype.constructor = FlowNode.Port;

FlowNode.Port.prototype.addConnectionIn = function(connector) {
    this.connectionsIn.push(connector);
};

FlowNode.Port.prototype.addConnectionOut = function(connector) {
    this.connectionsOut.push(connector);
};

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

    this.line = document.createElementNS(ns, 'line');
    this.svg.appendChild(this.line);

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


    if (this.origin.x < this.target.x) {
        this.line.setAttributeNS(null, 'x1', 0);
        this.line.setAttributeNS(null, 'x2',
            Math.abs(this.origin.x - this.target.x));
    } else {
        this.line.setAttributeNS(null, 'x1',
            Math.abs(this.origin.x - this.target.x));
        this.line.setAttributeNS(null, 'x2', 0);
    }
    if (this.origin.y < this.target.y) {
        this.line.setAttributeNS(null, 'y1', 0);
        this.line.setAttributeNS(null, 'y2',
            Math.abs(this.origin.y - this.target.y));
    } else {
        this.line.setAttributeNS(null, 'y1',
            Math.abs(this.origin.y - this.target.y));
        this.line.setAttributeNS(null, 'y2', 0);
    }
    this.line.setAttributeNS(null, 'style', 'stroke:#FF9200;stroke-width:2');

    this.getContent().css('left', Math.min(this.origin.x, this.target.x));
    this.getContent().css('top', Math.min(this.origin.y, this.target.y));
};

FlowNode.Connector.prototype.setOrigin = function(origin) {
    this.origin = origin;
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
    // this.osc.toMaster();    
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

/**
 * Output node
 * @return {*} Null if error
 */
function Master() {
    FlowNode.call(this, 1, 1);

    if (window.Tone === undefined) {
        console.error('Error: Module Master requires Tone.js!');
        return null;
    }

    let portIn = this.addPort('lb', 1, 'in');
    portIn.args = function() {
        return {type: 'AudioNode', audioNode: Tone.Master};
    };
}

Master.prototype = Object.create(FlowNode.prototype);
Master.prototype.constructor = Master;

// export {Synthesizer} from './audio/Synthesizer.js';

exports.FourierSynth = FourierSynth;
exports.Master = Master;
exports.FlowNode = FlowNode;
exports.UIElement = UIElement;

return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXVzaWNMYWIuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY3JpcHRzL3VpL1VJRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9zY3JpcHRzL3VpL0Zsb3dOb2RlLmpzIiwiLi4vLi4vc3JjL3NjcmlwdHMvbW9kdWxlcy9Gb3VyaWVyU3ludGguanMiLCIuLi8uLi9zcmMvc2NyaXB0cy9tb2R1bGVzL01hc3Rlci5qcyIsIi4uLy4uL3NyYy9zY3JpcHRzL011c2ljTGFiLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBBbiBhYnN0cmFjdCBjbGFzcyBmb3IgaGFuZGxpbmcgaW50ZWdyYXRpb24gd2l0aCBIVE1MXG4qXG4qIEV4dGVybmFsIGRlcGVuZGVuY2llczogalF1ZXJ5XG4qL1xuZnVuY3Rpb24gVUlFbGVtZW50KCkge1xuICAgIHRoaXMuaXNVSUVsZW1lbnQgPSB0cnVlO1xuXG4gICAgdGhpcy5qUXVlcnlPYmplY3QgPSBudWxsO1xuICAgIHRoaXMuY29udGVudENvbnRhaW5lciA9IG51bGw7XG5cbiAgICB0aGlzLnVpZCA9IFVJRWxlbWVudC51aWQrKztcbn1cblxuVUlFbGVtZW50LnVpZCA9IDA7XG5VSUVsZW1lbnQubG9va3VwID0ge307XG5cblVJRWxlbWVudC5sb29rdXBCeVVpZCA9IGZ1bmN0aW9uKHVpZCkge1xuICAgIHJldHVybiBVSUVsZW1lbnQubG9va3VwW3VpZF07XG59O1xuXG4vKipcbiogU2V0cyBjb250ZW50IHRvIGEgalF1ZXJ5IG9iamVjdFxuKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCBhIGpRdWVyeSBvYmplY3RcbiovXG5VSUVsZW1lbnQucHJvdG90eXBlLnNldENvbnRlbnQgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgdGhpcy5qUXVlcnlPYmplY3QgPSBlbGVtZW50O1xuXG4gICAgVUlFbGVtZW50Lmxvb2t1cFt0aGlzLnVpZF0gPSB0aGlzO1xuICAgIHRoaXMualF1ZXJ5T2JqZWN0LmF0dHIoJ3VpZCcsIHRoaXMudWlkKTtcbn07XG5cbi8qKlxuKiBJbmplY3RzIGNvbnRlbnQgaW50byBhIGpRdWVyeSBvYmplY3RcbiogQHBhcmFtIHtqUXVlcnkgfCBVSUVsZW1lbnR9IGVsZW1lbnQgalF1ZXJ5IG9iamVjdCB0byBpbmplY3QgY29udGVudCBpbnRvXG4qL1xuVUlFbGVtZW50LnByb3RvdHlwZS5pbmplY3RDb250ZW50ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICh0aGlzLmpRdWVyeU9iamVjdCA9PSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOiBDb250ZW50IG5vdCBzZXQhJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZWxlbWVudC5pc1VJRWxlbWVudCkge1xuICAgICAgICBlbGVtZW50LmpRdWVyeU9iamVjdC5hcHBlbmQodGhpcy5qUXVlcnlPYmplY3QpO1xuICAgICAgICB0aGlzLmNvbnRlbnRDb250YWluZXIgPSBlbGVtZW50LmpRdWVyeU9iamVjdDtcbiAgICB9IGVsc2UgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBqUXVlcnkpIHtcbiAgICAgICAgZWxlbWVudC5hcHBlbmQodGhpcy5qUXVlcnlPYmplY3QpO1xuICAgICAgICB0aGlzLmNvbnRlbnRDb250YWluZXIgPSBlbGVtZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOiBJbnZhbGlkIHR5cGUgKGVsZW1lbnQpIScpO1xuICAgIH1cbn07XG5cbi8qKlxuKiBSZW1vdmVzIHRoZSBVSUVsZW1lbnQgZnJvbSB0aGUgZG9jdW1lbnRcbiovXG5VSUVsZW1lbnQucHJvdG90eXBlLnJlbW92ZUNvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmpRdWVyeU9iamVjdC5yZW1vdmUoKTtcbiAgICBkZWxldGUgVUlFbGVtZW50Lmxvb2t1cFt0aGlzLnVpZF07XG59O1xuXG4vKipcbiogUmV0dXJucyB0aGUgYXNzb2NpYXRlZCBqUXVlcnkgT2JqZWN0XG4qIEByZXR1cm4ge2pRdWVyeX1cbiovXG5VSUVsZW1lbnQucHJvdG90eXBlLmdldENvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5qUXVlcnlPYmplY3Q7XG59O1xuXG5VSUVsZW1lbnQucHJvdG90eXBlLmdldENvbnRlbnRDb250YWluZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5jb250ZW50Q29udGFpbmVyO1xufTtcblxuZXhwb3J0IHtVSUVsZW1lbnR9O1xuIiwiaW1wb3J0IHtVSUVsZW1lbnR9IGZyb20gJy4vVUlFbGVtZW50LmpzJztcblxuLyoqXG4qIEEgcmVwcmVzZW50YXRpb24gb2YgYSBub2RlIHdpdGhpbiBhIHByb2dyYW0uIEluY2x1ZGVzIFVJIGFuZCBvdGhlciBmdW5jdGlvbnNcbiogdG8gaW50ZWdyYXRlIHdpdGggdGhlIHByb2dyYW0gYXMgYSB3aG9sZVxuKlxuKiBFeHRlcm5hbCBkZXBlbmRlbmNpZXM6IGpRdWVyeVVJXG4qXG4qIEBwYXJhbSB7bnVtYmVyPX0gd2lkdGggd2lkdGggb2YgdGhlIG5vZGUgaW4gdW5pdHNcbiogQHBhcmFtIHtudW1iZXI9fSBoZWlnaHQgaGVpZ2h0IG9mIHRoZSBub2RlIGluIHVuaXRzXG4qL1xuZnVuY3Rpb24gRmxvd05vZGUod2lkdGgsIGhlaWdodCkge1xuICAgIFVJRWxlbWVudC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuaXNGbG93Tm9kZSA9IHRydWU7XG5cbiAgICB0aGlzLndpZHRoID0gd2lkdGggIT09IHVuZGVmaW5lZCA/IHdpZHRoIDogMTtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodCAhPT0gdW5kZWZpbmVkID8gaGVpZ2h0IDogMTtcbiAgICB0aGlzLnBvcnRzID0gW107XG5cbiAgICBsZXQgc2VsZl8gPSB0aGlzO1xuICAgIGxldCBvbmRyYWcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZl8ucG9ydHMuZm9yRWFjaCgocG9ydCkgPT4gcG9ydC5vbmRyYWcoKSk7XG4gICAgfTtcblxuICAgIGxldCBqcW8gPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIGpxby5kcmFnZ2FibGUoe2dyaWQ6IFsyMCwgMjBdLCBkcmFnOiBvbmRyYWd9KTtcbiAgICBqcW8uYWRkQ2xhc3MoJ2Zsb3dub2RlJyk7XG5cbiAgICB0aGlzLnNldENvbnRlbnQoanFvKTtcblxuICAgIHRoaXMuc2V0U2l6ZSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG5cbiAgICB0aGlzLmV4ZWMgPSBmdW5jdGlvbihkZWxheUluKSB7XG4gICAgICAgIC8vIGRvIHN0dWZmXG4gICAgICAgIGxldCBkZWxheU91dCA9IGRlbGF5SW47XG4gICAgICAgIHJldHVybiBkZWxheU91dDtcbiAgICB9O1xufTtcblxuRmxvd05vZGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUVsZW1lbnQucHJvdG90eXBlKTtcbkZsb3dOb2RlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZsb3dOb2RlO1xuXG5GbG93Tm9kZS5wcm90b3R5cGUuaW5qZWN0Q29udGVudCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBVSUVsZW1lbnQucHJvdG90eXBlLmluamVjdENvbnRlbnQuY2FsbCh0aGlzLCBlbGVtZW50KTtcbiAgICBsZXQgc2VsZl8gPSB0aGlzO1xuICAgIHRoaXMucG9ydHMuZm9yRWFjaCgocG9ydCkgPT4gcG9ydC5pbmplY3RDb250ZW50KHNlbGZfLmdldENvbnRlbnQoKSkpO1xufTtcblxuRmxvd05vZGUucHJvdG90eXBlLnNldFNpemUgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG4gICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCd3aWR0aCcsIDExMCAqIHdpZHRoIC0gMTApO1xuICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnaGVpZ2h0JywgMTEwICogaGVpZ2h0IC0gMTApO1xufTtcblxuRmxvd05vZGUucHJvdG90eXBlLmFkZFBvcnQgPSBmdW5jdGlvbihkb2NraW5nLCBvZmZzZXQsIGxhYmVsKSB7XG4gICAgbGV0IHBvcnQgPSBuZXcgRmxvd05vZGUuUG9ydCh0aGlzLCBkb2NraW5nLCBvZmZzZXQsIGxhYmVsKTtcbiAgICB0aGlzLnBvcnRzLnB1c2gocG9ydCk7XG4gICAgcmV0dXJuIHBvcnQ7XG59O1xuXG4vKipcbiogQHBhcmFtIHtGbG93Tm9kZX0gcGFyZW50XG4qIEBwYXJhbSB7c3RyaW5nPX0gZG9ja2luZ1xuKiBAcGFyYW0ge251bWJlcj19IG9mZnNldFxuKiBAcGFyYW0ge3N0cmluZz19IGxhYmVsXG4qL1xuRmxvd05vZGUuUG9ydCA9IGZ1bmN0aW9uKHBhcmVudCwgZG9ja2luZywgb2Zmc2V0LCBsYWJlbCkge1xuICAgIFVJRWxlbWVudC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuaXNGbG93Tm9kZVBvcnQgPSB0cnVlO1xuXG4gICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgdGhpcy5kb2NraW5nID0gZG9ja2luZyAhPT0gdW5kZWZpbmVkID8gZG9ja2luZyA6ICd0bCc7XG4gICAgdGhpcy5vZmZzZXQgPSBvZmZzZXQgIT09IHVuZGVmaW5lZCA/IG9mZnNldCA6IDA7XG4gICAgdGhpcy5sYWJlbCA9IGxhYmVsICE9PSB1bmRlZmluZWQgPyBsYWJlbCA6ICcnO1xuXG4gICAgdGhpcy5wb3J0RGl2ID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICB0aGlzLnBvcnREaXYuY3NzKCdkaXNwbGF5JywgJ2lubGluZS1ibG9jaycpO1xuICAgIHRoaXMucG9ydERpdi5hZGRDbGFzcygnZmxvd25vZGVwb3J0Jyk7XG5cbiAgICBsZXQganFvID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBqcW8uYWRkQ2xhc3MoJ2Zsb3dub2RlcG9ydGNvbnRhaW5lcicpO1xuICAgIGpxby5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XG4gICAganFvLmFwcGVuZCh0aGlzLnBvcnREaXYpO1xuICAgIGpxby5hcHBlbmQoJyAnICsgbGFiZWwpO1xuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xuXG4gICAgdGhpcy51cGRhdGVMYXlvdXQoKTtcblxuICAgIHRoaXMuY29ubmVjdGlvbnNJbiA9IFtdO1xuICAgIHRoaXMuY29ubmVjdGlvbnNPdXQgPSBbXTtcblxuICAgIGxldCBjb25uZWN0b3IgPSBudWxsO1xuICAgIGxldCBfc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5wb3J0RGl2Lm9uKCdtb3VzZWRvd24nLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBldmVudC5vcmlnaW5hbEV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBldmVudC5vcmlnaW5hbEV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgbGV0IHIgPSBfc2VsZi5wb3J0RGl2WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBsZXQgeCA9IChyLmxlZnQgKyByLnJpZ2h0KSAvIDIrIHdpbmRvdy5zY3JvbGxYO1xuICAgICAgICBsZXQgeSA9IChyLnRvcCArIHIuYm90dG9tKSAvIDIgKyB3aW5kb3cuc2Nyb2xsWTtcblxuICAgICAgICBjb25uZWN0b3IgPSBuZXcgRmxvd05vZGUuQ29ubmVjdG9yKHt4OiB4LCB5OiB5fSk7XG4gICAgICAgIGNvbm5lY3Rvci5pbmplY3RDb250ZW50KF9zZWxmLnBhcmVudC5nZXRDb250ZW50Q29udGFpbmVyKCkpO1xuICAgIH0pO1xuXG4gICAgbGV0IGdldE5lYXJieVBvcnRzID0gZnVuY3Rpb24oY2xpZW50WCwgY2xpZW50WSkge1xuICAgICAgICBsZXQgbmVhcmJ5ID0gW107XG4gICAgICAgICQoJy5mbG93bm9kZXBvcnRjb250YWluZXInKS5lYWNoKChpbmRleCwgZG9tKSA9PiB7XG4gICAgICAgICAgICBsZXQgZWxlbSA9ICQoZG9tKTtcbiAgICAgICAgICAgIGxldCBpbm5lciA9ICQoZG9tKS5jaGlsZHJlbignLmZsb3dub2RlcG9ydCcpO1xuICAgICAgICAgICAgbGV0IHIgPSBpbm5lclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICAgICAgbGV0IGN4ID0gKHIubGVmdCArIHIucmlnaHQpIC8gMjtcbiAgICAgICAgICAgIGxldCBjeSA9IChyLnRvcCArIHIuYm90dG9tKSAvIDI7XG5cbiAgICAgICAgICAgIGxldCBkMiA9IE1hdGgucG93KGN4IC0gY2xpZW50WCwgMikgKyBNYXRoLnBvdyhjeSAtIGNsaWVudFksIDIpO1xuICAgICAgICAgICAgaWYgKGQyIDwgMTAwKSBuZWFyYnkucHVzaChVSUVsZW1lbnQubG9va3VwQnlVaWQoZWxlbS5hdHRyKCd1aWQnKSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5lYXJieTtcbiAgICB9O1xuXG4gICAgJCgnYm9keScpLm9uKCdtb3VzZW1vdmUnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGNvbm5lY3RvciAhPSBudWxsKSB7XG4gICAgICAgICAgICBsZXQgeCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2xpZW50WCArIHdpbmRvdy5zY3JvbGxYO1xuICAgICAgICAgICAgbGV0IHkgPSBldmVudC5vcmlnaW5hbEV2ZW50LmNsaWVudFkgKyB3aW5kb3cuc2Nyb2xsWTtcblxuICAgICAgICAgICAgbGV0IG5wID0gZ2V0TmVhcmJ5UG9ydHMoZXZlbnQub3JpZ2luYWxFdmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgIGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2xpZW50WSk7XG4gICAgICAgICAgICBpZiAobnAubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGxldCBpbm5lciA9IG5wWzBdLnBvcnREaXY7XG4gICAgICAgICAgICAgICAgbGV0IHIgPSBpbm5lclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICB4ID0gKHIubGVmdCArIHIucmlnaHQpIC8gMiArIHdpbmRvdy5zY3JvbGxYO1xuICAgICAgICAgICAgICAgIHkgPSAoci50b3AgKyByLmJvdHRvbSkgLyAyICsgd2luZG93LnNjcm9sbFk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbm5lY3Rvci5zZXRUYXJnZXQoe3g6IHgsIHk6IHl9KTtcbiAgICAgICAgICAgIGNvbm5lY3Rvci51cGRhdGVMYXlvdXQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJCgnYm9keScpLm9uKCdtb3VzZXVwJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChjb25uZWN0b3IgIT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IG5wID0gZ2V0TmVhcmJ5UG9ydHMoZXZlbnQub3JpZ2luYWxFdmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgIGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2xpZW50WSk7XG4gICAgICAgICAgICBpZiAobnAubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGxldCBpbm5lciA9IG5wWzBdLnBvcnREaXY7XG4gICAgICAgICAgICAgICAgbGV0IHIgPSBpbm5lclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICBsZXQgeCA9IChyLmxlZnQgKyByLnJpZ2h0KSAvIDIgKyB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgICAgICAgICBsZXQgeSA9IChyLnRvcCArIHIuYm90dG9tKSAvIDIgKyB3aW5kb3cuc2Nyb2xsWTtcblxuICAgICAgICAgICAgICAgIGxldCBjID0gbmV3IEZsb3dOb2RlLkNvbm5lY3Rvcihjb25uZWN0b3Iub3JpZ2luLCB7eDogeCwgeTogeX0pO1xuICAgICAgICAgICAgICAgIGMuaW5qZWN0Q29udGVudChfc2VsZi5wYXJlbnQuZ2V0Q29udGVudENvbnRhaW5lcigpKTtcblxuICAgICAgICAgICAgICAgIG5wWzBdLmFkZENvbm5lY3Rpb25JbihjKTtcbiAgICAgICAgICAgICAgICBfc2VsZi5hZGRDb25uZWN0aW9uT3V0KGMpO1xuXG4gICAgICAgICAgICAgICAgbnBbMF0ub25Db25uZWN0SW4oX3NlbGYuYXJncygpKTtcbiAgICAgICAgICAgICAgICBfc2VsZi5vbkNvbm5lY3RPdXQobnBbMF0uYXJncygpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29ubmVjdG9yLnJlbW92ZUNvbnRlbnQoKTtcbiAgICAgICAgICAgIGNvbm5lY3RvciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMub25kcmFnID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCByID0gX3NlbGYucG9ydERpdlswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgbGV0IHggPSAoci5sZWZ0ICsgci5yaWdodCkgLyAyICsgd2luZG93LnNjcm9sbFg7XG4gICAgICAgIGxldCB5ID0gKHIudG9wICsgci5ib3R0b20pIC8gMiArIHdpbmRvdy5zY3JvbGxZO1xuXG4gICAgICAgIF9zZWxmLmNvbm5lY3Rpb25zSW4uZm9yRWFjaCgoY29ubmVjdGlvbikgPT4ge1xuICAgICAgICAgICAgY29ubmVjdGlvbi5zZXRUYXJnZXQoe3g6IHgsIHk6IHl9KTtcbiAgICAgICAgICAgIGNvbm5lY3Rpb24udXBkYXRlTGF5b3V0KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIF9zZWxmLmNvbm5lY3Rpb25zT3V0LmZvckVhY2goKGNvbm5lY3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbm5lY3Rpb24uc2V0T3JpZ2luKHt4OiB4LCB5OiB5fSk7XG4gICAgICAgICAgICBjb25uZWN0aW9uLnVwZGF0ZUxheW91dCgpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdGhpcy5hcmdzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH07XG5cbiAgICB0aGlzLm9uQ29ubmVjdEluID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdGhpcy5vbkNvbm5lY3RPdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG59O1xuXG5GbG93Tm9kZS5Qb3J0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVUlFbGVtZW50LnByb3RvdHlwZSk7XG5GbG93Tm9kZS5Qb3J0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZsb3dOb2RlLlBvcnQ7XG5cbkZsb3dOb2RlLlBvcnQucHJvdG90eXBlLmFkZENvbm5lY3Rpb25JbiA9IGZ1bmN0aW9uKGNvbm5lY3Rvcikge1xuICAgIHRoaXMuY29ubmVjdGlvbnNJbi5wdXNoKGNvbm5lY3Rvcik7XG59O1xuXG5GbG93Tm9kZS5Qb3J0LnByb3RvdHlwZS5hZGRDb25uZWN0aW9uT3V0ID0gZnVuY3Rpb24oY29ubmVjdG9yKSB7XG4gICAgdGhpcy5jb25uZWN0aW9uc091dC5wdXNoKGNvbm5lY3Rvcik7XG59O1xuXG5GbG93Tm9kZS5Qb3J0LnByb3RvdHlwZS51cGRhdGVMYXlvdXQgPSBmdW5jdGlvbigpIHtcbiAgICBzd2l0Y2ggKHRoaXMuZG9ja2luZ1swXSkge1xuICAgICAgICBjYXNlICd0JzpcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCd0b3AnLCAwKTtcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdib3R0b20nLCAnJyk7XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnbGVmdCcsICcnKTtcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdyaWdodCcsICcnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2InOlxuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3RvcCcsICcnKTtcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdib3R0b20nLCAwKTtcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdsZWZ0JywgJycpO1xuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3JpZ2h0JywgJycpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbCc6XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygndG9wJywgJycpO1xuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2JvdHRvbScsICcnKTtcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdsZWZ0JywgMCk7XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygncmlnaHQnLCAnJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyJzpcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCd0b3AnLCAnJyk7XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnYm90dG9tJywgJycpO1xuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2xlZnQnLCAnJyk7XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygncmlnaHQnLCAwKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ludmFsaWQgZG9ja2luZyBvcHRpb24gXFwnJyArIHRoaXMuZG9ja2luZyArICdcXCchJyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBsZXQgcGl4ZWxPZmZzZXQgPSAxNSAqICh0aGlzLm9mZnNldCArIDEpO1xuICAgIHN3aXRjaCAodGhpcy5kb2NraW5nWzFdKSB7XG4gICAgICAgIGNhc2UgJ3QnOlxuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3RvcCcsIHBpeGVsT2Zmc2V0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2InOlxuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2JvdHRvbScsIHBpeGVsT2Zmc2V0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2wnOlxuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2xlZnQnLCBwaXhlbE9mZnNldCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyJzpcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdyaWdodCcsIHBpeGVsT2Zmc2V0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ludmFsaWQgZG9ja2luZyBvcHRpb24gXFwnJyArIHRoaXMuZG9ja2luZyArICdcXCchJyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59O1xuXG4vKipcbipcbiogQHBhcmFtIHtPYmplY3Q9fSBvcmlnaW5cbiogQHBhcmFtIHtPYmplY3Q9fSB0YXJnZXRcbiovXG5GbG93Tm9kZS5Db25uZWN0b3IgPSBmdW5jdGlvbihvcmlnaW4sIHRhcmdldCkge1xuICAgIFVJRWxlbWVudC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuaXNGbG93Tm9kZUNvbm5lY3RvciA9IHRydWU7XG5cbiAgICB0aGlzLm9yaWdpbiA9IG9yaWdpbiAhPT0gdW5kZWZpbmVkID8gb3JpZ2luIDoge3g6IDAsIHk6IDB9O1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0ICE9PSB1bmRlZmluZWQgPyB0YXJnZXQgOiB0aGlzLm9yaWdpbjtcblxuICAgIGxldCBucyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG4gICAgdGhpcy5zdmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMsICdzdmcnKTtcblxuICAgIHRoaXMubGluZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucywgJ2xpbmUnKTtcbiAgICB0aGlzLnN2Zy5hcHBlbmRDaGlsZCh0aGlzLmxpbmUpO1xuXG4gICAgbGV0IGpxbyA9ICQodGhpcy5zdmcpO1xuICAgIGpxby5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XG4gICAgdGhpcy5zZXRDb250ZW50KGpxbyk7XG5cbiAgICB0aGlzLnVwZGF0ZUxheW91dCgpO1xufTtcblxuRmxvd05vZGUuQ29ubmVjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVUlFbGVtZW50LnByb3RvdHlwZSk7XG5GbG93Tm9kZS5Db25uZWN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmxvd05vZGUuQ29ubmVjdG9yO1xuXG5GbG93Tm9kZS5Db25uZWN0b3IucHJvdG90eXBlLnVwZGF0ZUxheW91dCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuc3ZnLnNldEF0dHJpYnV0ZU5TKG51bGwsICd3aWR0aCcsXG4gICAgTWF0aC5hYnModGhpcy5vcmlnaW4ueCAtIHRoaXMudGFyZ2V0LngpKTtcbiAgICB0aGlzLnN2Zy5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnaGVpZ2h0JyxcbiAgICBNYXRoLmFicyh0aGlzLm9yaWdpbi55IC0gdGhpcy50YXJnZXQueSkpO1xuXG5cbiAgICBpZiAodGhpcy5vcmlnaW4ueCA8IHRoaXMudGFyZ2V0LngpIHtcbiAgICAgICAgdGhpcy5saW5lLnNldEF0dHJpYnV0ZU5TKG51bGwsICd4MScsIDApO1xuICAgICAgICB0aGlzLmxpbmUuc2V0QXR0cmlidXRlTlMobnVsbCwgJ3gyJyxcbiAgICAgICAgICAgIE1hdGguYWJzKHRoaXMub3JpZ2luLnggLSB0aGlzLnRhcmdldC54KSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5saW5lLnNldEF0dHJpYnV0ZU5TKG51bGwsICd4MScsXG4gICAgICAgICAgICBNYXRoLmFicyh0aGlzLm9yaWdpbi54IC0gdGhpcy50YXJnZXQueCkpO1xuICAgICAgICB0aGlzLmxpbmUuc2V0QXR0cmlidXRlTlMobnVsbCwgJ3gyJywgMCk7XG4gICAgfVxuICAgIGlmICh0aGlzLm9yaWdpbi55IDwgdGhpcy50YXJnZXQueSkge1xuICAgICAgICB0aGlzLmxpbmUuc2V0QXR0cmlidXRlTlMobnVsbCwgJ3kxJywgMCk7XG4gICAgICAgIHRoaXMubGluZS5zZXRBdHRyaWJ1dGVOUyhudWxsLCAneTInLFxuICAgICAgICAgICAgTWF0aC5hYnModGhpcy5vcmlnaW4ueSAtIHRoaXMudGFyZ2V0LnkpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxpbmUuc2V0QXR0cmlidXRlTlMobnVsbCwgJ3kxJyxcbiAgICAgICAgICAgIE1hdGguYWJzKHRoaXMub3JpZ2luLnkgLSB0aGlzLnRhcmdldC55KSk7XG4gICAgICAgIHRoaXMubGluZS5zZXRBdHRyaWJ1dGVOUyhudWxsLCAneTInLCAwKTtcbiAgICB9XG4gICAgdGhpcy5saW5lLnNldEF0dHJpYnV0ZU5TKG51bGwsICdzdHlsZScsICdzdHJva2U6I0ZGOTIwMDtzdHJva2Utd2lkdGg6MicpO1xuXG4gICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdsZWZ0JywgTWF0aC5taW4odGhpcy5vcmlnaW4ueCwgdGhpcy50YXJnZXQueCkpO1xuICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygndG9wJywgTWF0aC5taW4odGhpcy5vcmlnaW4ueSwgdGhpcy50YXJnZXQueSkpO1xufTtcblxuRmxvd05vZGUuQ29ubmVjdG9yLnByb3RvdHlwZS5zZXRPcmlnaW4gPSBmdW5jdGlvbihvcmlnaW4pIHtcbiAgICB0aGlzLm9yaWdpbiA9IG9yaWdpbjtcbn07XG5cbkZsb3dOb2RlLkNvbm5lY3Rvci5wcm90b3R5cGUuc2V0VGFyZ2V0ID0gZnVuY3Rpb24odGFyZ2V0KSB7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG59O1xuXG5leHBvcnQge0Zsb3dOb2RlfTtcbiIsImltcG9ydCB7Rmxvd05vZGV9IGZyb20gJy4uL3VpL0Zsb3dOb2RlLmpzJztcblxuLyoqXG4qIEEgc3ludGhlc2l6ZXIgbW9kdWxlIHRoYXQgY29tYmluZXMgZGlmZmVyZW50IGZyZXF1ZW5jaWVzXG4qIEByZXR1cm4geyp9IFJldHVybnMgbnVsbCBpZiBlcnJvclxuKi9cbmZ1bmN0aW9uIEZvdXJpZXJTeW50aCgpIHtcbiAgICBGbG93Tm9kZS5jYWxsKHRoaXMsIDMsIDQpO1xuXG4gICAgaWYgKHdpbmRvdy5Ub25lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6IE1vZHVsZSBGb3VyaWVyU3ludGggcmVxdWlyZXMgVG9uZS5qcyEnKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5sZXZlbHMgPSA1O1xuICAgIHRoaXMuZnVuZGFtZW50YWxGcmVxID0gNDQwO1xuICAgIHRoaXMucGFydGlhbHMgPSBbMCwgMCwgMCwgMCwgMF07XG5cbiAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgIHRoaXMub3NjID0gbnVsbDtcbiAgICB0aGlzLmF1ZGlvTm9kZU91dCA9IG51bGw7XG5cbiAgICB0aGlzLnZpc3VhbGl6YXRpb24gPSAkKCc8ZGl2PjwvZGl2PicpO1xuXG4gICAgdGhpcy53YXZlU3VtID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICB0aGlzLndhdmVTdW0uYXR0cignaWQnLCAnd2F2ZV9zdW1fJyArIHRoaXMudWlkKTtcbiAgICB0aGlzLndhdmVTdW0uY3NzKHtcbiAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAnd2hpdGUnLFxuICAgIH0pO1xuICAgIHRoaXMudmlzdWFsaXphdGlvbi5hcHBlbmQodGhpcy53YXZlU3VtKTtcblxuICAgIC8vIHRoaXMud2F2ZVBhcnRpYWxzID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICAvLyB0aGlzLnZpc3VhbGl6YXRpb24uYXBwZW5kKHRoaXMud2F2ZVBhcnRpYWxzKTtcblxuICAgIGxldCBzZWxmXyA9IHRoaXM7XG5cbiAgICB0aGlzLmNvbnRyb2xzID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICB0aGlzLmNvbnRyb2xzLmNzcyh7XG4gICAgICAgICd0ZXh0LWFsaWduJzogJ2NlbnRlcicsXG4gICAgfSk7XG5cbiAgICBsZXQgZnVuZGFtZW50YWxGcmVxID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBsZXQgZmZMYWJlbCA9ICQoJzxzcGFuPkZ1bmRhbWVudGFsIEZyZXF1ZW5jeTogPC9zcGFuPicpO1xuICAgIGxldCBmZlRleHQgPSAkKCc8aW5wdXQgdHlwZT1cInRleHRcIiB2YWx1ZT0nICsgdGhpcy5mdW5kYW1lbnRhbEZyZXEgKyAnIC8+Jyk7XG4gICAgZmZUZXh0Lm9uKCdpbnB1dCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5mdW5kYW1lbnRhbEZyZXEgPSBwYXJzZUZsb2F0KGZmVGV4dC52YWwoKSk7XG4gICAgICAgIHRoaXMuZHJhdygpO1xuICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICB9KTtcbiAgICBmdW5kYW1lbnRhbEZyZXEuYXBwZW5kKGZmTGFiZWwpO1xuICAgIGZ1bmRhbWVudGFsRnJlcS5hcHBlbmQoZmZUZXh0KTtcbiAgICB0aGlzLmNvbnRyb2xzLmFwcGVuZChmdW5kYW1lbnRhbEZyZXEpO1xuXG4gICAgdGhpcy5wYXJ0aWFsQ29udHJvbHMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGV2ZWxzOyBpKyspIHtcbiAgICAgICAgbGV0IGNvbnRyb2wgPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgICAgICBsZXQgbGFiZWwgPSBudWxsO1xuICAgICAgICBpZiAoaSA9PSAwKSB7XG4gICAgICAgICAgICBsYWJlbCA9ICQoJzxzcGFuPkY8L3NwYW4+Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYWJlbCA9ICQoJzxzcGFuPkgnICsgaSArICc8L3NwYW4+Jyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNsaWRlciA9ICQoJzxpbnB1dCB0eXBlPVwicmFuZ2VcIiBtaW49LTEgbWF4PTEgc3RlcD0wLjAxIHZhbHVlPTAgLz4nKTtcblxuICAgICAgICAoKGlfKSA9PiB7IC8vIGNhcHR1cmluZyBpXG4gICAgICAgICAgICBzbGlkZXIub24oJ2lucHV0JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGZfLnBhcnRpYWxzW2lfXSA9IHBhcnNlRmxvYXQoc2xpZGVyLnZhbCgpKTtcbiAgICAgICAgICAgICAgICBzZWxmXy5kcmF3KCk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGZfLmlzUGxheWluZykgc2VsZl8uc3RhcnQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KShpKTtcblxuICAgICAgICBjb250cm9sLmFwcGVuZChsYWJlbCk7XG4gICAgICAgIGNvbnRyb2wuYXBwZW5kKHNsaWRlcik7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5hcHBlbmQoY29udHJvbCk7XG5cbiAgICAgICAgdGhpcy5wYXJ0aWFsQ29udHJvbHMucHVzaChjb250cm9sKTtcbiAgICB9XG5cbiAgICB0aGlzLnN0YXJ0QnV0dG9uID0gJCgnPGlucHV0IHR5cGU9XCJidXR0b25cIiB2YWx1ZT1cIlN0YXJ0XCI+Jyk7XG4gICAgdGhpcy5zdGFydEJ1dHRvbi5vbignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzUGxheWluZykge1xuICAgICAgICAgICAgc2VsZl8uc3RvcCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZl8uc3RhcnQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5jb250cm9scy5hcHBlbmQodGhpcy5zdGFydEJ1dHRvbik7XG5cbiAgICBsZXQganFvID0gdGhpcy5nZXRDb250ZW50KCk7XG4gICAganFvLmNzcyh7XG4gICAgICAgICdvdmVyZmxvdy14JzogJ2hpZGRlbicsXG4gICAgICAgICdwYWRkaW5nJzogJzEwcHgnLFxuICAgIH0pO1xuICAgIGpxby5hcHBlbmQoJzxoMj5Gb3VyaWVyIFN5bnRoPC9oMj4nKTtcbiAgICBqcW8uYXBwZW5kKHRoaXMudmlzdWFsaXphdGlvbik7XG4gICAganFvLmFwcGVuZCh0aGlzLmNvbnRyb2xzKTtcblxuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xuXG4gICAgdGhpcy5hZGRQb3J0KCdsYicsIDExLCAnZnJlcS4gaW4nKTtcbiAgICBsZXQgcG9ydE91dCA9IHRoaXMuYWRkUG9ydCgncmInLCAxLCAnb3V0Jyk7XG4gICAgcG9ydE91dC5vbkNvbm5lY3RPdXQgPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHNlbGZfLmF1ZGlvTm9kZU91dCA9IGFyZ3MuYXVkaW9Ob2RlO1xuICAgIH07XG59XG5cbkZvdXJpZXJTeW50aC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEZsb3dOb2RlLnByb3RvdHlwZSk7XG5Gb3VyaWVyU3ludGgucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRm91cmllclN5bnRoO1xuXG5Gb3VyaWVyU3ludGgucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbigpIHtcbiAgICBsZXQgc2VsZl8gPSB0aGlzO1xuICAgIGxldCBkcmF3UGxvdCA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgIGZ1bmN0aW9uUGxvdCh7XG4gICAgICAgICAgICB0YXJnZXQ6ICcjd2F2ZV9zdW1fJyArIHNlbGZfLnVpZCxcbiAgICAgICAgICAgIHdpZHRoOiBzZWxmXy5nZXRDb250ZW50KCkud2lkdGgoKSxcbiAgICAgICAgICAgIGhlaWdodDogMTUwLFxuICAgICAgICAgICAgZGlzYWJsZVpvb206IHRydWUsXG4gICAgICAgICAgICB4QXhpczoge1xuICAgICAgICAgICAgICAgIGxhYmVsOiAndGltZSAobXMpJyxcbiAgICAgICAgICAgICAgICBkb21haW46IFswLCAxMDAwIC8gc2VsZl8uZnVuZGFtZW50YWxGcmVxXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB5QXhpczoge1xuICAgICAgICAgICAgICAgIGxhYmVsOiAnYW1wbGl0dWRlJyxcbiAgICAgICAgICAgICAgICBkb21haW46IFstMSwgMV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ3JpZDogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGE6IFt7XG4gICAgICAgICAgICAgICAgZm46IGZuLFxuICAgICAgICAgICAgfV0sXG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBzdW1cbiAgICBsZXQgc3VtRnVuID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnBhcnRpYWxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHN1bUZ1bi5wdXNoKHRoaXMucGFydGlhbHNbaV0gKyAnICogc2luKCdcbiAgICAgICAgICAgICsgKDAuMDAyICogdGhpcy5mdW5kYW1lbnRhbEZyZXEgKiAoaSArIDEpKVxuICAgICAgICAgICAgKyAnICogUEkgKiB4KScpO1xuICAgIH1cbiAgICBzdW1GdW4gPSBzdW1GdW4uam9pbignICsgJyk7XG5cbiAgICB0aGlzLndhdmVTdW0uZW1wdHkoKTtcbiAgICBkcmF3UGxvdChzdW1GdW4pO1xuXG4gICAgLy8gcGFydGlhbHNcbn07XG5cbkZvdXJpZXJTeW50aC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5pc1BsYXlpbmcpIHRoaXMuc3RvcCgpO1xuICAgIHRoaXMub3NjID0gbmV3IFRvbmUuT21uaU9zY2lsbGF0b3IodGhpcy5mdW5kYW1lbnRhbEZyZXEsICdzaW5lJyk7XG4gICAgdGhpcy5vc2MucGFydGlhbHMgPSB0aGlzLnBhcnRpYWxzO1xuICAgIC8vIHRoaXMub3NjLnRvTWFzdGVyKCk7ICAgIFxuICAgIHRoaXMub3NjLmNvbm5lY3QodGhpcy5hdWRpb05vZGVPdXQpO1xuICAgIHRoaXMub3NjLnN0YXJ0KCk7XG5cbiAgICB0aGlzLmlzUGxheWluZyA9IHRydWU7XG4gICAgdGhpcy5zdGFydEJ1dHRvbi52YWwoJ1N0b3AnKTtcbn07XG5cbkZvdXJpZXJTeW50aC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmlzUGxheWluZykge1xuICAgICAgICB0aGlzLm9zYy5zdG9wKCk7XG4gICAgICAgIHRoaXMub3NjLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgIHRoaXMuc3RhcnRCdXR0b24udmFsKCdTdGFydCcpO1xufTtcblxuZXhwb3J0IHtGb3VyaWVyU3ludGh9O1xuIiwiaW1wb3J0IHtGbG93Tm9kZX0gZnJvbSAnLi4vdWkvRmxvd05vZGUuanMnO1xuXG4vKipcbiAqIE91dHB1dCBub2RlXG4gKiBAcmV0dXJuIHsqfSBOdWxsIGlmIGVycm9yXG4gKi9cbmZ1bmN0aW9uIE1hc3RlcigpIHtcbiAgICBGbG93Tm9kZS5jYWxsKHRoaXMsIDEsIDEpO1xuXG4gICAgaWYgKHdpbmRvdy5Ub25lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6IE1vZHVsZSBNYXN0ZXIgcmVxdWlyZXMgVG9uZS5qcyEnKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgbGV0IHBvcnRJbiA9IHRoaXMuYWRkUG9ydCgnbGInLCAxLCAnaW4nKTtcbiAgICBwb3J0SW4uYXJncyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge3R5cGU6ICdBdWRpb05vZGUnLCBhdWRpb05vZGU6IFRvbmUuTWFzdGVyfTtcbiAgICB9O1xufVxuXG5NYXN0ZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShGbG93Tm9kZS5wcm90b3R5cGUpO1xuTWFzdGVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IE1hc3RlcjtcblxuZXhwb3J0IHtNYXN0ZXJ9O1xuIiwiLy8gZXhwb3J0IHtTeW50aGVzaXplcn0gZnJvbSAnLi9hdWRpby9TeW50aGVzaXplci5qcyc7XG5cbmV4cG9ydCB7Rm91cmllclN5bnRofSBmcm9tICcuL21vZHVsZXMvRm91cmllclN5bnRoLmpzJztcbmV4cG9ydCB7TWFzdGVyfSBmcm9tICcuL21vZHVsZXMvTWFzdGVyLmpzJztcblxuZXhwb3J0IHtGbG93Tm9kZX0gZnJvbSAnLi91aS9GbG93Tm9kZS5qcyc7XG5leHBvcnQge1VJRWxlbWVudH0gZnJvbSAnLi91aS9VSUVsZW1lbnQuanMnO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOzs7OztBQUtBLFNBQVMsU0FBUyxHQUFHO0lBQ2pCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDOztJQUV4QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztJQUN6QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFDOztJQUU3QixJQUFJLENBQUMsR0FBRyxHQUFHLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztDQUM5Qjs7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
