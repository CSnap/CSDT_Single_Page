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
    // Class management
    UIElement.call(this);
    this.isFlowNode = true;

    // Defaults
    this.width = width !== undefined ? width : 1;
    this.height = height !== undefined ? height : 1;
    this.ports = [];

    // Special event handlers
    let self_ = this;
    let ondrag = function() {
        self_.ports.forEach((port) => port.ondrag());
    };

    // DOM Element
    let jqo = $('<div></div>');
    jqo.draggable({grid: [20, 20], drag: ondrag});
    jqo.addClass('flownode');

    this.setContent(jqo);

    // Update layout with determined width and height
    this.setSize(this.width, this.height);
}

FlowNode.prototype = Object.create(UIElement.prototype);
FlowNode.prototype.constructor = FlowNode;

FlowNode.prototype.injectContent = function(element) {
    UIElement.prototype.injectContent.call(this, element);

    // Override to inject ports as well
    let self_ = this;
    this.ports.forEach((port) => port.injectContent(self_.getContent()));
};

/**
 * Sets the size of the node and updates its layout on the DOM
 * @param {int} width
 * @param {int} height
 */
FlowNode.prototype.setSize = function(width, height) {
    this.width = width;
    this.height = height;

    this.getContent().css('width', 110 * width - 10);
    this.getContent().css('height', 110 * height - 10);
};

/**
 * Adds a port to the node
 * @param {string} docking A pair of letters from 'tlbr', first determines
 * which side the port is docked on, and the second determines which side to
 * calculate the offset from.
 * @param {int} offset
 * @param {string} label
 * @return {FlowNode.Port} The port created
 */
FlowNode.prototype.addPort = function(docking, offset, label) {
    let port = new FlowNode.Port(this, docking, offset, label);
    this.ports.push(port);
    return port;
};

/**
 * A port used to for connecting nodes. Constructor should not have to be called
 * explicitly.
 * @param {FlowNode} parent
 * @param {string=} docking
 * @param {number=} offset
 * @param {string=} label
 * @param {bool=} multi Does this port support multiple connections
 */
FlowNode.Port = function(parent, docking, offset, label, multi) {
    UIElement.call(this);
    this.isFlowNodePort = true;

    this.parent = parent;
    this.docking = docking !== undefined ? docking : 'tl';
    this.offset = offset !== undefined ? offset : 0;
    this.label = label !== undefined ? label : '';
    this.multi = multi !== undefined ? multi : false;

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

    this.connections = [];

    let connector = null;
    let _self = this;
    this.portDiv.on('mousedown', function(event) {
        event.originalEvent.stopPropagation();
        event.originalEvent.preventDefault();

        if (!_self.multi) {
            _self.removeAllConnections();
        }

        connector = new FlowNode.Connector(_self);
        connector.injectContent(_self.parent.getContentContainer());
    });

    let getNearbyPorts = function(clientX, clientY) {
        let nearby = [];
        $('.flownodeportcontainer').each((index, dom) => {
            let elem = $(dom);
            let uielem = UIElement.lookupByUid(elem.attr('uid'));
            if (_self != uielem) {
                let inner = $(dom).children('.flownodeport');
                let r = inner[0].getBoundingClientRect();

                let cx = (r.left + r.right) / 2;
                let cy = (r.top + r.bottom) / 2;

                let d2 = Math.pow(cx - clientX, 2) + Math.pow(cy - clientY, 2);
                if (d2 < 100) {
                    nearby.push(UIElement.lookupByUid(elem.attr('uid')));
                }
            }
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

                let c = new FlowNode.Connector(_self, np[0]);
                c.injectContent(_self.parent.getContentContainer());

                np[0].addConnection(c, _self);
                _self.addConnection(c, np[0]);
            }

            connector.removeContent();
            connector = null;
        }
    });

    this.ondrag = function() {
        _self.connections.forEach((connection) => {
            connection.updateLayout();
        });
    };

    this.args = function() {
        return null;
    };

    this.onConnect = function() {
        return false;
    };

    this.onDisconnect = function() {
        return false;
    };
};

FlowNode.Port.prototype = Object.create(UIElement.prototype);
FlowNode.Port.prototype.constructor = FlowNode.Port;

FlowNode.Port.prototype.addConnection= function(connector, target) {
    this.connections.push(connector);
    this.onConnect(target.args());
};

FlowNode.Port.prototype.removeConnection = function(connector) {
    let index = this.connections.indexOf(connector);
    this.connections.splice(index, 1);
};

FlowNode.Port.prototype.removeAllConnections = function() {
    while (this.connections.length > 0) {
        this.connections[0].remove();
    }
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
* @param {FlowNode.Port=} origin
* @param {FlowNode.Port=} target
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
    let origin = {x: 0, y: 0};
    let target = {x: 0, y: 0};
    if (this.origin.isFlowNodePort) {
        let r = this.origin.portDiv[0].getBoundingClientRect();
        origin.x = (r.left + r.right) / 2 + window.scrollX;
        origin.y = (r.top + r.bottom) / 2 + window.scrollY;
    } else {
        origin = this.origin;
    }
    if (this.target.isFlowNodePort) {
        let r = this.target.portDiv[0].getBoundingClientRect();
        target.x = (r.left + r.right) / 2 + window.scrollX;
        target.y = (r.top + r.bottom) / 2 + window.scrollY;
    } else {
        target = this.target;
    }

    let width = Math.max(2, Math.abs(origin.x - target.x));
    let height = Math.max(2, Math.abs(origin.y - target.y));

    this.svg.setAttributeNS(null, 'width', width);
    this.svg.setAttributeNS(null, 'height', height);


    if (origin.x < target.x) {
        this.line.setAttributeNS(null, 'x1', 0);
        this.line.setAttributeNS(null, 'x2', width);
    } else {
        this.line.setAttributeNS(null, 'x1', width);
        this.line.setAttributeNS(null, 'x2', 0);
    }
    if (origin.y < target.y) {
        this.line.setAttributeNS(null, 'y1', 0);
        this.line.setAttributeNS(null, 'y2', height);
    } else {
        this.line.setAttributeNS(null, 'y1', height);
        this.line.setAttributeNS(null, 'y2', 0);
    }
    this.line.setAttributeNS(null, 'style', 'stroke:#FF9200;stroke-width:2');

    this.getContent().css('left', Math.min(origin.x, target.x));
    this.getContent().css('top', Math.min(origin.y, target.y));
};

FlowNode.Connector.prototype.setOrigin = function(origin) {
    this.origin = origin;
};

FlowNode.Connector.prototype.setTarget = function(target) {
    this.target = target;
};

