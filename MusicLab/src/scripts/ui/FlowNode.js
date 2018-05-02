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
};

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
    };
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

export {FlowNode};
