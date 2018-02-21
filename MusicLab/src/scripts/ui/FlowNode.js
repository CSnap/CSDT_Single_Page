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

    let jqo = $('<div></div>');
    jqo.addClass('flownode');
    jqo.css('margin', '10px 10px 10px 10px');
    jqo.draggable({grid: [22, 22]});
    this.setContent(jqo);

    this.setSize(this.width, this.height);
};

FlowNode.prototype = Object.create(UIElement.prototype);
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

export {FlowNode};