FlowNode.Connector.prototype.remove = function() {
    this.target.onDisconnect(this.origin.args());
    this.target.removeConnection(this);
    this.origin.onDisconnect(this.target.args());
    this.origin.removeConnection(this);
    this.removeContent();
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
    portOut.onConnect = function(args) {
        self_.audioNodeOut = args.audioNode;
    };
    portOut.onDisconnect = function(args) {
        self_.audioNodeOut = null;
        self_.stop();
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
    if (this.audioNodeOut == null) {
        alert('No connection out!');
        this.stop();
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXVzaWNMYWIuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY3JpcHRzL3VpL1VJRWxlbWVudC5qcyIsIi4uLy4uL3NyYy9zY3JpcHRzL3VpL0Zsb3dOb2RlLmpzIiwiLi4vLi4vc3JjL3NjcmlwdHMvbW9kdWxlcy9Gb3VyaWVyU3ludGguanMiLCIuLi8uLi9zcmMvc2NyaXB0cy9tb2R1bGVzL01hc3Rlci5qcyIsIi4uLy4uL3NyYy9zY3JpcHRzL011c2ljTGFiLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuKiBBbiBhYnN0cmFjdCBjbGFzcyBmb3IgaGFuZGxpbmcgaW50ZWdyYXRpb24gd2l0aCBIVE1MXG4qXG4qIEV4dGVybmFsIGRlcGVuZGVuY2llczogalF1ZXJ5XG4qL1xuZnVuY3Rpb24gVUlFbGVtZW50KCkge1xuICAgIHRoaXMuaXNVSUVsZW1lbnQgPSB0cnVlO1xuXG4gICAgdGhpcy5qUXVlcnlPYmplY3QgPSBudWxsO1xuICAgIHRoaXMuY29udGVudENvbnRhaW5lciA9IG51bGw7XG5cbiAgICB0aGlzLnVpZCA9IFVJRWxlbWVudC51aWQrKztcbn1cblxuVUlFbGVtZW50LnVpZCA9IDA7XG5VSUVsZW1lbnQubG9va3VwID0ge307XG5cblVJRWxlbWVudC5sb29rdXBCeVVpZCA9IGZ1bmN0aW9uKHVpZCkge1xuICAgIHJldHVybiBVSUVsZW1lbnQubG9va3VwW3VpZF07XG59O1xuXG4vKipcbiogU2V0cyBjb250ZW50IHRvIGEgalF1ZXJ5IG9iamVjdFxuKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCBhIGpRdWVyeSBvYmplY3RcbiovXG5VSUVsZW1lbnQucHJvdG90eXBlLnNldENvbnRlbnQgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgdGhpcy5qUXVlcnlPYmplY3QgPSBlbGVtZW50O1xuXG4gICAgVUlFbGVtZW50Lmxvb2t1cFt0aGlzLnVpZF0gPSB0aGlzO1xuICAgIHRoaXMualF1ZXJ5T2JqZWN0LmF0dHIoJ3VpZCcsIHRoaXMudWlkKTtcbn07XG5cbi8qKlxuKiBJbmplY3RzIGNvbnRlbnQgaW50byBhIGpRdWVyeSBvYmplY3RcbiogQHBhcmFtIHtqUXVlcnkgfCBVSUVsZW1lbnR9IGVsZW1lbnQgalF1ZXJ5IG9iamVjdCB0byBpbmplY3QgY29udGVudCBpbnRvXG4qL1xuVUlFbGVtZW50LnByb3RvdHlwZS5pbmplY3RDb250ZW50ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICh0aGlzLmpRdWVyeU9iamVjdCA9PSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOiBDb250ZW50IG5vdCBzZXQhJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZWxlbWVudC5pc1VJRWxlbWVudCkge1xuICAgICAgICBlbGVtZW50LmpRdWVyeU9iamVjdC5hcHBlbmQodGhpcy5qUXVlcnlPYmplY3QpO1xuICAgICAgICB0aGlzLmNvbnRlbnRDb250YWluZXIgPSBlbGVtZW50LmpRdWVyeU9iamVjdDtcbiAgICB9IGVsc2UgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBqUXVlcnkpIHtcbiAgICAgICAgZWxlbWVudC5hcHBlbmQodGhpcy5qUXVlcnlPYmplY3QpO1xuICAgICAgICB0aGlzLmNvbnRlbnRDb250YWluZXIgPSBlbGVtZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOiBJbnZhbGlkIHR5cGUgKGVsZW1lbnQpIScpO1xuICAgIH1cbn07XG5cbi8qKlxuKiBSZW1vdmVzIHRoZSBVSUVsZW1lbnQgZnJvbSB0aGUgZG9jdW1lbnRcbiovXG5VSUVsZW1lbnQucHJvdG90eXBlLnJlbW92ZUNvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmpRdWVyeU9iamVjdC5yZW1vdmUoKTtcbiAgICBkZWxldGUgVUlFbGVtZW50Lmxvb2t1cFt0aGlzLnVpZF07XG59O1xuXG4vKipcbiogUmV0dXJucyB0aGUgYXNzb2NpYXRlZCBqUXVlcnkgT2JqZWN0XG4qIEByZXR1cm4ge2pRdWVyeX1cbiovXG5VSUVsZW1lbnQucHJvdG90eXBlLmdldENvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5qUXVlcnlPYmplY3Q7XG59O1xuXG5VSUVsZW1lbnQucHJvdG90eXBlLmdldENvbnRlbnRDb250YWluZXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5jb250ZW50Q29udGFpbmVyO1xufTtcblxuZXhwb3J0IHtVSUVsZW1lbnR9O1xuIiwiaW1wb3J0IHtVSUVsZW1lbnR9IGZyb20gJy4vVUlFbGVtZW50LmpzJztcblxuLyoqXG4qIEEgcmVwcmVzZW50YXRpb24gb2YgYSBub2RlIHdpdGhpbiBhIHByb2dyYW0uIEluY2x1ZGVzIFVJIGFuZCBvdGhlciBmdW5jdGlvbnNcbiogdG8gaW50ZWdyYXRlIHdpdGggdGhlIHByb2dyYW0gYXMgYSB3aG9sZVxuKlxuKiBFeHRlcm5hbCBkZXBlbmRlbmNpZXM6IGpRdWVyeVVJXG4qXG4qIEBwYXJhbSB7bnVtYmVyPX0gd2lkdGggd2lkdGggb2YgdGhlIG5vZGUgaW4gdW5pdHNcbiogQHBhcmFtIHtudW1iZXI9fSBoZWlnaHQgaGVpZ2h0IG9mIHRoZSBub2RlIGluIHVuaXRzXG4qL1xuZnVuY3Rpb24gRmxvd05vZGUod2lkdGgsIGhlaWdodCkge1xuICAgIC8vIENsYXNzIG1hbmFnZW1lbnRcbiAgICBVSUVsZW1lbnQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmlzRmxvd05vZGUgPSB0cnVlO1xuXG4gICAgLy8gRGVmYXVsdHNcbiAgICB0aGlzLndpZHRoID0gd2lkdGggIT09IHVuZGVmaW5lZCA/IHdpZHRoIDogMTtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodCAhPT0gdW5kZWZpbmVkID8gaGVpZ2h0IDogMTtcbiAgICB0aGlzLnBvcnRzID0gW107XG5cbiAgICAvLyBTcGVjaWFsIGV2ZW50IGhhbmRsZXJzXG4gICAgbGV0IHNlbGZfID0gdGhpcztcbiAgICBsZXQgb25kcmFnID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGZfLnBvcnRzLmZvckVhY2goKHBvcnQpID0+IHBvcnQub25kcmFnKCkpO1xuICAgIH07XG5cbiAgICAvLyBET00gRWxlbWVudFxuICAgIGxldCBqcW8gPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIGpxby5kcmFnZ2FibGUoe2dyaWQ6IFsyMCwgMjBdLCBkcmFnOiBvbmRyYWd9KTtcbiAgICBqcW8uYWRkQ2xhc3MoJ2Zsb3dub2RlJyk7XG5cbiAgICB0aGlzLnNldENvbnRlbnQoanFvKTtcblxuICAgIC8vIFVwZGF0ZSBsYXlvdXQgd2l0aCBkZXRlcm1pbmVkIHdpZHRoIGFuZCBoZWlnaHRcbiAgICB0aGlzLnNldFNpemUodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xufTtcblxuRmxvd05vZGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUVsZW1lbnQucHJvdG90eXBlKTtcbkZsb3dOb2RlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZsb3dOb2RlO1xuXG5GbG93Tm9kZS5wcm90b3R5cGUuaW5qZWN0Q29udGVudCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICBVSUVsZW1lbnQucHJvdG90eXBlLmluamVjdENvbnRlbnQuY2FsbCh0aGlzLCBlbGVtZW50KTtcblxuICAgIC8vIE92ZXJyaWRlIHRvIGluamVjdCBwb3J0cyBhcyB3ZWxsXG4gICAgbGV0IHNlbGZfID0gdGhpcztcbiAgICB0aGlzLnBvcnRzLmZvckVhY2goKHBvcnQpID0+IHBvcnQuaW5qZWN0Q29udGVudChzZWxmXy5nZXRDb250ZW50KCkpKTtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgc2l6ZSBvZiB0aGUgbm9kZSBhbmQgdXBkYXRlcyBpdHMgbGF5b3V0IG9uIHRoZSBET01cbiAqIEBwYXJhbSB7aW50fSB3aWR0aFxuICogQHBhcmFtIHtpbnR9IGhlaWdodFxuICovXG5GbG93Tm9kZS5wcm90b3R5cGUuc2V0U2l6ZSA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcbiAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3dpZHRoJywgMTEwICogd2lkdGggLSAxMCk7XG4gICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdoZWlnaHQnLCAxMTAgKiBoZWlnaHQgLSAxMCk7XG59O1xuXG4vKipcbiAqIEFkZHMgYSBwb3J0IHRvIHRoZSBub2RlXG4gKiBAcGFyYW0ge3N0cmluZ30gZG9ja2luZyBBIHBhaXIgb2YgbGV0dGVycyBmcm9tICd0bGJyJywgZmlyc3QgZGV0ZXJtaW5lc1xuICogd2hpY2ggc2lkZSB0aGUgcG9ydCBpcyBkb2NrZWQgb24sIGFuZCB0aGUgc2Vjb25kIGRldGVybWluZXMgd2hpY2ggc2lkZSB0b1xuICogY2FsY3VsYXRlIHRoZSBvZmZzZXQgZnJvbS5cbiAqIEBwYXJhbSB7aW50fSBvZmZzZXRcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYWJlbFxuICogQHJldHVybiB7Rmxvd05vZGUuUG9ydH0gVGhlIHBvcnQgY3JlYXRlZFxuICovXG5GbG93Tm9kZS5wcm90b3R5cGUuYWRkUG9ydCA9IGZ1bmN0aW9uKGRvY2tpbmcsIG9mZnNldCwgbGFiZWwpIHtcbiAgICBsZXQgcG9ydCA9IG5ldyBGbG93Tm9kZS5Qb3J0KHRoaXMsIGRvY2tpbmcsIG9mZnNldCwgbGFiZWwpO1xuICAgIHRoaXMucG9ydHMucHVzaChwb3J0KTtcbiAgICByZXR1cm4gcG9ydDtcbn07XG5cbi8qKlxuICogQSBwb3J0IHVzZWQgdG8gZm9yIGNvbm5lY3Rpbmcgbm9kZXMuIENvbnN0cnVjdG9yIHNob3VsZCBub3QgaGF2ZSB0byBiZSBjYWxsZWRcbiAqIGV4cGxpY2l0bHkuXG4gKiBAcGFyYW0ge0Zsb3dOb2RlfSBwYXJlbnRcbiAqIEBwYXJhbSB7c3RyaW5nPX0gZG9ja2luZ1xuICogQHBhcmFtIHtudW1iZXI9fSBvZmZzZXRcbiAqIEBwYXJhbSB7c3RyaW5nPX0gbGFiZWxcbiAqIEBwYXJhbSB7Ym9vbD19IG11bHRpIERvZXMgdGhpcyBwb3J0IHN1cHBvcnQgbXVsdGlwbGUgY29ubmVjdGlvbnNcbiAqL1xuRmxvd05vZGUuUG9ydCA9IGZ1bmN0aW9uKHBhcmVudCwgZG9ja2luZywgb2Zmc2V0LCBsYWJlbCwgbXVsdGkpIHtcbiAgICBVSUVsZW1lbnQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmlzRmxvd05vZGVQb3J0ID0gdHJ1ZTtcblxuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuZG9ja2luZyA9IGRvY2tpbmcgIT09IHVuZGVmaW5lZCA/IGRvY2tpbmcgOiAndGwnO1xuICAgIHRoaXMub2Zmc2V0ID0gb2Zmc2V0ICE9PSB1bmRlZmluZWQgPyBvZmZzZXQgOiAwO1xuICAgIHRoaXMubGFiZWwgPSBsYWJlbCAhPT0gdW5kZWZpbmVkID8gbGFiZWwgOiAnJztcbiAgICB0aGlzLm11bHRpID0gbXVsdGkgIT09IHVuZGVmaW5lZCA/IG11bHRpIDogZmFsc2U7XG5cbiAgICB0aGlzLnBvcnREaXYgPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIHRoaXMucG9ydERpdi5jc3MoJ2Rpc3BsYXknLCAnaW5saW5lLWJsb2NrJyk7XG4gICAgdGhpcy5wb3J0RGl2LmFkZENsYXNzKCdmbG93bm9kZXBvcnQnKTtcblxuICAgIGxldCBqcW8gPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIGpxby5hZGRDbGFzcygnZmxvd25vZGVwb3J0Y29udGFpbmVyJyk7XG4gICAganFvLmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcbiAgICBqcW8uYXBwZW5kKHRoaXMucG9ydERpdik7XG4gICAganFvLmFwcGVuZCgnICcgKyBsYWJlbCk7XG4gICAgdGhpcy5zZXRDb250ZW50KGpxbyk7XG5cbiAgICB0aGlzLnVwZGF0ZUxheW91dCgpO1xuXG4gICAgdGhpcy5jb25uZWN0aW9ucyA9IFtdO1xuXG4gICAgbGV0IGNvbm5lY3RvciA9IG51bGw7XG4gICAgbGV0IF9zZWxmID0gdGhpcztcbiAgICB0aGlzLnBvcnREaXYub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50Lm9yaWdpbmFsRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGV2ZW50Lm9yaWdpbmFsRXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBpZiAoIV9zZWxmLm11bHRpKSB7XG4gICAgICAgICAgICBfc2VsZi5yZW1vdmVBbGxDb25uZWN0aW9ucygpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29ubmVjdG9yID0gbmV3IEZsb3dOb2RlLkNvbm5lY3Rvcihfc2VsZik7XG4gICAgICAgIGNvbm5lY3Rvci5pbmplY3RDb250ZW50KF9zZWxmLnBhcmVudC5nZXRDb250ZW50Q29udGFpbmVyKCkpO1xuICAgIH0pO1xuXG4gICAgbGV0IGdldE5lYXJieVBvcnRzID0gZnVuY3Rpb24oY2xpZW50WCwgY2xpZW50WSkge1xuICAgICAgICBsZXQgbmVhcmJ5ID0gW107XG4gICAgICAgICQoJy5mbG93bm9kZXBvcnRjb250YWluZXInKS5lYWNoKChpbmRleCwgZG9tKSA9PiB7XG4gICAgICAgICAgICBsZXQgZWxlbSA9ICQoZG9tKTtcbiAgICAgICAgICAgIGxldCB1aWVsZW0gPSBVSUVsZW1lbnQubG9va3VwQnlVaWQoZWxlbS5hdHRyKCd1aWQnKSk7XG4gICAgICAgICAgICBpZiAoX3NlbGYgIT0gdWllbGVtKSB7XG4gICAgICAgICAgICAgICAgbGV0IGlubmVyID0gJChkb20pLmNoaWxkcmVuKCcuZmxvd25vZGVwb3J0Jyk7XG4gICAgICAgICAgICAgICAgbGV0IHIgPSBpbm5lclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICAgICAgICAgIGxldCBjeCA9IChyLmxlZnQgKyByLnJpZ2h0KSAvIDI7XG4gICAgICAgICAgICAgICAgbGV0IGN5ID0gKHIudG9wICsgci5ib3R0b20pIC8gMjtcblxuICAgICAgICAgICAgICAgIGxldCBkMiA9IE1hdGgucG93KGN4IC0gY2xpZW50WCwgMikgKyBNYXRoLnBvdyhjeSAtIGNsaWVudFksIDIpO1xuICAgICAgICAgICAgICAgIGlmIChkMiA8IDEwMCkge1xuICAgICAgICAgICAgICAgICAgICBuZWFyYnkucHVzaChVSUVsZW1lbnQubG9va3VwQnlVaWQoZWxlbS5hdHRyKCd1aWQnKSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZWFyYnk7XG4gICAgfTtcblxuICAgICQoJ2JvZHknKS5vbignbW91c2Vtb3ZlJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChjb25uZWN0b3IgIT0gbnVsbCkge1xuICAgICAgICAgICAgbGV0IHggPSBldmVudC5vcmlnaW5hbEV2ZW50LmNsaWVudFggKyB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgICAgIGxldCB5ID0gZXZlbnQub3JpZ2luYWxFdmVudC5jbGllbnRZICsgd2luZG93LnNjcm9sbFk7XG5cbiAgICAgICAgICAgIGxldCBucCA9IGdldE5lYXJieVBvcnRzKGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgICBldmVudC5vcmlnaW5hbEV2ZW50LmNsaWVudFkpO1xuICAgICAgICAgICAgaWYgKG5wLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5uZXIgPSBucFswXS5wb3J0RGl2O1xuICAgICAgICAgICAgICAgIGxldCByID0gaW5uZXJbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgeCA9IChyLmxlZnQgKyByLnJpZ2h0KSAvIDIgKyB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgICAgICAgICB5ID0gKHIudG9wICsgci5ib3R0b20pIC8gMiArIHdpbmRvdy5zY3JvbGxZO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25uZWN0b3Iuc2V0VGFyZ2V0KHt4OiB4LCB5OiB5fSk7XG4gICAgICAgICAgICBjb25uZWN0b3IudXBkYXRlTGF5b3V0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICQoJ2JvZHknKS5vbignbW91c2V1cCcsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoY29ubmVjdG9yICE9IG51bGwpIHtcbiAgICAgICAgICAgIGxldCBucCA9IGdldE5lYXJieVBvcnRzKGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2xpZW50WCxcbiAgICAgICAgICAgICAgICBldmVudC5vcmlnaW5hbEV2ZW50LmNsaWVudFkpO1xuICAgICAgICAgICAgaWYgKG5wLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5uZXIgPSBucFswXS5wb3J0RGl2O1xuICAgICAgICAgICAgICAgIGxldCByID0gaW5uZXJbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgbGV0IHggPSAoci5sZWZ0ICsgci5yaWdodCkgLyAyICsgd2luZG93LnNjcm9sbFg7XG4gICAgICAgICAgICAgICAgbGV0IHkgPSAoci50b3AgKyByLmJvdHRvbSkgLyAyICsgd2luZG93LnNjcm9sbFk7XG5cbiAgICAgICAgICAgICAgICBsZXQgYyA9IG5ldyBGbG93Tm9kZS5Db25uZWN0b3IoX3NlbGYsIG5wWzBdKTtcbiAgICAgICAgICAgICAgICBjLmluamVjdENvbnRlbnQoX3NlbGYucGFyZW50LmdldENvbnRlbnRDb250YWluZXIoKSk7XG5cbiAgICAgICAgICAgICAgICBucFswXS5hZGRDb25uZWN0aW9uKGMsIF9zZWxmKTtcbiAgICAgICAgICAgICAgICBfc2VsZi5hZGRDb25uZWN0aW9uKGMsIG5wWzBdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29ubmVjdG9yLnJlbW92ZUNvbnRlbnQoKTtcbiAgICAgICAgICAgIGNvbm5lY3RvciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMub25kcmFnID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIF9zZWxmLmNvbm5lY3Rpb25zLmZvckVhY2goKGNvbm5lY3Rpb24pID0+IHtcbiAgICAgICAgICAgIGNvbm5lY3Rpb24udXBkYXRlTGF5b3V0KCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB0aGlzLmFyZ3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfTtcblxuICAgIHRoaXMub25Db25uZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuXG4gICAgdGhpcy5vbkRpc2Nvbm5lY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG59O1xuXG5GbG93Tm9kZS5Qb3J0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVUlFbGVtZW50LnByb3RvdHlwZSk7XG5GbG93Tm9kZS5Qb3J0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZsb3dOb2RlLlBvcnQ7XG5cbkZsb3dOb2RlLlBvcnQucHJvdG90eXBlLmFkZENvbm5lY3Rpb249IGZ1bmN0aW9uKGNvbm5lY3RvciwgdGFyZ2V0KSB7XG4gICAgdGhpcy5jb25uZWN0aW9ucy5wdXNoKGNvbm5lY3Rvcik7XG4gICAgdGhpcy5vbkNvbm5lY3QodGFyZ2V0LmFyZ3MoKSk7XG59O1xuXG5GbG93Tm9kZS5Qb3J0LnByb3RvdHlwZS5yZW1vdmVDb25uZWN0aW9uID0gZnVuY3Rpb24oY29ubmVjdG9yKSB7XG4gICAgbGV0IGluZGV4ID0gdGhpcy5jb25uZWN0aW9ucy5pbmRleE9mKGNvbm5lY3Rvcik7XG4gICAgdGhpcy5jb25uZWN0aW9ucy5zcGxpY2UoaW5kZXgsIDEpO1xufTtcblxuRmxvd05vZGUuUG9ydC5wcm90b3R5cGUucmVtb3ZlQWxsQ29ubmVjdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgICB3aGlsZSAodGhpcy5jb25uZWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbnNbMF0ucmVtb3ZlKCk7XG4gICAgfTtcbn07XG5cbkZsb3dOb2RlLlBvcnQucHJvdG90eXBlLnVwZGF0ZUxheW91dCA9IGZ1bmN0aW9uKCkge1xuICAgIHN3aXRjaCAodGhpcy5kb2NraW5nWzBdKSB7XG4gICAgICAgIGNhc2UgJ3QnOlxuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3RvcCcsIDApO1xuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2JvdHRvbScsICcnKTtcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdsZWZ0JywgJycpO1xuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3JpZ2h0JywgJycpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYic6XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygndG9wJywgJycpO1xuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2JvdHRvbScsIDApO1xuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2xlZnQnLCAnJyk7XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygncmlnaHQnLCAnJyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdsJzpcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCd0b3AnLCAnJyk7XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnYm90dG9tJywgJycpO1xuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2xlZnQnLCAwKTtcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdyaWdodCcsICcnKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3InOlxuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3RvcCcsICcnKTtcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdib3R0b20nLCAnJyk7XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnbGVmdCcsICcnKTtcbiAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdyaWdodCcsIDApO1xuICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5lcnJvcignSW52YWxpZCBkb2NraW5nIG9wdGlvbiBcXCcnICsgdGhpcy5kb2NraW5nICsgJ1xcJyEnKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGxldCBwaXhlbE9mZnNldCA9IDE1ICogKHRoaXMub2Zmc2V0ICsgMSk7XG4gICAgc3dpdGNoICh0aGlzLmRvY2tpbmdbMV0pIHtcbiAgICAgICAgY2FzZSAndCc6XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygndG9wJywgcGl4ZWxPZmZzZXQpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnYic6XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnYm90dG9tJywgcGl4ZWxPZmZzZXQpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbCc6XG4gICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnbGVmdCcsIHBpeGVsT2Zmc2V0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3InOlxuICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3JpZ2h0JywgcGl4ZWxPZmZzZXQpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5lcnJvcignSW52YWxpZCBkb2NraW5nIG9wdGlvbiBcXCcnICsgdGhpcy5kb2NraW5nICsgJ1xcJyEnKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn07XG5cbi8qKlxuKlxuKiBAcGFyYW0ge0Zsb3dOb2RlLlBvcnQ9fSBvcmlnaW5cbiogQHBhcmFtIHtGbG93Tm9kZS5Qb3J0PX0gdGFyZ2V0XG4qL1xuRmxvd05vZGUuQ29ubmVjdG9yID0gZnVuY3Rpb24ob3JpZ2luLCB0YXJnZXQpIHtcbiAgICBVSUVsZW1lbnQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmlzRmxvd05vZGVDb25uZWN0b3IgPSB0cnVlO1xuXG4gICAgdGhpcy5vcmlnaW4gPSBvcmlnaW4gIT09IHVuZGVmaW5lZCA/IG9yaWdpbiA6IHt4OiAwLCB5OiAwfTtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldCAhPT0gdW5kZWZpbmVkID8gdGFyZ2V0IDogdGhpcy5vcmlnaW47XG5cbiAgICBsZXQgbnMgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuICAgIHRoaXMuc3ZnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5zLCAnc3ZnJyk7XG5cbiAgICB0aGlzLmxpbmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMsICdsaW5lJyk7XG4gICAgdGhpcy5zdmcuYXBwZW5kQ2hpbGQodGhpcy5saW5lKTtcblxuICAgIGxldCBqcW8gPSAkKHRoaXMuc3ZnKTtcbiAgICBqcW8uY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xuXG4gICAgdGhpcy51cGRhdGVMYXlvdXQoKTtcbn07XG5cbkZsb3dOb2RlLkNvbm5lY3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRWxlbWVudC5wcm90b3R5cGUpO1xuRmxvd05vZGUuQ29ubmVjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZsb3dOb2RlLkNvbm5lY3RvcjtcblxuRmxvd05vZGUuQ29ubmVjdG9yLnByb3RvdHlwZS51cGRhdGVMYXlvdXQgPSBmdW5jdGlvbigpIHtcbiAgICBsZXQgb3JpZ2luID0ge3g6IDAsIHk6IDB9O1xuICAgIGxldCB0YXJnZXQgPSB7eDogMCwgeTogMH07XG4gICAgaWYgKHRoaXMub3JpZ2luLmlzRmxvd05vZGVQb3J0KSB7XG4gICAgICAgIGxldCByID0gdGhpcy5vcmlnaW4ucG9ydERpdlswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgb3JpZ2luLnggPSAoci5sZWZ0ICsgci5yaWdodCkgLyAyICsgd2luZG93LnNjcm9sbFg7XG4gICAgICAgIG9yaWdpbi55ID0gKHIudG9wICsgci5ib3R0b20pIC8gMiArIHdpbmRvdy5zY3JvbGxZO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG9yaWdpbiA9IHRoaXMub3JpZ2luO1xuICAgIH1cbiAgICBpZiAodGhpcy50YXJnZXQuaXNGbG93Tm9kZVBvcnQpIHtcbiAgICAgICAgbGV0IHIgPSB0aGlzLnRhcmdldC5wb3J0RGl2WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICB0YXJnZXQueCA9IChyLmxlZnQgKyByLnJpZ2h0KSAvIDIgKyB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgdGFyZ2V0LnkgPSAoci50b3AgKyByLmJvdHRvbSkgLyAyICsgd2luZG93LnNjcm9sbFk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG4gICAgfVxuXG4gICAgbGV0IHdpZHRoID0gTWF0aC5tYXgoMiwgTWF0aC5hYnMob3JpZ2luLnggLSB0YXJnZXQueCkpO1xuICAgIGxldCBoZWlnaHQgPSBNYXRoLm1heCgyLCBNYXRoLmFicyhvcmlnaW4ueSAtIHRhcmdldC55KSk7XG5cbiAgICB0aGlzLnN2Zy5zZXRBdHRyaWJ1dGVOUyhudWxsLCAnd2lkdGgnLCB3aWR0aCk7XG4gICAgdGhpcy5zdmcuc2V0QXR0cmlidXRlTlMobnVsbCwgJ2hlaWdodCcsIGhlaWdodCk7XG5cblxuICAgIGlmIChvcmlnaW4ueCA8IHRhcmdldC54KSB7XG4gICAgICAgIHRoaXMubGluZS5zZXRBdHRyaWJ1dGVOUyhudWxsLCAneDEnLCAwKTtcbiAgICAgICAgdGhpcy5saW5lLnNldEF0dHJpYnV0ZU5TKG51bGwsICd4MicsIHdpZHRoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmxpbmUuc2V0QXR0cmlidXRlTlMobnVsbCwgJ3gxJywgd2lkdGgpO1xuICAgICAgICB0aGlzLmxpbmUuc2V0QXR0cmlidXRlTlMobnVsbCwgJ3gyJywgMCk7XG4gICAgfVxuICAgIGlmIChvcmlnaW4ueSA8IHRhcmdldC55KSB7XG4gICAgICAgIHRoaXMubGluZS5zZXRBdHRyaWJ1dGVOUyhudWxsLCAneTEnLCAwKTtcbiAgICAgICAgdGhpcy5saW5lLnNldEF0dHJpYnV0ZU5TKG51bGwsICd5MicsIGhlaWdodCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5saW5lLnNldEF0dHJpYnV0ZU5TKG51bGwsICd5MScsIGhlaWdodCk7XG4gICAgICAgIHRoaXMubGluZS5zZXRBdHRyaWJ1dGVOUyhudWxsLCAneTInLCAwKTtcbiAgICB9XG4gICAgdGhpcy5saW5lLnNldEF0dHJpYnV0ZU5TKG51bGwsICdzdHlsZScsICdzdHJva2U6I0ZGOTIwMDtzdHJva2Utd2lkdGg6MicpO1xuXG4gICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdsZWZ0JywgTWF0aC5taW4ob3JpZ2luLngsIHRhcmdldC54KSk7XG4gICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCd0b3AnLCBNYXRoLm1pbihvcmlnaW4ueSwgdGFyZ2V0LnkpKTtcbn07XG5cbkZsb3dOb2RlLkNvbm5lY3Rvci5wcm90b3R5cGUuc2V0T3JpZ2luID0gZnVuY3Rpb24ob3JpZ2luKSB7XG4gICAgdGhpcy5vcmlnaW4gPSBvcmlnaW47XG59O1xuXG5GbG93Tm9kZS5Db25uZWN0b3IucHJvdG90eXBlLnNldFRhcmdldCA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xufTtcblxuRmxvd05vZGUuQ29ubmVjdG9yLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnRhcmdldC5vbkRpc2Nvbm5lY3QodGhpcy5vcmlnaW4uYXJncygpKTtcbiAgICB0aGlzLnRhcmdldC5yZW1vdmVDb25uZWN0aW9uKHRoaXMpO1xuICAgIHRoaXMub3JpZ2luLm9uRGlzY29ubmVjdCh0aGlzLnRhcmdldC5hcmdzKCkpO1xuICAgIHRoaXMub3JpZ2luLnJlbW92ZUNvbm5lY3Rpb24odGhpcyk7XG4gICAgdGhpcy5yZW1vdmVDb250ZW50KCk7XG59O1xuXG5leHBvcnQge0Zsb3dOb2RlfTtcbiIsImltcG9ydCB7Rmxvd05vZGV9IGZyb20gJy4uL3VpL0Zsb3dOb2RlLmpzJztcblxuLyoqXG4qIEEgc3ludGhlc2l6ZXIgbW9kdWxlIHRoYXQgY29tYmluZXMgZGlmZmVyZW50IGZyZXF1ZW5jaWVzXG4qIEByZXR1cm4geyp9IFJldHVybnMgbnVsbCBpZiBlcnJvclxuKi9cbmZ1bmN0aW9uIEZvdXJpZXJTeW50aCgpIHtcbiAgICBGbG93Tm9kZS5jYWxsKHRoaXMsIDMsIDQpO1xuXG4gICAgaWYgKHdpbmRvdy5Ub25lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6IE1vZHVsZSBGb3VyaWVyU3ludGggcmVxdWlyZXMgVG9uZS5qcyEnKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgdGhpcy5sZXZlbHMgPSA1O1xuICAgIHRoaXMuZnVuZGFtZW50YWxGcmVxID0gNDQwO1xuICAgIHRoaXMucGFydGlhbHMgPSBbMCwgMCwgMCwgMCwgMF07XG5cbiAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgIHRoaXMub3NjID0gbnVsbDtcbiAgICB0aGlzLmF1ZGlvTm9kZU91dCA9IG51bGw7XG5cbiAgICB0aGlzLnZpc3VhbGl6YXRpb24gPSAkKCc8ZGl2PjwvZGl2PicpO1xuXG4gICAgdGhpcy53YXZlU3VtID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICB0aGlzLndhdmVTdW0uYXR0cignaWQnLCAnd2F2ZV9zdW1fJyArIHRoaXMudWlkKTtcbiAgICB0aGlzLndhdmVTdW0uY3NzKHtcbiAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAnd2hpdGUnLFxuICAgIH0pO1xuICAgIHRoaXMudmlzdWFsaXphdGlvbi5hcHBlbmQodGhpcy53YXZlU3VtKTtcblxuICAgIC8vIHRoaXMud2F2ZVBhcnRpYWxzID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICAvLyB0aGlzLnZpc3VhbGl6YXRpb24uYXBwZW5kKHRoaXMud2F2ZVBhcnRpYWxzKTtcblxuICAgIGxldCBzZWxmXyA9IHRoaXM7XG5cbiAgICB0aGlzLmNvbnRyb2xzID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICB0aGlzLmNvbnRyb2xzLmNzcyh7XG4gICAgICAgICd0ZXh0LWFsaWduJzogJ2NlbnRlcicsXG4gICAgfSk7XG5cbiAgICBsZXQgZnVuZGFtZW50YWxGcmVxID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBsZXQgZmZMYWJlbCA9ICQoJzxzcGFuPkZ1bmRhbWVudGFsIEZyZXF1ZW5jeTogPC9zcGFuPicpO1xuICAgIGxldCBmZlRleHQgPSAkKCc8aW5wdXQgdHlwZT1cInRleHRcIiB2YWx1ZT0nICsgdGhpcy5mdW5kYW1lbnRhbEZyZXEgKyAnIC8+Jyk7XG4gICAgZmZUZXh0Lm9uKCdpbnB1dCcsICgpID0+IHtcbiAgICAgICAgdGhpcy5mdW5kYW1lbnRhbEZyZXEgPSBwYXJzZUZsb2F0KGZmVGV4dC52YWwoKSk7XG4gICAgICAgIHRoaXMuZHJhdygpO1xuICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICB9KTtcbiAgICBmdW5kYW1lbnRhbEZyZXEuYXBwZW5kKGZmTGFiZWwpO1xuICAgIGZ1bmRhbWVudGFsRnJlcS5hcHBlbmQoZmZUZXh0KTtcbiAgICB0aGlzLmNvbnRyb2xzLmFwcGVuZChmdW5kYW1lbnRhbEZyZXEpO1xuXG4gICAgdGhpcy5wYXJ0aWFsQ29udHJvbHMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGV2ZWxzOyBpKyspIHtcbiAgICAgICAgbGV0IGNvbnRyb2wgPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgICAgICBsZXQgbGFiZWwgPSBudWxsO1xuICAgICAgICBpZiAoaSA9PSAwKSB7XG4gICAgICAgICAgICBsYWJlbCA9ICQoJzxzcGFuPkY8L3NwYW4+Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYWJlbCA9ICQoJzxzcGFuPkgnICsgaSArICc8L3NwYW4+Jyk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNsaWRlciA9ICQoJzxpbnB1dCB0eXBlPVwicmFuZ2VcIiBtaW49LTEgbWF4PTEgc3RlcD0wLjAxIHZhbHVlPTAgLz4nKTtcblxuICAgICAgICAoKGlfKSA9PiB7IC8vIGNhcHR1cmluZyBpXG4gICAgICAgICAgICBzbGlkZXIub24oJ2lucHV0JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGZfLnBhcnRpYWxzW2lfXSA9IHBhcnNlRmxvYXQoc2xpZGVyLnZhbCgpKTtcbiAgICAgICAgICAgICAgICBzZWxmXy5kcmF3KCk7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGZfLmlzUGxheWluZykgc2VsZl8uc3RhcnQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KShpKTtcblxuICAgICAgICBjb250cm9sLmFwcGVuZChsYWJlbCk7XG4gICAgICAgIGNvbnRyb2wuYXBwZW5kKHNsaWRlcik7XG5cbiAgICAgICAgdGhpcy5jb250cm9scy5hcHBlbmQoY29udHJvbCk7XG5cbiAgICAgICAgdGhpcy5wYXJ0aWFsQ29udHJvbHMucHVzaChjb250cm9sKTtcbiAgICB9XG5cbiAgICB0aGlzLnN0YXJ0QnV0dG9uID0gJCgnPGlucHV0IHR5cGU9XCJidXR0b25cIiB2YWx1ZT1cIlN0YXJ0XCI+Jyk7XG4gICAgdGhpcy5zdGFydEJ1dHRvbi5vbignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzUGxheWluZykge1xuICAgICAgICAgICAgc2VsZl8uc3RvcCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZl8uc3RhcnQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5jb250cm9scy5hcHBlbmQodGhpcy5zdGFydEJ1dHRvbik7XG5cbiAgICBsZXQganFvID0gdGhpcy5nZXRDb250ZW50KCk7XG4gICAganFvLmNzcyh7XG4gICAgICAgICdvdmVyZmxvdy14JzogJ2hpZGRlbicsXG4gICAgICAgICdwYWRkaW5nJzogJzEwcHgnLFxuICAgIH0pO1xuICAgIGpxby5hcHBlbmQoJzxoMj5Gb3VyaWVyIFN5bnRoPC9oMj4nKTtcbiAgICBqcW8uYXBwZW5kKHRoaXMudmlzdWFsaXphdGlvbik7XG4gICAganFvLmFwcGVuZCh0aGlzLmNvbnRyb2xzKTtcblxuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xuXG4gICAgdGhpcy5hZGRQb3J0KCdsYicsIDExLCAnZnJlcS4gaW4nKTtcbiAgICBsZXQgcG9ydE91dCA9IHRoaXMuYWRkUG9ydCgncmInLCAxLCAnb3V0Jyk7XG4gICAgcG9ydE91dC5vbkNvbm5lY3QgPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHNlbGZfLmF1ZGlvTm9kZU91dCA9IGFyZ3MuYXVkaW9Ob2RlO1xuICAgIH07XG4gICAgcG9ydE91dC5vbkRpc2Nvbm5lY3QgPSBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgIHNlbGZfLmF1ZGlvTm9kZU91dCA9IG51bGw7XG4gICAgICAgIHNlbGZfLnN0b3AoKTtcbiAgICB9O1xufVxuXG5Gb3VyaWVyU3ludGgucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShGbG93Tm9kZS5wcm90b3R5cGUpO1xuRm91cmllclN5bnRoLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZvdXJpZXJTeW50aDtcblxuRm91cmllclN5bnRoLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IHNlbGZfID0gdGhpcztcbiAgICBsZXQgZHJhd1Bsb3QgPSBmdW5jdGlvbihmbikge1xuICAgICAgICBmdW5jdGlvblBsb3Qoe1xuICAgICAgICAgICAgdGFyZ2V0OiAnI3dhdmVfc3VtXycgKyBzZWxmXy51aWQsXG4gICAgICAgICAgICB3aWR0aDogc2VsZl8uZ2V0Q29udGVudCgpLndpZHRoKCksXG4gICAgICAgICAgICBoZWlnaHQ6IDE1MCxcbiAgICAgICAgICAgIGRpc2FibGVab29tOiB0cnVlLFxuICAgICAgICAgICAgeEF4aXM6IHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ3RpbWUgKG1zKScsXG4gICAgICAgICAgICAgICAgZG9tYWluOiBbMCwgMTAwMCAvIHNlbGZfLmZ1bmRhbWVudGFsRnJlcV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeUF4aXM6IHtcbiAgICAgICAgICAgICAgICBsYWJlbDogJ2FtcGxpdHVkZScsXG4gICAgICAgICAgICAgICAgZG9tYWluOiBbLTEsIDFdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdyaWQ6IHRydWUsXG4gICAgICAgICAgICBkYXRhOiBbe1xuICAgICAgICAgICAgICAgIGZuOiBmbixcbiAgICAgICAgICAgIH1dLFxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gc3VtXG4gICAgbGV0IHN1bUZ1biA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wYXJ0aWFscy5sZW5ndGg7IGkrKykge1xuICAgICAgICBzdW1GdW4ucHVzaCh0aGlzLnBhcnRpYWxzW2ldICsgJyAqIHNpbignXG4gICAgICAgICAgICArICgwLjAwMiAqIHRoaXMuZnVuZGFtZW50YWxGcmVxICogKGkgKyAxKSlcbiAgICAgICAgICAgICsgJyAqIFBJICogeCknKTtcbiAgICB9XG4gICAgc3VtRnVuID0gc3VtRnVuLmpvaW4oJyArICcpO1xuXG4gICAgdGhpcy53YXZlU3VtLmVtcHR5KCk7XG4gICAgZHJhd1Bsb3Qoc3VtRnVuKTtcblxuICAgIC8vIHBhcnRpYWxzXG59O1xuXG5Gb3VyaWVyU3ludGgucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuYXVkaW9Ob2RlT3V0ID09IG51bGwpIHtcbiAgICAgICAgYWxlcnQoJ05vIGNvbm5lY3Rpb24gb3V0IScpO1xuICAgICAgICB0aGlzLnN0b3AoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuaXNQbGF5aW5nKSB0aGlzLnN0b3AoKTtcbiAgICB0aGlzLm9zYyA9IG5ldyBUb25lLk9tbmlPc2NpbGxhdG9yKHRoaXMuZnVuZGFtZW50YWxGcmVxLCAnc2luZScpO1xuICAgIHRoaXMub3NjLnBhcnRpYWxzID0gdGhpcy5wYXJ0aWFscztcbiAgICB0aGlzLm9zYy5jb25uZWN0KHRoaXMuYXVkaW9Ob2RlT3V0KTtcbiAgICB0aGlzLm9zYy5zdGFydCgpO1xuXG4gICAgdGhpcy5pc1BsYXlpbmcgPSB0cnVlO1xuICAgIHRoaXMuc3RhcnRCdXR0b24udmFsKCdTdG9wJyk7XG59O1xuXG5Gb3VyaWVyU3ludGgucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5pc1BsYXlpbmcpIHtcbiAgICAgICAgdGhpcy5vc2Muc3RvcCgpO1xuICAgICAgICB0aGlzLm9zYy5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcbiAgICB0aGlzLnN0YXJ0QnV0dG9uLnZhbCgnU3RhcnQnKTtcbn07XG5cbmV4cG9ydCB7Rm91cmllclN5bnRofTtcbiIsImltcG9ydCB7Rmxvd05vZGV9IGZyb20gJy4uL3VpL0Zsb3dOb2RlLmpzJztcblxuLyoqXG4gKiBPdXRwdXQgbm9kZVxuICogQHJldHVybiB7Kn0gTnVsbCBpZiBlcnJvclxuICovXG5mdW5jdGlvbiBNYXN0ZXIoKSB7XG4gICAgRmxvd05vZGUuY2FsbCh0aGlzLCAxLCAxKTtcblxuICAgIGlmICh3aW5kb3cuVG9uZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOiBNb2R1bGUgTWFzdGVyIHJlcXVpcmVzIFRvbmUuanMhJyk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGxldCBwb3J0SW4gPSB0aGlzLmFkZFBvcnQoJ2xiJywgMSwgJ2luJyk7XG4gICAgcG9ydEluLmFyZ3MgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHt0eXBlOiAnQXVkaW9Ob2RlJywgYXVkaW9Ob2RlOiBUb25lLk1hc3Rlcn07XG4gICAgfTtcbn1cblxuTWFzdGVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRmxvd05vZGUucHJvdG90eXBlKTtcbk1hc3Rlci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBNYXN0ZXI7XG5cbmV4cG9ydCB7TWFzdGVyfTtcbiIsIi8vIGV4cG9ydCB7U3ludGhlc2l6ZXJ9IGZyb20gJy4vYXVkaW8vU3ludGhlc2l6ZXIuanMnO1xuXG5leHBvcnQge0ZvdXJpZXJTeW50aH0gZnJvbSAnLi9tb2R1bGVzL0ZvdXJpZXJTeW50aC5qcyc7XG5leHBvcnQge01hc3Rlcn0gZnJvbSAnLi9tb2R1bGVzL01hc3Rlci5qcyc7XG5cbmV4cG9ydCB7Rmxvd05vZGV9IGZyb20gJy4vdWkvRmxvd05vZGUuanMnO1xuZXhwb3J0IHtVSUVsZW1lbnR9IGZyb20gJy4vdWkvVUlFbGVtZW50LmpzJztcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7QUFLQSxTQUFTLFNBQVMsR0FBRztJQUNqQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQzs7SUFFeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7SUFDekIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQzs7SUFFN0IsSUFBSSxDQUFDLEdBQUcsR0FBRyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7Q0FDOUI7O0FBRUQsU0FBUyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDbEIsU0FBUyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7O0FBRXRCLFNBQVMsQ0FBQyxXQUFXLEdBQUcsU0FBUyxHQUFHLEVBQUU7SUFDbEMsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2hDLENBQUM7Ozs7OztBQU1GLFNBQVMsQ0FBQyxTQUFTLENBQUMsVUFBVSxHQUFHLFNBQVMsT0FBTyxFQUFFO0lBQy9DLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDOztJQUU1QixTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENB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
