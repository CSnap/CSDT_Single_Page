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

export {UIElement};
