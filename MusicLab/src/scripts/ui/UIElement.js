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

export {UIElement};
