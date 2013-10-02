/**
 * @author Piotr Kowalski <piecioshka@gmail.com>
 * @fileOverview Plugin for view images in lightbox format.
 *     Use only pure JavaScript, without any dependencies.
 *     Use ECMAScript 5, so its only for modern browser.
 * @see https://github.com/piecioshka/vanilla-lightbox
 * @license The MIT License
 */
/*jslint indent: 4, nomen: true, plusplus: true, vars: true */
/*global document, Image */
(function (win) {
    'use strict';

    // DOM `rel` attribute
    var CSS_CLASS_GLASS = 'lightbox-glass';
    var CSS_CLASS_POPUP = 'lightbox-popup';
    var CSS_CLASS_FIGURE = 'lightbox-figure';
    var CSS_CLASS_LABEL = 'lightbox-caption';
    var CSS_CLASS_BUTTON_PREVIOUS = 'lightbox-previous-button';
    var CSS_CLASS_BUTTON_NEXT = 'lightbox-next-button';
    var CSS_CLASS_BUTTON_CLOSE = 'lightbox-close-button';

    // Labels of navigation buttons
    var PREVIOUS_LABEL = "Prev";
    var NEXT_LABEL = "Next";
    var CLOSE_LABEL = "✕"; // ✖ ✗ ✘

    // message what will be throws with error when someone feature doesn't available
    var NOT_ACCESSIBLE_CLIENT = 'It\'s not compatible client, for using `vanilla-lightbox`';

/******************************************************************************/
/* Application code */
/******************************************************************************/

    var doc = document;
    var slice = Array.prototype.slice;

    // List of features are used
    var features = [
        typeof doc.addEventListener === 'function',
        typeof doc.querySelectorAll === 'function',
        typeof Array.prototype.forEach === 'function',
        typeof doc.body.getAttribute === 'function',
        typeof doc.body.classList === 'object'
    ];

    /**
     * Checking accessibility of features list
     */
    function checkFeatures() {
        var i;
        var len = features.length;
        for (i = 0; i < len; ++i) {
            if (!features[i]) {
                throw new Error(NOT_ACCESSIBLE_CLIENT);
            }
        }
    }

    /**
     * Get list of items which `rel=*`.
     * @param {string} rel Searching item due to rel equal that value.
     * @returns {NodeList}
     */
    function matchItems(rel) {
        return doc.querySelectorAll('[rel=' + rel + ']');
    }

    /**
     * Mixin base and custom object.
     * @param {Object} base
     * @param {Object} custom
     * @returns {Object} Merge base with customs.
     */
    function extend(base, custom) {
        var i;
        for (i in custom) {
            if (custom.hasOwnProperty(i)) {
                base[i] = custom[i];
            }
        }
        return base;
    }

/******************************************************************************/
/* Helpers */
/******************************************************************************/

    function createPreviousButton(handler) {
        var prevButton = new PreviousButton();
        prevButton.build();
        prevButton.on('click', handler);
        return prevButton;
    }

    function createNextButton(handler) {
        var nextButton = new NextButton();
        nextButton.build();
        nextButton.on('click', handler);
        return nextButton;
    }

    function createCloseButton(handler) {
        var closeButton = new CloseButton();
        closeButton.build();
        closeButton.on('click', handler);
        return closeButton;
    }

/******************************************************************************/
/* Lightbox */
/******************************************************************************/

    function Lightbox(options) {
        // checking used in this code features, if any failed you error throws
        checkFeatures();
        /**
         * @type {Object} base configuration
         */
        this.settings = extend({
            // use attribute to get matching items
            rel: 'lightbox'
        }, options);

        // Run `prototype` initialize method
        this.initialize();
    }

    Lightbox.prototype = {
        initialize: function () {
            // @type {Array}
            this.items = slice.apply(matchItems(this.settings.rel));

            // @type {?number} Index of current presented picture
            this.index = null;

            // @type {boolean} flag with state on visible (default: not active)
            this.isActive = false;

            // @type {boolean} status of sets custom key handler
            this.isCaptureKeyboard = false;

            // @type {Glass}
            this.glass = null;

            // @type {Popup}
            this.popup = null;

            // @type {Picture}
            this.picture = null;

            // @type {?Function}
            this._keyhandler = null;

            this.enable();
        },
        keyDownHandler: function (e) {
            var key = e.keyCode;

            // right arrow
            if (key === 39) {
                this.next.call(this);
            } else

            // left arrow
            if (key === 37) {
                this.prev.call(this);
            } else

            // escape
            if (key === 27) {
                this.disable();
            }

            // stop
            e.preventDefault();
            e.stopPropagation();
        },
        enable: function () {
            if (!(this instanceof Lightbox)) {
                throw new Error('incorrect constructor');
            }

            var self = this;

            /**
             * Click link contains `img` tag.
             * @param {Event} e
             * @param {number} index
             */
            function handleClickLink(e, index) {
                // stop propagation and default action
                e.stopPropagation();
                e.preventDefault();

                // set current index
                self.index = index;

                // activate lightbox
                self.isActive = true;

                // fetch first element, after that fetch `src` attribute
                var bigImageSource = e.target.parentNode.getAttribute('href');

                // create
                self.glass = new Glass();
                // build Node & append view
                self.glass.build();
                // listen for `click` to close lightbox
                self.glass.on('click', self.disable.bind(self));

                self.picture = new Picture();
                // build Node & append view
                self.picture.build();
                // get next picture when click
                self.picture.on('click', self.next.bind(self));

                // create
                self.popup = new Popup();
                // append image
                self.popup.setPicture(self.picture);
                // build Node & append view
                self.popup.build({
                    previousButton: createPreviousButton(self.prev.bind(self)),
                    nextButton: createNextButton(self.next.bind(self)),
                    closeButton: createCloseButton(self.disable.bind(self))
                });
                // load image
                self.picture.loadImage(bigImageSource, self._loadImageHandler.bind(self));

                if (!self.isCaptureKeyboard) {
                    self._keyhandler = self.keyDownHandler.bind(self);
                    doc.addEventListener('keydown', self._keyhandler, false);
                    self.isCaptureKeyboard = true;
                }
            }

            // Loop each of `link`.
            this.items.forEach(function (link, number) {
                (function (n) {
                    // Bind custom `click` handler.
                    link.addEventListener('click', function (e) {
                        handleClickLink(e, n);
                    }, false);
                }(number));
            });
        },
        disable: function () {
            if (!(this instanceof Lightbox)) {
                throw new Error('incorrect constructor');
            }

            if (this.isCaptureKeyboard) {
                doc.removeEventListener('keydown', this._keyhandler, false);
                this.isCaptureKeyboard = false;
            }

            if (!this.isActive) return;

            this.glass.remove();
            this.popup.remove();

            // delete memory
            this.glass = null;
            this.popup = null;
            this.picture = null;

            // not active
            this.isActive = false;
        },
        _loadImageHandler: function (options) {
            // if not active do nothing, otherwise load set picture
            if (!this.isActive) return;
            // fetch current item
            var currentItem = this.items[this.index];
            // fetch `img` as child
            var img = currentItem.getElementsByTagName('img')[0];
            // set label
            this.popup.setLabel(img.getAttribute('alt'));
            // set popup real dimensions after load image
            this.popup.setDimensions(options.image);
            // update source for picture
            this.picture.update(options.source);
        },
        prev: function () {
            if (this.index > 0) {
                // previous item
                this.index--;
            } else {
                // loop, switch to last element
                this.index = this.items.length - 1;
            }
            this.picture.loadImage(this.items[this.index], this._loadImageHandler.bind(this));
        },
        next: function () {
            if (this.index < this.items.length - 1) {
                // next item
                this.index++;
            } else {
                // loop, switch to first element
                this.index = 0;
            }
            this.picture.loadImage(this.items[this.index], this._loadImageHandler.bind(this));
        }
    };

/******************************************************************************/
/* Popup */
/******************************************************************************/

    function Popup() {
        this.node = null;
        this.picture = null;
        this.label = null;
    }

    Popup.prototype = {
        build: function (options) {
            // apply root layer
            this.node = doc.createElement('section');
            this.node.classList.add(CSS_CLASS_POPUP);

            // apply picture
            this.node.appendChild(this.picture.node);

            // apply previous button
            this.node.appendChild(options.previousButton.node);

            // apply next button
            this.node.appendChild(options.nextButton.node);

            // apply close button
            this.node.appendChild(options.closeButton.node);

            // apply description
            this.label = doc.createElement('label');
            this.label.classList.add(CSS_CLASS_LABEL);
            this.node.appendChild(this.label);

            // apply
            doc.body.appendChild(this.node);
        },
        setDimensions: function (image) {
            var imgWidth = (image && image.naturalWidth) || 0;
            var imgHeight = (image && image.naturalHeight) || 0;

            var layerWidth = parseInt(this.node.style.width, 10) || 0;
            var layerHeight = parseInt(this.node.style.height, 10) || 0;

            var labelHeight = this.label.clientHeight;

            var popupWidth = imgWidth || layerWidth;
            var popupHeight = imgHeight ? (imgHeight + labelHeight) : layerHeight;

            extend(this.node.style, {
                width: popupWidth + 'px',
                height: popupHeight + 'px'
            });
        },
        setPicture: function (picture) {
            this.picture = picture;
        },
        setLabel: function (label) {
            this.label.innerHTML = label;
        },
        remove: function () {
            this.node.parentNode.removeChild(this.node);
        }
    };

/******************************************************************************/
/* Button */
/******************************************************************************/

    function Button() {
        this.node = null;
    }

    Button.prototype = {
        build: function () {
            this.node = doc.createElement(this.tag);
            this.node.classList.add(this['class']);
            this.node.appendChild(doc.createTextNode(this.label));
        },
        on: function (action, handler) {
            this.node.addEventListener(action, handler, false);
        }
    };

/******************************************************************************/
/* PreviousButton */
/******************************************************************************/

    function PreviousButton() {
        this['class'] = CSS_CLASS_BUTTON_PREVIOUS;
        this.label = PREVIOUS_LABEL;
        this.tag = 'button';
    }

    PreviousButton.prototype = new Button();
    PreviousButton.prototype.constructor = PreviousButton;

/******************************************************************************/
/* NextButton */
/******************************************************************************/

    function NextButton() {
        this['class'] = CSS_CLASS_BUTTON_NEXT;
        this.label = NEXT_LABEL;
        this.tag = 'button';
    }

    NextButton.prototype = new Button();
    NextButton.prototype.constructor = NextButton;

/******************************************************************************/
/* CloseButton */
/******************************************************************************/

    function CloseButton() {
        this['class'] = CSS_CLASS_BUTTON_CLOSE;
        this.label = CLOSE_LABEL;
        this.tag = 'a';
    }

    CloseButton.prototype = new Button();
    CloseButton.prototype.constructor = CloseButton;

/******************************************************************************/
/* Picture */
/******************************************************************************/

    function Picture() {
        this.node = null;
    }

    Picture.prototype = {
        build: function () {
            this.node = doc.createElement('img');
            this.node.classList.add(CSS_CLASS_FIGURE);
            extend(this.node.style, { width: '100%', height: '100%' });
        },
        update: function (source) {
            this.node.setAttribute('src', source);
        },
        on: function (action, handler) {
            this.node.addEventListener(action, handler, false);
        },
        loadImage: function (source, callback) {
            var self = this;
            var img = new Image();
            img.addEventListener('load', function () {
                extend(self.node.style, {
                    width: img.naturalWidth + 'px',
                    height: img.naturalHeight + 'px'
                });
                callback({
                    source: source,
                    image: img
                });
            }, false);
            img.setAttribute('src', source);
        }
    };

/******************************************************************************/
/* Glass */
/******************************************************************************/

    function Glass() {
        this.node = null;
    }

    Glass.prototype = (function () {
        /**
         * Set layer dimensions form window dimensions.
         * @private
         */
        function _setDimensions(node) {
            extend(node.style, {
                width: win.innerWidth + 'px',
                height: win.innerHeight + 'px'
            });
        }

        return {
            /**
             * Create DOM representation of glass - half-transparent layer.
             * `Width` are equal document `width` size, `height` parameter too.
             */
            build: function () {
                this.node = doc.createElement('section');
                this.node.classList.add(CSS_CLASS_GLASS);
                _setDimensions(this.node);
                // apply
                doc.body.appendChild(this.node);
            },
            on: function (action, handler) {
                this.node.addEventListener(action, handler, false);
            },
            remove: function () {
                this.node.parentNode.removeChild(this.node);
            }
        };
    }());

    // exports
    win.Lightbox = Lightbox;

}(this));
