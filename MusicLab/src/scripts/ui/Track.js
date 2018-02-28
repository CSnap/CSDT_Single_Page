import {UIElement} from './UIElement.js';

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
        console.log(
            'This method takes approximately one-week currently, but it works'
        );
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

export {Track};
