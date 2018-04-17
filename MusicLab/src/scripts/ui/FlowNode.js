import {UIElement} from './UIElement.js';

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
};

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

export {FlowNode};
