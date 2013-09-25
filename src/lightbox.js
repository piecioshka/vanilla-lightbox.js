/**
 * @author Piotr Kowalski <piecioshka@gmail.com>
 * @fileOverview Plugin for view images in lightbox format.
 *     Use only pure JavaScript, without any dependencies.
 *     Use ECMAScript 5, so its only for modern browser.
 * @see https://github.com/piecioshka/vanilla-lightbox
 */
/*jslint nome: true */
/*global document */
(function (win) {
    'use strict';

    var doc = document;
    var slice = Array.prototype.slice;

    // DOM `rel` attribute
    var CSS_CLASS_GLASS = 'lightbox-glass';
    var CSS_CLASS_POPUP = 'lightbox-popup';
    var CSS_CLASS_FIGURE = 'lightbox-figure';
    var CSS_CLASS_LABEL = 'lightbox-caption';

    // List of features are used
    var features = [
        typeof (doc.addEventListener || doc.attachEvent) === 'function',
        typeof doc.querySelectorAll === 'function',
        typeof Array.prototype.forEach === 'function'
    ];
    // Check if all of features used in plugin are available
    features.forEach(function (feature) {
        if (!feature) throw new Error('It\'s not compatible client, for Lightbox plugin');
    });

/******************************************************************************/
/* Lightbox */
/******************************************************************************/

    var Lightbox = function (options) {
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

        // Run `prototype` initialize method
        this.initialize();
        // flag with state - not active
        this.isActive = false;
    };

    Lightbox.prototype = {
        initialize: function () {
            this.items = slice.apply(matchItems(this.settings.rel));
            this.enable();
        },
        enable: function () {
            var self = this, glass, popup, picture, link;

            /**
             * Click link contains `img` tag.
             * @param {Event} e
             */
            function handleClickLink(e) {
                // stop propagation and default action
                e.stopPropagation();
                e.preventDefault();

                // activate
                self.isActive = true;

                link = e.target;

                // fetch first element, after that fetch `src` attribute
                var bigImageSource = link.parentNode.getAttribute('href');

                // create
                glass = new Glass();
                glass.build();
                glass.on('click', function () {
                    glass.remove();
                    popup.remove();

                    // delete memory
                    glass = null;
                    popup = null;
                    picture = null;

                    // not active
                    self.isActive = false;
                });

                picture = new Picture();
                // build Node & append view
                picture.build();

                // create
                popup = new Popup();
                // append image
                popup.setPicture(picture);
                // build Node & append view
                popup.build();
                // center layer
                popup.center();
                // load image
                picture.loadImage(bigImageSource, loadImageHandler);
            }

            function loadImageHandler(options) {
                // if not active do nothing, otherwise load set picture
                if (!self.isActive) return;
                // set label
                popup.setLabel(link.getAttribute('alt'));
                // center after load image
                popup.center(options.image);
                // update source for picture
                picture.update(options.source);
            }

            // Loop each of `link`.
            this.items.forEach(function (link) {
                // Bind custom `click` handler
                addListener(link, 'click', handleClickLink);
            });

            // update dimensions
            addListener(win, 'resize', function () {
                if (!self.isActive) return;
                glass.onResize();
                popup.center();
            });
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
        build: function () {
            // apply root layer
            this.node = doc.createElement('section');
            this.node.classList.add(CSS_CLASS_POPUP);
            extend(this.node.style, {
                width: '150px',
                height: '200px'
            });

            // apply picture
            this.node.appendChild(this.picture.node);

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

            var popupWidth = imgWidth ? imgWidth : layerWidth;
            var popupHeight = imgHeight ? (imgHeight + labelHeight): layerHeight;

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
         * Check what dimensions: window or document are biggest and apply.
         * @private
         */
        function _setBiggerDimensions() {
            var body = doc.body;
            extend(this.node.style, {
                width: Math.max(body.clientWidth, win.innerWidth) + 'px',
                height: Math.max(body.clientHeight, win.innerHeight) + 'px'
            });
        }

        /**
         * Set layer dimensions form window dimensions.
         * @private
         */
        function _setDimensions() {
            extend(this.node.style, {
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
                _setDimensions.call(this);
                doc.body.appendChild(this.node);
            },
            on: function (action, handler) {
                addListener(this.node, action, handler);
            },
            remove: function () {
                this.node.parentNode.removeChild(this.node);
            },
            onResize: function () {
                _setDimensions.call(this);
            }
        }
    }());

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

    // exports
    win.Lightbox = Lightbox;

}(this));
