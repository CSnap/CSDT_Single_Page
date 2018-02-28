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
}

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
};

Track.prototype.addStart = function() {
    let start = new Track.StartNode(this);
    this.addChild(start);
};

Track.prototype.addSegment = function() {
    let newSegment = new Track.Segment(this);
    this.addChild(newSegment);
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

Track.StartNode = function(parentTrack) {
    Track.Element.call(this);

    let jqo = $('<div></div>');
    jqo.addClass('flowtrackstartnode');
    jqo.css('margin', '0 auto');

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

    this.addBtn.on('click', () => {
        console.log('This method takes approximately one-week currently, but it works');
    });

    jqo.append(this.addBtn);

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

exports.Synthesizer = Synthesizer;
exports.FlowNode = FlowNode;
exports.Track = Track;
exports.UIElement = UIElement;

return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXVzaWNMYWIuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY3JpcHRzL2F1ZGlvL1N5bnRoZXNpemVyLmpzIiwiLi4vLi4vc3JjL3NjcmlwdHMvdWkvVUlFbGVtZW50LmpzIiwiLi4vLi4vc3JjL3NjcmlwdHMvdWkvRmxvd05vZGUuanMiLCIuLi8uLi9zcmMvc2NyaXB0cy91aS9UcmFjay5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBFeHRlcm5hbCBJbXBvcnRzOiBUb25lLmpzXG5cbi8qKlxuICogUHJvdmlkZXMgYW4gaW50ZXJmYWNlIHdpdGggVG9uZS5qc1xuICovXG5mdW5jdGlvbiBTeW50aGVzaXplcigpIHtcbiAgICB0aGlzLnN5bnRoID0gbmV3IFRvbmUuU3ludGgoKS50b01hc3RlcigpO1xufVxuXG5TeW50aGVzaXplci5wcm90b3R5cGUudGVzdCA9IGZ1bmN0aW9uKCkge1xuICAgIGxldCBfc2VsZiA9IHRoaXM7XG4gICAgbGV0IGxvb3AwID0gZnVuY3Rpb24odGltZSkge1xuICAgICAgICBfc2VsZi5zeW50aC50cmlnZ2VyQXR0YWNrUmVsZWFzZSgnQzQnLCAnNG4nLCB0aW1lICsgMCk7XG4gICAgICAgIF9zZWxmLnN5bnRoLnRyaWdnZXJBdHRhY2tSZWxlYXNlKCdFYjQnLCAnNG4nLCB0aW1lICsgMC41KTtcbiAgICAgICAgX3NlbGYuc3ludGgudHJpZ2dlckF0dGFja1JlbGVhc2UoJ0c0JywgJzRuJywgdGltZSArIDEpO1xuICAgICAgICBfc2VsZi5zeW50aC50cmlnZ2VyQXR0YWNrUmVsZWFzZSgnQmI0JywgJzRuJywgdGltZSArIDEuNSk7XG4gICAgICAgIF9zZWxmLnN5bnRoLnRyaWdnZXJBdHRhY2tSZWxlYXNlKCdDNCcsICc0bicsIHRpbWUgKyAyKTtcbiAgICAgICAgX3NlbGYuc3ludGgudHJpZ2dlckF0dGFja1JlbGVhc2UoJ0ViNCcsICc0bicsIHRpbWUgKyAyLjUpO1xuICAgICAgICBfc2VsZi5zeW50aC50cmlnZ2VyQXR0YWNrUmVsZWFzZSgnRzQnLCAnNG4nLCB0aW1lICsgMyk7XG4gICAgICAgIF9zZWxmLnN5bnRoLnRyaWdnZXJBdHRhY2tSZWxlYXNlKCdCYjQnLCAnNG4nLCB0aW1lICsgMy41KTtcbiAgICB9O1xuXG4gICAgVG9uZS5UcmFuc3BvcnQuc2NoZWR1bGUobG9vcDAsIDApO1xuICAgIFRvbmUuVHJhbnNwb3J0Lmxvb3BFbmQgPSAnMW0nO1xuICAgIFRvbmUuVHJhbnNwb3J0Lmxvb3AgPSB0cnVlO1xuXG4gICAgVG9uZS5UcmFuc3BvcnQuc3RhcnQoKTtcbn07XG5cbmV4cG9ydCB7U3ludGhlc2l6ZXJ9O1xuIiwiLyoqXG4qIEFuIGFic3RyYWN0IGNsYXNzIGZvciBoYW5kbGluZyBpbnRlZ3JhdGlvbiB3aXRoIEhUTUxcbipcbiogRXh0ZXJuYWwgZGVwZW5kZW5jaWVzOiBqUXVlcnlcbiovXG5mdW5jdGlvbiBVSUVsZW1lbnQoKSB7XG4gICAgdGhpcy5pc1VJRWxlbWVudCA9IHRydWU7XG5cbiAgICB0aGlzLmpRdWVyeU9iamVjdCA9IG51bGw7XG4gICAgdGhpcy5jb250ZW50Q29udGFpbmVyID0gbnVsbDtcblxuICAgIHRoaXMudWlkID0gVUlFbGVtZW50LnVpZCsrO1xufVxuXG5VSUVsZW1lbnQudWlkID0gMDtcblVJRWxlbWVudC5sb29rdXAgPSB7fTtcblxuVUlFbGVtZW50Lmxvb2t1cEJ5VWlkID0gZnVuY3Rpb24odWlkKSB7XG4gICAgcmV0dXJuIFVJRWxlbWVudC5sb29rdXBbdWlkXTtcbn07XG5cbi8qKlxuKiBTZXRzIGNvbnRlbnQgdG8gYSBqUXVlcnkgb2JqZWN0XG4qIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IGEgalF1ZXJ5IG9iamVjdFxuKi9cblVJRWxlbWVudC5wcm90b3R5cGUuc2V0Q29udGVudCA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgICB0aGlzLmpRdWVyeU9iamVjdCA9IGVsZW1lbnQ7XG5cbiAgICBVSUVsZW1lbnQubG9va3VwW3RoaXMudWlkXSA9IHRoaXM7XG4gICAgdGhpcy5qUXVlcnlPYmplY3QuYXR0cigndWlkJywgdGhpcy51aWQpO1xufTtcblxuLyoqXG4qIEluamVjdHMgY29udGVudCBpbnRvIGEgalF1ZXJ5IG9iamVjdFxuKiBAcGFyYW0ge2pRdWVyeSB8IFVJRWxlbWVudH0gZWxlbWVudCBqUXVlcnkgb2JqZWN0IHRvIGluamVjdCBjb250ZW50IGludG9cbiovXG5VSUVsZW1lbnQucHJvdG90eXBlLmluamVjdENvbnRlbnQgPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgaWYgKHRoaXMualF1ZXJ5T2JqZWN0ID09IG51bGwpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6IENvbnRlbnQgbm90IHNldCEnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChlbGVtZW50LmlzVUlFbGVtZW50KSB7XG4gICAgICAgIGVsZW1lbnQualF1ZXJ5T2JqZWN0LmFwcGVuZCh0aGlzLmpRdWVyeU9iamVjdCk7XG4gICAgICAgIHRoaXMuY29udGVudENvbnRhaW5lciA9IGVsZW1lbnQualF1ZXJ5T2JqZWN0O1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudCBpbnN0YW5jZW9mIGpRdWVyeSkge1xuICAgICAgICBlbGVtZW50LmFwcGVuZCh0aGlzLmpRdWVyeU9iamVjdCk7XG4gICAgICAgIHRoaXMuY29udGVudENvbnRhaW5lciA9IGVsZW1lbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6IEludmFsaWQgdHlwZSAoZWxlbWVudCkhJyk7XG4gICAgfVxufTtcblxuLyoqXG4qIFJlbW92ZXMgdGhlIFVJRWxlbWVudCBmcm9tIHRoZSBkb2N1bWVudFxuKi9cblVJRWxlbWVudC5wcm90b3R5cGUucmVtb3ZlQ29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMualF1ZXJ5T2JqZWN0LnJlbW92ZSgpO1xuICAgIGRlbGV0ZSBVSUVsZW1lbnQubG9va3VwW3RoaXMudWlkXTtcbn07XG5cbi8qKlxuKiBSZXR1cm5zIHRoZSBhc3NvY2lhdGVkIGpRdWVyeSBPYmplY3RcbiogQHJldHVybiB7alF1ZXJ5fVxuKi9cblVJRWxlbWVudC5wcm90b3R5cGUuZ2V0Q29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmpRdWVyeU9iamVjdDtcbn07XG5cblVJRWxlbWVudC5wcm90b3R5cGUuZ2V0Q29udGVudENvbnRhaW5lciA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnRlbnRDb250YWluZXI7XG59O1xuXG5leHBvcnQge1VJRWxlbWVudH07XG4iLCJpbXBvcnQge1VJRWxlbWVudH0gZnJvbSAnLi9VSUVsZW1lbnQuanMnO1xuXG4vKipcbiogQSByZXByZXNlbnRhdGlvbiBvZiBhIG5vZGUgd2l0aGluIGEgcHJvZ3JhbS4gSW5jbHVkZXMgVUkgYW5kIG90aGVyIGZ1bmN0aW9uc1xuKiB0byBpbnRlZ3JhdGUgd2l0aCB0aGUgcHJvZ3JhbSBhcyBhIHdob2xlXG4qXG4qIEV4dGVybmFsIGRlcGVuZGVuY2llczogalF1ZXJ5VUlcbipcbiogQHBhcmFtIHtudW1iZXI9fSB3aWR0aCB3aWR0aCBvZiB0aGUgbm9kZSBpbiB1bml0c1xuKiBAcGFyYW0ge251bWJlcj19IGhlaWdodCBoZWlnaHQgb2YgdGhlIG5vZGUgaW4gdW5pdHNcbiovXG5mdW5jdGlvbiBGbG93Tm9kZSh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgVUlFbGVtZW50LmNhbGwodGhpcyk7XG4gICAgdGhpcy5pc0Zsb3dOb2RlID0gdHJ1ZTtcblxuICAgIHRoaXMud2lkdGggPSB3aWR0aCAhPT0gdW5kZWZpbmVkID8gd2lkdGggOiAxO1xuICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0ICE9PSB1bmRlZmluZWQgPyBoZWlnaHQgOiAxO1xuICAgIHRoaXMucG9ydHMgPSBbXTtcblxuICAgIGxldCBqcW8gPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIGpxby5hZGRDbGFzcygnZmxvd25vZGUnKTtcbiAgICBqcW8uY3NzKCdtYXJnaW4nLCAnMTBweCAxMHB4IDEwcHggMTBweCcpO1xuICAgIGpxby5kcmFnZ2FibGUoe2dyaWQ6IFsyMiwgMjJdfSk7XG5cbiAgICB0aGlzLnNldENvbnRlbnQoanFvKTtcblxuICAgIHRoaXMuc2V0U2l6ZSh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG59O1xuXG5GbG93Tm9kZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRWxlbWVudC5wcm90b3R5cGUpO1xuRmxvd05vZGUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmxvd05vZGU7XG5cbkZsb3dOb2RlLnByb3RvdHlwZS5zZXRTaXplID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCkge1xuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcblxuICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnd2lkdGgnLCAxMTAgKiB3aWR0aCAtIDEwKTtcbiAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2hlaWdodCcsIDExMCAqIGhlaWdodCAtIDEwKTtcbn07XG5cbkZsb3dOb2RlLnByb3RvdHlwZS5hZGRQb3J0ID0gZnVuY3Rpb24oZG9ja2luZywgb2Zmc2V0LCBsYWJlbCkge1xuICAgIGxldCBwb3J0ID0gbmV3IEZsb3dOb2RlLlBvcnQodGhpcywgZG9ja2luZywgb2Zmc2V0LCBsYWJlbCk7XG4gICAgdGhpcy5wb3J0cy5wdXNoKHBvcnQpO1xuICAgIHJldHVybiBwb3J0O1xufTtcblxuLyoqXG4qIEBwYXJhbSB7Rmxvd05vZGV9IHBhcmVudFxuKiBAcGFyYW0ge3N0cmluZz19IGRvY2tpbmdcbiogQHBhcmFtIHtudW1iZXI9fSBvZmZzZXRcbiogQHBhcmFtIHtzdHJpbmc9fSBsYWJlbFxuKi9cbkZsb3dOb2RlLlBvcnQgPSBmdW5jdGlvbihwYXJlbnQsIGRvY2tpbmcsIG9mZnNldCwgbGFiZWwpIHtcbiAgICBVSUVsZW1lbnQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmlzRmxvd05vZGVQb3J0ID0gdHJ1ZTtcblxuICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgIHRoaXMuZG9ja2luZyA9IGRvY2tpbmcgIT09IHVuZGVmaW5lZCA/IGRvY2tpbmcgOiAndGwnO1xuICAgIHRoaXMub2Zmc2V0ID0gb2Zmc2V0ICE9PSB1bmRlZmluZWQgPyBvZmZzZXQgOiAwO1xuICAgIHRoaXMubGFiZWwgPSBsYWJlbCAhPT0gdW5kZWZpbmVkID8gbGFiZWwgOiAnJztcblxuICAgIGxldCBqcW8gPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIGpxby5hZGRDbGFzcygnZmxvd25vZGVwb3J0Jyk7XG4gICAganFvLmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcbiAgICB0aGlzLnNldENvbnRlbnQoanFvKTtcblxuICAgIHRoaXMuaW5qZWN0Q29udGVudChwYXJlbnQuZ2V0Q29udGVudCgpKTtcbiAgICB0aGlzLnVwZGF0ZUxheW91dCgpO1xuXG4gICAgbGV0IGNvbm5lY3RvciA9IG51bGw7XG4gICAgbGV0IF9zZWxmID0gdGhpcztcbiAgICBqcW8ub24oJ21vdXNlZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50Lm9yaWdpbmFsRXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgbGV0IHIgPSBfc2VsZi5nZXRDb250ZW50KClbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGxldCB4ID0gKHIubGVmdCArIHIucmlnaHQpIC8gMisgd2luZG93LnNjcm9sbFg7XG4gICAgICAgIGxldCB5ID0gKHIudG9wICsgci5ib3R0b20pIC8gMiArIHdpbmRvdy5zY3JvbGxZO1xuXG4gICAgICAgIGNvbm5lY3RvciA9IG5ldyBGbG93Tm9kZS5Db25uZWN0b3Ioe3g6IHgsIHk6IHl9KTtcbiAgICAgICAgY29ubmVjdG9yLmluamVjdENvbnRlbnQoX3NlbGYucGFyZW50LmdldENvbnRlbnRDb250YWluZXIoKSk7XG4gICAgfSk7XG5cbiAgICBsZXQgZ2V0TmVhcmJ5UG9ydHMgPSBmdW5jdGlvbihjbGllbnRYLCBjbGllbnRZKSB7XG4gICAgICAgIGxldCBuZWFyYnkgPSBbXTtcbiAgICAgICAgJCgnLmZsb3dub2RlcG9ydCcpLmVhY2goKGluZGV4LCBkb20pID0+IHtcbiAgICAgICAgICAgIGxldCBlbGVtID0gJChkb20pO1xuICAgICAgICAgICAgbGV0IHIgPSBlbGVtWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgICAgICBsZXQgY3ggPSAoci5sZWZ0ICsgci5yaWdodCkgLyAyO1xuICAgICAgICAgICAgbGV0IGN5ID0gKHIudG9wICsgci5ib3R0b20pIC8gMjtcblxuICAgICAgICAgICAgbGV0IGQyID0gTWF0aC5wb3coY3ggLSBjbGllbnRYLCAyKSArIE1hdGgucG93KGN5IC0gY2xpZW50WSwgMik7XG4gICAgICAgICAgICBpZiAoZDIgPCAxMDApIG5lYXJieS5wdXNoKFVJRWxlbWVudC5sb29rdXBCeVVpZChlbGVtLmF0dHIoJ3VpZCcpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbmVhcmJ5O1xuICAgIH07XG5cbiAgICB0aGlzLnBhcmVudC5nZXRDb250ZW50Q29udGFpbmVyKCkub24oJ21vdXNlbW92ZScsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoY29ubmVjdG9yICE9IG51bGwpIHtcbiAgICAgICAgICAgIGxldCB4ID0gZXZlbnQub3JpZ2luYWxFdmVudC5jbGllbnRYICsgd2luZG93LnNjcm9sbFg7XG4gICAgICAgICAgICBsZXQgeSA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQuY2xpZW50WSArIHdpbmRvdy5zY3JvbGxZO1xuXG4gICAgICAgICAgICBsZXQgbnAgPSBnZXROZWFyYnlQb3J0cyhldmVudC5vcmlnaW5hbEV2ZW50LmNsaWVudFgsXG4gICAgICAgICAgICAgICAgZXZlbnQub3JpZ2luYWxFdmVudC5jbGllbnRZKTtcbiAgICAgICAgICAgICAgICBpZiAobnAubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgciA9IG5wWzBdLmdldENvbnRlbnQoKVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgeCA9IChyLmxlZnQgKyByLnJpZ2h0KSAvIDIgKyB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgICAgICAgICAgICAgeSA9IChyLnRvcCArIHIuYm90dG9tKSAvIDIrIHdpbmRvdy5zY3JvbGxZO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbm5lY3Rvci5zZXRUYXJnZXQoe3g6IHgsIHk6IHl9KTtcbiAgICAgICAgICAgICAgICBjb25uZWN0b3IudXBkYXRlTGF5b3V0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucGFyZW50LmdldENvbnRlbnRDb250YWluZXIoKS5vbignbW91c2V1cCcsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNvbm5lY3RvciAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbGV0IG5wID0gZ2V0TmVhcmJ5UG9ydHMoZXZlbnQub3JpZ2luYWxFdmVudC5jbGllbnRYLFxuICAgICAgICAgICAgICAgICAgICBldmVudC5vcmlnaW5hbEV2ZW50LmNsaWVudFkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobnAubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHIgPSBucFswXS5nZXRDb250ZW50KClbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgeCA9IChyLmxlZnQgKyByLnJpZ2h0KSAvIDIgKyB3aW5kb3cuc2Nyb2xsWDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB5ID0gKHIudG9wICsgci5ib3R0b20pIC8gMiArIHdpbmRvdy5zY3JvbGxZO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYyA9IG5ldyBGbG93Tm9kZS5Db25uZWN0b3IoY29ubmVjdG9yLm9yaWdpbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7eDogeCwgeTogeX0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgYy5pbmplY3RDb250ZW50KF9zZWxmLnBhcmVudC5nZXRDb250ZW50Q29udGFpbmVyKCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdG9yLnJlbW92ZUNvbnRlbnQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29ubmVjdG9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBGbG93Tm9kZS5Qb3J0LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVUlFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgICAgIEZsb3dOb2RlLlBvcnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gRmxvd05vZGUuUG9ydDtcblxuICAgICAgICBGbG93Tm9kZS5Qb3J0LnByb3RvdHlwZS51cGRhdGVMYXlvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHN3aXRjaCAodGhpcy5kb2NraW5nWzBdKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndCc6XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCd0b3AnLCAwKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2JvdHRvbScsICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2xlZnQnLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdyaWdodCcsICcnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdiJzpcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3RvcCcsICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ2JvdHRvbScsIDApO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnbGVmdCcsICcnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvbnRlbnQoKS5jc3MoJ3JpZ2h0JywgJycpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2wnOlxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygndG9wJywgJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnYm90dG9tJywgJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygnbGVmdCcsIDApO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygncmlnaHQnLCAnJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncic6XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCd0b3AnLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdib3R0b20nLCAnJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdsZWZ0JywgJycpO1xuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygncmlnaHQnLCAwKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICdJbnZhbGlkIGRvY2tpbmcgb3B0aW9uIFxcJycgKyB0aGlzLmRvY2tpbmcgKyAnXFwnIScpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IHBpeGVsT2Zmc2V0ID0gMTUgKiAodGhpcy5vZmZzZXQgKyAxKTtcbiAgICAgICAgICAgIHN3aXRjaCAodGhpcy5kb2NraW5nWzFdKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndCc6XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCd0b3AnLCBwaXhlbE9mZnNldCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnYic6XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdib3R0b20nLCBwaXhlbE9mZnNldCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnbCc6XG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KCkuY3NzKCdsZWZ0JywgcGl4ZWxPZmZzZXQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3InOlxuICAgICAgICAgICAgICAgIHRoaXMuZ2V0Q29udGVudCgpLmNzcygncmlnaHQnLCBwaXhlbE9mZnNldCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICAnSW52YWxpZCBkb2NraW5nIG9wdGlvbiBcXCcnICsgdGhpcy5kb2NraW5nICsgJ1xcJyEnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICpcbiAgICAgICAgKiBAcGFyYW0ge09iamVjdD19IG9yaWdpblxuICAgICAgICAqIEBwYXJhbSB7T2JqZWN0PX0gdGFyZ2V0XG4gICAgICAgICovXG4gICAgICAgIEZsb3dOb2RlLkNvbm5lY3RvciA9IGZ1bmN0aW9uKG9yaWdpbiwgdGFyZ2V0KSB7XG4gICAgICAgICAgICBVSUVsZW1lbnQuY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMuaXNGbG93Tm9kZUNvbm5lY3RvciA9IHRydWU7XG5cbiAgICAgICAgICAgIHRoaXMub3JpZ2luID0gb3JpZ2luICE9PSB1bmRlZmluZWQgPyBvcmlnaW4gOiB7eDogMCwgeTogMH07XG4gICAgICAgICAgICB0aGlzLnRhcmdldCA9IHRhcmdldCAhPT0gdW5kZWZpbmVkID8gdGFyZ2V0IDogdGhpcy5vcmlnaW47XG5cbiAgICAgICAgICAgIGxldCBucyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG4gICAgICAgICAgICB0aGlzLnN2ZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhucywgJ3N2ZycpO1xuXG4gICAgICAgICAgICB0aGlzLnJlY3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobnMsICdyZWN0Jyk7XG4gICAgICAgICAgICB0aGlzLnN2Zy5hcHBlbmRDaGlsZCh0aGlzLnJlY3QpO1xuXG4gICAgICAgICAgICBsZXQganFvID0gJCh0aGlzLnN2Zyk7XG4gICAgICAgICAgICBqcW8uY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xuICAgICAgICAgICAgdGhpcy5zZXRDb250ZW50KGpxbyk7XG5cbiAgICAgICAgICAgIHRoaXMudXBkYXRlTGF5b3V0KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgRmxvd05vZGUuQ29ubmVjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoVUlFbGVtZW50LnByb3RvdHlwZSk7XG4gICAgICAgIEZsb3dOb2RlLkNvbm5lY3Rvci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBGbG93Tm9kZS5Db25uZWN0b3I7XG5cbiAgICAgICAgRmxvd05vZGUuQ29ubmVjdG9yLnByb3RvdHlwZS51cGRhdGVMYXlvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuc3ZnLnNldEF0dHJpYnV0ZU5TKG51bGwsICd3aWR0aCcsXG4gICAgICAgICAgICBNYXRoLmFicyh0aGlzLm9yaWdpbi54IC0gdGhpcy50YXJnZXQueCkpO1xuICAgICAgICAgICAgdGhpcy5zdmcuc2V0QXR0cmlidXRlTlMobnVsbCwgJ2hlaWdodCcsXG4gICAgICAgICAgICBNYXRoLmFicyh0aGlzLm9yaWdpbi55IC0gdGhpcy50YXJnZXQueSkpO1xuXG4gICAgICAgICAgICB0aGlzLnJlY3Quc2V0QXR0cmlidXRlTlMobnVsbCwgJ3dpZHRoJyxcbiAgICAgICAgICAgIE1hdGguYWJzKHRoaXMub3JpZ2luLnggLSB0aGlzLnRhcmdldC54KSk7XG4gICAgICAgICAgICB0aGlzLnJlY3Quc2V0QXR0cmlidXRlTlMobnVsbCwgJ2hlaWdodCcsXG4gICAgICAgICAgICBNYXRoLmFicyh0aGlzLm9yaWdpbi55IC0gdGhpcy50YXJnZXQueSkpO1xuICAgICAgICAgICAgdGhpcy5yZWN0LnNldEF0dHJpYnV0ZU5TKG51bGwsICdmaWxsJywgJyNmMDYnKTtcblxuICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KClcbiAgICAgICAgICAgICAgICAuY3NzKCdsZWZ0JywgTWF0aC5taW4odGhpcy5vcmlnaW4ueCwgdGhpcy50YXJnZXQueCkpO1xuICAgICAgICAgICAgdGhpcy5nZXRDb250ZW50KClcbiAgICAgICAgICAgICAgICAuY3NzKCd0b3AnLCBNYXRoLm1pbih0aGlzLm9yaWdpbi55LCB0aGlzLnRhcmdldC55KSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgRmxvd05vZGUuQ29ubmVjdG9yLnByb3RvdHlwZS5zZXRUYXJnZXQgPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgICAgICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuICAgICAgICB9O1xuXG4gICAgICAgIGV4cG9ydCB7Rmxvd05vZGV9O1xuXG5cbiIsImltcG9ydCB7VUlFbGVtZW50fSBmcm9tICcuL1VJRWxlbWVudC5qcyc7XG5cbi8qKlxuICogQSB0cmFjayBvbiB3aGljaCBwcm9ncmFtIGluc3RydWN0aW9ucyBsaWUgdG8gY3JlYXRlIGFuIGludHVpdGl2ZSBsaW5lYXJcbiAqIHByb2dyZXNzaW9uLlxuKi9cbmZ1bmN0aW9uIFRyYWNrKCkge1xuICAgIFVJRWxlbWVudC5jYWxsKHRoaXMpO1xuICAgIHRoaXMuaXNUcmFjayA9IHRydWU7XG5cbiAgICBsZXQganFvID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBqcW8uY3NzKCd3aWR0aCcsICcxMDAlJyk7XG4gICAganFvLmNzcygnZGlzcGxheScsICdpbmxpbmUtYmxvY2snKTtcblxuICAgIHRoaXMuY2hpbGRyZW4gPSBbXTtcblxuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xufVxuXG5UcmFjay5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRWxlbWVudC5wcm90b3R5cGUpO1xuVHJhY2sucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHJhY2s7XG5cblRyYWNrLnByb3RvdHlwZS5hZGRDaGlsZCA9IGZ1bmN0aW9uKGNoaWxkKSB7XG4gICAgaWYgKCFjaGlsZC5pc1RyYWNrRWxlbWVudCkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvcjogSW52YWxpZCB0eXBlIGZvciBjaGlsZCcpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jaGlsZHJlbi5wdXNoKGNoaWxkKTtcblxuICAgIGNoaWxkLnBhcmVudFRyYWNrID0gdGhpcztcbiAgICBjaGlsZC5pbmplY3RDb250ZW50KHRoaXMpO1xufTtcblxuVHJhY2sucHJvdG90eXBlLmFkZFN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IHN0YXJ0ID0gbmV3IFRyYWNrLlN0YXJ0Tm9kZSh0aGlzKTtcbiAgICB0aGlzLmFkZENoaWxkKHN0YXJ0KTtcbn07XG5cblRyYWNrLnByb3RvdHlwZS5hZGRTZWdtZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgbGV0IG5ld1NlZ21lbnQgPSBuZXcgVHJhY2suU2VnbWVudCh0aGlzKTtcbiAgICB0aGlzLmFkZENoaWxkKG5ld1NlZ21lbnQpO1xufTtcblxuXG5UcmFjay5FbGVtZW50ID0gZnVuY3Rpb24ocGFyZW50VHJhY2spIHtcbiAgICBVSUVsZW1lbnQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmlzVHJhY2tFbGVtZW50ID0gdHJ1ZTtcblxuICAgIHRoaXMucGFyZW50VHJhY2sgPSBwYXJlbnRUcmFjayA/IHBhcmVudFRyYWNrIDogbnVsbDtcbn07XG5cblRyYWNrLkVsZW1lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUVsZW1lbnQucHJvdG90eXBlKTtcblRyYWNrLkVsZW1lbnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHJhY2suRWxlbWVudDtcblxuVHJhY2suRWxlbWVudC5wcm90b3R5cGUuZ2V0UGFyZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucGFyZW50VHJhY2s7XG59O1xuXG5UcmFjay5TdGFydE5vZGUgPSBmdW5jdGlvbihwYXJlbnRUcmFjaykge1xuICAgIFRyYWNrLkVsZW1lbnQuY2FsbCh0aGlzKTtcblxuICAgIGxldCBqcW8gPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIGpxby5hZGRDbGFzcygnZmxvd3RyYWNrc3RhcnRub2RlJyk7XG4gICAganFvLmNzcygnbWFyZ2luJywgJzAgYXV0bycpO1xuXG4gICAgdGhpcy5zZXRDb250ZW50KGpxbyk7XG59O1xuXG5UcmFjay5TdGFydE5vZGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUcmFjay5FbGVtZW50LnByb3RvdHlwZSk7XG5UcmFjay5TdGFydE5vZGUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVHJhY2suU3RhcnROb2RlO1xuXG5UcmFjay5TZWdtZW50ID0gZnVuY3Rpb24ocGFyZW50VHJhY2spIHtcbiAgICBUcmFjay5FbGVtZW50LmNhbGwodGhpcyk7XG5cbiAgICB0aGlzLnBhcmVudFRyYWNrID0gcGFyZW50VHJhY2s7XG5cbiAgICBsZXQganFvID0gJCgnPGRpdj48L2Rpdj4nKTtcbiAgICBqcW8uYWRkQ2xhc3MoJ2Zsb3d0cmFjaycpO1xuICAgIGpxby5hZGRDbGFzcygnZmxvd3RyYWNrc2VnbWVudCcpO1xuICAgIGpxby5jc3MoJ3Bvc2l0aW9uJywgJ3JlbGF0aXZlJyk7XG4gICAganFvLmNzcygnbWFyZ2luJywgJzAgYXV0bycpO1xuXG4gICAgdGhpcy5hZGRCdG4gPSAkKCc8ZGl2PjwvZGl2PicpO1xuICAgIHRoaXMuYWRkQnRuLmFkZENsYXNzKCdmbG93dHJhY2tzZWdtZW50YWRkJyk7XG4gICAgdGhpcy5hZGRCdG4uY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xuICAgIHRoaXMuYWRkQnRuLmNzcygnei1pbmRleCcsICcxJyk7XG5cbiAgICB0aGlzLmFkZEJ0bi5vbignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdUaGlzIG1ldGhvZCB0YWtlcyBhcHByb3hpbWF0ZWx5IG9uZS13ZWVrIGN1cnJlbnRseSwgYnV0IGl0IHdvcmtzJyk7XG4gICAgfSk7XG5cbiAgICBqcW8uYXBwZW5kKHRoaXMuYWRkQnRuKTtcblxuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xuXG4gICAgdGhpcy51cGRhdGVMYXlvdXQoKTtcbn07XG5cblRyYWNrLlNlZ21lbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUcmFjay5FbGVtZW50LnByb3RvdHlwZSk7XG5UcmFjay5TZWdtZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFRyYWNrLlNlZ21lbnQ7XG5cblRyYWNrLlNlZ21lbnQucHJvdG90eXBlLnVwZGF0ZUxheW91dCA9IGZ1bmN0aW9uKCkge1xuICAgIGxldCBvZmZzZXQgPSB0aGlzLmdldENvbnRlbnQoKS5vZmZzZXQoKTtcblxuICAgIGxldCB4ID1cbiAgICAgICAgb2Zmc2V0LmxlZnQgKyAodGhpcy5nZXRDb250ZW50KCkud2lkdGgoKSAtIHRoaXMuYWRkQnRuLndpZHRoKCkpIC8gMjtcbiAgICBsZXQgeSA9XG4gICAgICAgIG9mZnNldC50b3AgKyAodGhpcy5nZXRDb250ZW50KCkuaGVpZ2h0KCkgLSB0aGlzLmFkZEJ0bi5oZWlnaHQoKSkgLyAyO1xuXG4gICAgdGhpcy5hZGRCdG4uY3NzKCdsZWZ0JywgeCk7XG4gICAg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
