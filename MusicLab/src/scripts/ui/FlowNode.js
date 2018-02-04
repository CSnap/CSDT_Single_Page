import {UIElement} from './UIElement.js';

/**
 * A representation of a node within a program. Includes UI and other functions
 * to integrate with the program as a whole
 * 
 * External dependencies: jQueryUI
 */
function FlowNode() {
    UIElement.call(this);
    this.isFlowNode = true;

    let jqo = $('<div></div>');
    jqo.addClass('flownode');
    jqo.draggable();

    this.setContent(jqo);
}
FlowNode.prototype = Object.create(UIElement.prototype);
FlowNode.prototype.constructor = FlowNode;

export {FlowNode};
