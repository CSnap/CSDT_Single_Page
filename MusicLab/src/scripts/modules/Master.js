import {FlowNode} from '../ui/FlowNode.js';

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

export {Master};
