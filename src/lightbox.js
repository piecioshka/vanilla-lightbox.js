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

/******************************************************************************/
/* Application code */
/******************************************************************************/

    var doc = document;
    var slice = Array.prototype.slice;

    // List of features are used
    var features = [
        typeof (doc.addEventListener || doc.attachEvent) === 'function',
        typeof doc.querySelectorAll === 'function',
        typeof Array.prototype.forEach === 'function',
        typeof doc.body.getAttribute === 'function',
        typeof doc.body.classList === 'object'
    ];

    /**
     * Checking accessibility of features list
     */
    function checkFeatures() {
        // Check if all of features used in plugin are available
        features.forEach(function (feature) {
            if (!feature) throw new Error('It\'s not compatible client, for Lightbox plugin');
        });
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
     * Simple add event for Node.
     * @param {Node} elm
     * @param {string} action
     * @param {Function} handler
     */
    function addListener(elm, action, handler) {
        if (elm.addEventListener) {
            elm.addEventListener(action, handler, true);
        } else if (elm.attachEvent) {
            elm.attachEvent('on' + action, handler);
        }
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
/* Lightbox */
/******************************************************************************/

    var Lightbox = function (options) {
        // checking used in this code features, if any failed you error throws
        checkFeatures();
        /**
         * @type {Object} base configuration
         */
        this.settings = extend({
            // use attribute to get matching items
            rel: 'lightbox'
        }, options);
        /**
         * @type {Array}
         */
        this.items = [];
        /**
         * Index of current print image
         * @type {null|number}
         */
        this.index = null;

        // flag with state - not active
        this.isActive = false;

        // Run `prototype` initialize method
        this.initialize();

        this.glass = null;
        this.popup = null;
        this.picture = null;
        this.link = null;
    };

    Lightbox.prototype = {
        initialize: function () {
            this.items = slice.apply(matchItems(this.settings.rel));
            this.enable();
        },
        enable: function () {
            var self = this;

            function createPreviousButton() {
                var prevButton = new PreviousButton();
                prevButton.build();
                prevButton.on('click', function () {
                    self.prev();
                });
                return prevButton;
            }

            function createNextButton() {
                var nextButton = new NextButton();
                nextButton.build();
                nextButton.on('click', function () {
                    self.next();
                });
                return nextButton;
            }

            function createCloseButton() {
                var closeButton = new CloseButton();
                closeButton.build();
                closeButton.on('click', closeLightbox);
                return closeButton;
            }

            function closeLightbox() {
                self.glass.remove();
                self.popup.remove();

                // delete memory
                self.glass = null;
                self.popup = null;
                self.picture = null;

                // not active
                self.isActive = false;
            }

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

                // activate
                self.isActive = true;

                // clicked link
                self.link = e.target;

                // fetch first element, after that fetch `src` attribute
                var bigImageSource = self.link.parentNode.getAttribute('href');

                // create
                self.glass = new Glass();
                // build Node & append view
                self.glass.build();
                // listen for `click` to close lightbox
                self.glass.on('click', closeLightbox);

                self.picture = new Picture();
                // build Node & append view
                self.picture.build();
                // get next picture when click
                self.picture.on('click', function () {
                    self.next();
                });

                // create
                self.popup = new Popup();
                // append image
                self.popup.setPicture(self.picture);
                // build Node & append view
                self.popup.build({
                    previousButton: createPreviousButton(),
                    nextButton: createNextButton(),
                    closeButton: createCloseButton()
                });
                // center layer
                self.popup.center();
                // load image
                self.picture.loadImage(bigImageSource, self._loadImageHandler.bind(self));
            }

            // Loop each of `link`.
            this.items.forEach(function (link, number) {
                (function (n) {
                    // Bind custom `click` handler
                    addListener(link, 'click', function (e) {
                        handleClickLink(e, n);
                    });
                }(number));
            });

            // update dimensions
            addListener(win, 'resize', function () {
                if (!self.isActive) return;
                self.glass.onResizeHandler();
                self.popup.center();
            });
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
            // center after load image
            this.popup.center(options.image);
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

    var Popup = function () {
        this.node = null;
        this.picture = null;
        this.label = null;
    };

    Popup.prototype = {
        build: function (options) {
            // apply root layer
            this.node = doc.createElement('section');
            this.node.classList.add(CSS_CLASS_POPUP);
            extend(this.node.style, {
                width: '150px',
                height: '200px'
            });

            // apply picture
            this.node.appendChild(this.picture.node);

            // apply previousButton button
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
        center: function (image) {
            var imgWidth = (image && image.naturalWidth) || 0;
            var imgHeight = (image && image.naturalHeight) || 0;

            var layerRealWidth = this.node.clientWidth;
            var layerRealHeight = this.node.clientHeight;

            var layerWidth = parseInt(this.node.style.width, 10) || 0;
            var layerHeight = parseInt(this.node.style.height, 10) || 0;

            var diffWidth = layerRealWidth - layerWidth;
            var diffHeight = layerRealHeight - layerHeight;

            var labelHeight = this.label.clientHeight;

            var popupWidth = imgWidth || layerWidth;
            var popupHeight = imgHeight ? (imgHeight + labelHeight) : layerHeight;

            var leftPosition = (win.innerWidth - popupWidth - diffWidth) / 2;
            var topPosition = (win.innerHeight - popupHeight - diffHeight) / 2;

            extend(this.node.style, {
                width: popupWidth + 'px',
                height: popupHeight + 'px',
                left: leftPosition + 'px',
                top: topPosition + 'px'
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

    var Button = function () {
        this.node = null;
    };

    Button.prototype = {
        build: function () {
            this.node = doc.createElement(this.tag);
            this.node.classList.add(this['class']);
            this.node.appendChild(doc.createTextNode(this.label));
        },
        on: function (action, handler) {
            addListener(this.node, action, handler);
        }
    };

/******************************************************************************/
/* PreviousButton */
/******************************************************************************/

    var PreviousButton = function () {
        this['class'] = CSS_CLASS_BUTTON_PREVIOUS;
        this.label = PREVIOUS_LABEL;
        this.tag = 'button';
    };

    PreviousButton.prototype = new Button();
    PreviousButton.prototype.constructor = PreviousButton;

/******************************************************************************/
/* NextButton */
/******************************************************************************/

    var NextButton = function () {
        this['class'] = CSS_CLASS_BUTTON_NEXT;
        this.label = NEXT_LABEL;
        this.tag = 'button';
    };

    NextButton.prototype = new Button();
    NextButton.prototype.constructor = NextButton;

/******************************************************************************/
/* CloseButton */
/******************************************************************************/

    var CloseButton = function () {
        this['class'] = CSS_CLASS_BUTTON_CLOSE;
        this.label = CLOSE_LABEL;
        this.tag = 'a';
    };

    CloseButton.prototype = new Button();
    CloseButton.prototype.constructor = CloseButton;

/******************************************************************************/
/* Picture */
/******************************************************************************/

    var Picture = function () {
        this.node = null;
    };

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
            addListener(this.node, action, handler);
        },
        loadImage: function (source, callback) {
            var self = this;
            var img = new Image();

            addListener(img, 'load', function () {
                extend(self.node.style, {
                    width: img.naturalWidth + 'px',
                    height: img.naturalHeight + 'px'
                });
                callback({
                    source: source,
                    image: img
                });
            });

            img.setAttribute('src', source);
        }
    };

/******************************************************************************/
/* Glass */
/******************************************************************************/

    var Glass = function () {
        this.node = null;
    };

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
                addListener(this.node, action, handler);
            },
            remove: function () {
                this.node.parentNode.removeChild(this.node);
            },
            onResizeHandler: function () {
                _setDimensions(this.node);
            }
        };
    }());

    // exports
    win.Lightbox = Lightbox;

}(this));
