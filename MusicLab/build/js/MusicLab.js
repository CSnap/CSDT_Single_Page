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
}

/**
 * Sets content to a jQuery object
 * @param {jQuery} element a jQuery object
 */
UIElement.prototype.setContent = function(element) {
    this.jQueryObject = element;
};

/**
 * Injects content into a jQuery object
 * @param {jQuery} element jQuery object to inject content into
 */
UIElement.prototype.injectContent = function(element) {
    if (this.jQueryObject == null) {
        console.error('Error: Content not set!');
        return;
    }

    element.append(this.jQueryObject);
};

/**
 * Removes the UIElement from the document
 */
UIElement.prototype.removeContent = function() {
    this.jQueryObject.remove();
};

/**
 * Returns the associated jQuery Object
 * @return {jQuery}
 */
UIElement.prototype.getContent = function() {
    return this.jQueryObject;
};

/**
 * A representation of a node within a program. Includes UI and other functions
 * to integrate with the program as a whole
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

exports.Synthesizer = Synthesizer;
exports.FlowNode = FlowNode;
exports.UIElement = UIElement;

return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXVzaWNMYWIuanMiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY3JpcHRzL2F1ZGlvL1N5bnRoZXNpemVyLmpzIiwiLi4vLi4vc3JjL3NjcmlwdHMvdWkvVUlFbGVtZW50LmpzIiwiLi4vLi4vc3JjL3NjcmlwdHMvdWkvRmxvd05vZGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gRXh0ZXJuYWwgSW1wb3J0czogVG9uZS5qc1xuXG4vKipcbiAqIFByb3ZpZGVzIGFuIGludGVyZmFjZSB3aXRoIFRvbmUuanNcbiAqL1xuZnVuY3Rpb24gU3ludGhlc2l6ZXIoKSB7XG4gICAgdGhpcy5zeW50aCA9IG5ldyBUb25lLlN5bnRoKCkudG9NYXN0ZXIoKTtcbn1cblxuU3ludGhlc2l6ZXIucHJvdG90eXBlLnRlc3QgPSBmdW5jdGlvbigpIHtcbiAgICBsZXQgX3NlbGYgPSB0aGlzO1xuICAgIGxldCBsb29wMCA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgICAgX3NlbGYuc3ludGgudHJpZ2dlckF0dGFja1JlbGVhc2UoJ0M0JywgJzRuJywgdGltZSArIDApO1xuICAgICAgICBfc2VsZi5zeW50aC50cmlnZ2VyQXR0YWNrUmVsZWFzZSgnRWI0JywgJzRuJywgdGltZSArIDAuNSk7XG4gICAgICAgIF9zZWxmLnN5bnRoLnRyaWdnZXJBdHRhY2tSZWxlYXNlKCdHNCcsICc0bicsIHRpbWUgKyAxKTtcbiAgICAgICAgX3NlbGYuc3ludGgudHJpZ2dlckF0dGFja1JlbGVhc2UoJ0JiNCcsICc0bicsIHRpbWUgKyAxLjUpO1xuICAgICAgICBfc2VsZi5zeW50aC50cmlnZ2VyQXR0YWNrUmVsZWFzZSgnQzQnLCAnNG4nLCB0aW1lICsgMik7XG4gICAgICAgIF9zZWxmLnN5bnRoLnRyaWdnZXJBdHRhY2tSZWxlYXNlKCdFYjQnLCAnNG4nLCB0aW1lICsgMi41KTtcbiAgICAgICAgX3NlbGYuc3ludGgudHJpZ2dlckF0dGFja1JlbGVhc2UoJ0c0JywgJzRuJywgdGltZSArIDMpO1xuICAgICAgICBfc2VsZi5zeW50aC50cmlnZ2VyQXR0YWNrUmVsZWFzZSgnQmI0JywgJzRuJywgdGltZSArIDMuNSk7XG4gICAgfTtcblxuICAgIFRvbmUuVHJhbnNwb3J0LnNjaGVkdWxlKGxvb3AwLCAwKTtcbiAgICBUb25lLlRyYW5zcG9ydC5sb29wRW5kID0gJzFtJztcbiAgICBUb25lLlRyYW5zcG9ydC5sb29wID0gdHJ1ZTtcblxuICAgIFRvbmUuVHJhbnNwb3J0LnN0YXJ0KCk7XG59O1xuXG5leHBvcnQge1N5bnRoZXNpemVyfTtcbiIsIi8qKlxuICogQW4gYWJzdHJhY3QgY2xhc3MgZm9yIGhhbmRsaW5nIGludGVncmF0aW9uIHdpdGggSFRNTFxuICpcbiAqIEV4dGVybmFsIGRlcGVuZGVuY2llczogalF1ZXJ5XG4gKi9cbmZ1bmN0aW9uIFVJRWxlbWVudCgpIHtcbiAgICB0aGlzLmlzVUlFbGVtZW50ID0gdHJ1ZTtcblxuICAgIHRoaXMualF1ZXJ5T2JqZWN0ID0gbnVsbDtcbn1cblxuLyoqXG4gKiBTZXRzIGNvbnRlbnQgdG8gYSBqUXVlcnkgb2JqZWN0XG4gKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCBhIGpRdWVyeSBvYmplY3RcbiAqL1xuVUlFbGVtZW50LnByb3RvdHlwZS5zZXRDb250ZW50ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIHRoaXMualF1ZXJ5T2JqZWN0ID0gZWxlbWVudDtcbn07XG5cbi8qKlxuICogSW5qZWN0cyBjb250ZW50IGludG8gYSBqUXVlcnkgb2JqZWN0XG4gKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCBqUXVlcnkgb2JqZWN0IHRvIGluamVjdCBjb250ZW50IGludG9cbiAqL1xuVUlFbGVtZW50LnByb3RvdHlwZS5pbmplY3RDb250ZW50ID0gZnVuY3Rpb24oZWxlbWVudCkge1xuICAgIGlmICh0aGlzLmpRdWVyeU9iamVjdCA9PSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOiBDb250ZW50IG5vdCBzZXQhJyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBlbGVtZW50LmFwcGVuZCh0aGlzLmpRdWVyeU9iamVjdCk7XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgdGhlIFVJRWxlbWVudCBmcm9tIHRoZSBkb2N1bWVudFxuICovXG5VSUVsZW1lbnQucHJvdG90eXBlLnJlbW92ZUNvbnRlbnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmpRdWVyeU9iamVjdC5yZW1vdmUoKTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYXNzb2NpYXRlZCBqUXVlcnkgT2JqZWN0XG4gKiBAcmV0dXJuIHtqUXVlcnl9XG4gKi9cblVJRWxlbWVudC5wcm90b3R5cGUuZ2V0Q29udGVudCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLmpRdWVyeU9iamVjdDtcbn07XG5cbmV4cG9ydCB7VUlFbGVtZW50fTtcbiIsImltcG9ydCB7VUlFbGVtZW50fSBmcm9tICcuL1VJRWxlbWVudC5qcyc7XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBvZiBhIG5vZGUgd2l0aGluIGEgcHJvZ3JhbS4gSW5jbHVkZXMgVUkgYW5kIG90aGVyIGZ1bmN0aW9uc1xuICogdG8gaW50ZWdyYXRlIHdpdGggdGhlIHByb2dyYW0gYXMgYSB3aG9sZVxuICovXG5mdW5jdGlvbiBGbG93Tm9kZSgpIHtcbiAgICBVSUVsZW1lbnQuY2FsbCh0aGlzKTtcbiAgICB0aGlzLmlzRmxvd05vZGUgPSB0cnVlO1xuXG4gICAgbGV0IGpxbyA9ICQoJzxkaXY+PC9kaXY+Jyk7XG4gICAganFvLmFkZENsYXNzKCdmbG93bm9kZScpO1xuICAgIGpxby5kcmFnZ2FibGUoKTtcblxuICAgIHRoaXMuc2V0Q29udGVudChqcW8pO1xufVxuRmxvd05vZGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUVsZW1lbnQucHJvdG90eXBlKTtcbkZsb3dOb2RlLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZsb3dOb2RlO1xuXG5leHBvcnQge0Zsb3dOb2RlfTtcbiJdLCJuYW1l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
