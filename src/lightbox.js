/**
 * Plugin for view images in lightbox format.
 * Use only pure JavaScript, without any dependencies.
 * Use ECMAScript 5, so its only for modern browser.
 *
 * @author Piotr Kowalski <piecioshka@gmail.com>
 * @see https://github.com/piecioshka/vanilla-lightbox
 * @license The MIT License
 */
/*jslint indent: 4, nomen: true, plusplus: true, vars: true */
/*global document, Image */
(function (window) {
    'use strict';

    // DOM `rel` attribute
    var CSS_CLASS_GLASS = 'lightbox-glass';
    var CSS_CLASS_PANEL = 'lightbox-panel';
    var CSS_CLASS_BUTTON_PREVIOUS = 'lightbox-previous-button';
    var CSS_CLASS_BUTTON_NEXT = 'lightbox-next-button';
    var CSS_CLASS_BUTTON_CLOSE = 'lightbox-close-button';
    var CSS_CLASS_POPUP = 'lightbox-popup';
    var CSS_CLASS_FIGURE = 'lightbox-figure';
    var CSS_CLASS_LABEL = 'lightbox-caption';

    var DEFAULT_CLASS_OF_IMAGE = 'lightbox';
    var DEFAULT_LABEL_PREV_BUTTON = 'Previous';
    var DEFAULT_LABEL_NEXT_BUTTON = 'Next';

    // Labels of navigation buttons
    var CLOSE_LABEL = '✕'; // ✖ ✗ ✘

    // Message what will be throws with error when someone feature doesn't available
    var NOT_ACCESSIBLE_CLIENT = 'It\'s not compatible client, for using `vanilla-lightbox`';

    var ESCAPE = 27;
    var LEFT_ARROW = 37;
    var RIGHT_ARROW = 39;

    var MAX_WINDOW_WIDTH = 500;

    /**************************************************************************/

    var doc = window.document;
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

    function fetchStyle($element, rule) {
        var value = getComputedStyle($element, null).getPropertyValue(rule);
        var numericValue = parseInt(value, 10);
        if (!isNaN(numericValue)) {
            return numericValue;
        }
        return value;
    }

    /**************************************************************************/

    function createPreviousButton(options, handler) {
        var prevButton = new PreviousButton(options);
        prevButton.build();
        prevButton.on('click', handler);
        return prevButton;
    }

    function createNextButton(options, handler) {
        var nextButton = new NextButton(options);
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

    /**************************************************************************/

    function Lightbox(options) {
        // Checking used in this code features, if any failed you error throws
        checkFeatures();

        this.settings = extend({
            rel: DEFAULT_CLASS_OF_IMAGE,
            prev: DEFAULT_LABEL_PREV_BUTTON,
            next: DEFAULT_LABEL_NEXT_BUTTON
        }, options);

        this.initialize();
    }

    Lightbox.prototype = {
        initialize: function () {
            this.items = slice.apply(matchItems(this.settings.rel));
            this.index = null;
            this.isActive = false;
            this.isCaptureKeyboard = false;
            this._keyhandler = null;

            this.glass = null;
            this.popup = null;
            this.picture = null;

            this.enable();
        },

        keyDownHandler: function (evt) {
            switch (evt.keyCode) {
                case ESCAPE:
                    evt.stopPropagation();
                    evt.preventDefault();
                    return this.disable.call(this);
                case LEFT_ARROW:
                    evt.stopPropagation();
                    evt.preventDefault();
                    return this.prev.call(this);
                case RIGHT_ARROW:
                    evt.stopPropagation();
                    evt.preventDefault();
                    return this.next.call(this);
            }
        },

        enable: function () {
            if (!(this instanceof Lightbox)) {
                throw new Error('incorrect constructor');
            }

            var self = this;

            /**
             * Click link contains `img` tag.
             * @param {Event} evt
             * @param {number} index
             */
            function handleClickLink(evt, index) {
                evt.stopPropagation();
                evt.preventDefault();

                self.index = index;
                self.isActive = true;

                // Fetch first element, after that fetch `src` attribute
                var bigImageSource = evt.target.parentNode.getAttribute('href');

                self.glass = new Glass();
                self.glass.build();
                self.glass.on('click', self.disable.bind(self));

                self.picture = new Picture();
                self.picture.build();
                self.picture.on('click', self.next.bind(self));

                self.panel = new Panel();
                self.panel.build({
                    previousButton: createPreviousButton({ label: self.settings.prev }, self.prev.bind(self)),
                    nextButton: createNextButton({ label: self.settings.next }, self.next.bind(self)),
                    closeButton: createCloseButton(self.disable.bind(self))
                });

                self.popup = new Popup();
                self.popup.setPicture(self.picture);
                self.popup.build();
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
                    link.addEventListener('click', function (evt) {
                        handleClickLink(evt, n);
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
            this.panel.remove();

            // Delete memory
            this.glass = null;
            this.popup = null;
            this.picture = null;

            this.isActive = false;
        },

        _loadImageHandler: function (options) {
            if (!this.isActive) {
                return;
            }
            var currentItem = this.items[this.index];
            var img = currentItem.getElementsByTagName('img')[0];
            this.popup.setLabel(img.getAttribute('alt'));
            this.popup.setDimensions(options.image);
            this.picture.update(options.source);
        },

        prev: function () {
            if (this.index > 0) {
                this.index--;
            } else {
                this.index = this.items.length - 1;
            }
            this.picture.loadImage(this.items[this.index], this._loadImageHandler.bind(this));
        },

        next: function () {
            if (this.index < this.items.length - 1) {
                this.index++;
            } else {
                this.index = 0;
            }
            this.picture.loadImage(this.items[this.index], this._loadImageHandler.bind(this));
        }
    };

    /**************************************************************************/

    function Panel() {
        this.$panel = doc.createElement('div');
    }

    Panel.prototype = {
        build: function (options) {
            this.$panel.classList.add(CSS_CLASS_PANEL);
            this.$panel.appendChild(options.previousButton.$el);
            this.$panel.appendChild(options.nextButton.$el);
            this.$panel.appendChild(options.closeButton.$el);

            doc.body.appendChild(this.$panel);
        },

        remove() {
            this.$panel.parentNode.removeChild(this.$panel);
        }
    };

    /**************************************************************************/

    function Popup() {
        this.$el = null;
        this.picture = null;
        this.label = null;
    }

    Popup.prototype = {
        build: function () {
            this.$el = doc.createElement('div');
            this.$el.classList.add(CSS_CLASS_POPUP);

            this.$el.appendChild(this.picture.$el);
            this.label = doc.createElement('label');
            this.label.classList.add(CSS_CLASS_LABEL);
            this.$el.appendChild(this.label);

            doc.body.appendChild(this.$el);
        },

        setDimensions: function (image) {
            var paddingHorizontal = fetchStyle(this.$el, 'padding-left')
                + fetchStyle(this.$el, 'padding-right');
            var paddingVertical = fetchStyle(this.$el, 'padding-top')
                + fetchStyle(this.$el, 'padding-bottom');

            var imgNaturalWidth = (image && image.naturalWidth) || 0;
            var imgNaturalHeight = (image && image.naturalHeight) || 0;

            var layerWidth = fetchStyle(this.$el, 'width');
            var layerHeight = fetchStyle(this.$el, 'height');
            var labelHeight = this.label.clientHeight;

            var popupWidth = (imgNaturalWidth || layerWidth) + paddingHorizontal;
            var popupHeight = imgNaturalHeight
                ? (imgNaturalHeight + labelHeight) + paddingVertical
                : layerHeight + paddingVertical;

            var windowWidth = fetchStyle(document.body, 'width');

            if (windowWidth < MAX_WINDOW_WIDTH) {
                extend(this.$el.style, {
                    width: '100%'
                });
            } else {
                extend(this.$el.style, {
                    width: popupWidth + 'px',
                    height: popupHeight + 'px'
                });
            }
        },

        setPicture: function (picture) {
            this.picture = picture;
        },

        setLabel: function (label) {
            this.label.innerHTML = label;
        },

        remove: function () {
            this.$el.parentNode.removeChild(this.$el);
        }
    };

    /**************************************************************************/

    function Button() {
        this.$el = null;
    }

    Button.prototype = {
        build: function () {
            this.$el = doc.createElement(this.tag);
            this.$el.classList.add(this.className);
            this.$el.appendChild(doc.createTextNode(this.label));
        },

        on: function (action, handler) {
            this.$el.addEventListener(action, handler, false);
        }
    };

    /**************************************************************************/

    function PreviousButton(options) {
        this.className = CSS_CLASS_BUTTON_PREVIOUS;
        this.label = options.label;
        this.tag = 'button';
    }

    PreviousButton.prototype = new Button();
    PreviousButton.prototype.constructor = PreviousButton;

    /**************************************************************************/

    function NextButton(options) {
        this.className = CSS_CLASS_BUTTON_NEXT;
        this.label = options.label;
        this.tag = 'button';
    }

    NextButton.prototype = new Button();
    NextButton.prototype.constructor = NextButton;

    /**************************************************************************/

    function CloseButton() {
        this.className = CSS_CLASS_BUTTON_CLOSE;
        this.label = CLOSE_LABEL;
        this.tag = 'button';
    }

    CloseButton.prototype = new Button();
    CloseButton.prototype.constructor = CloseButton;

    /**************************************************************************/

    function Picture() {
        this.$el = null;
    }

    Picture.prototype = {
        build: function () {
            this.$el = doc.createElement('img');
            this.$el.classList.add(CSS_CLASS_FIGURE);

            extend(this.$el.style, {
                width: '100%'
            });
        },

        update: function (source) {
            this.$el.setAttribute('src', source);

            var windowWidth = fetchStyle(document.body, 'width');
            var paddingVertical = fetchStyle(this.$el.parentNode, 'padding-top')
                + fetchStyle(this.$el, 'padding-bottom');
            var labelHeight = this.$el.nextSibling.clientHeight;

            if (windowWidth < MAX_WINDOW_WIDTH) {
                var imgHeight = this.$el.height;

                debugger;

                extend(this.$el.parentNode.style, {
                    height: imgHeight + labelHeight + paddingVertical + 'px'
                });
            }
        },

        on: function (action, handler) {
            this.$el.addEventListener(action, handler, false);
        },

        loadImage: function (source, callback) {
            var self = this;
            var image = new Image();
            var windowWidth = fetchStyle(document.body, 'width');

            image.addEventListener('load', function () {

                var imgNaturalWidth = (image && image.naturalWidth) || 0;
                var imgNaturalHeight = (image && image.naturalHeight) || 0;

                if (windowWidth < MAX_WINDOW_WIDTH) {
                    extend(self.$el.style, {
                        width: '100%'
                    });
                } else {
                    extend(self.$el.style, {
                        width: imgNaturalWidth + 'px',
                        height: imgNaturalHeight + 'px'
                    });
                }

                callback({
                    source: source,
                    image: image
                });
            }, false);

            image.setAttribute('src', source);
        }
    };

    /**************************************************************************/

    // Half-transparent layer
    function Glass() {
        this.$el = null;
    }

    Glass.prototype = {
        build: function () {
            this.$el = doc.createElement('div');
            this.$el.classList.add(CSS_CLASS_GLASS);
            doc.body.appendChild(this.$el);
        },

        on: function (action, handler) {
            this.$el.addEventListener(action, handler, false);
        },

        remove: function () {
            this.$el.parentNode.removeChild(this.$el);
        }
    };

    // Exports
    window.Lightbox = Lightbox;

}(this));
