/**
 * @author Piotr Kowalski <piecioshka@gmail.com>
 * @fileOverview Plugin for view images in lightbox format.
 *     Use only pure JavaScript, without any dependencies.
 *     Use ECMAScript 5, so its only for modern browser.
 * @see https://github.com/piecioshka/vanilla-lightbox
 */
/*jslint nome: true */
/*global document */
(function (global) {
    'use strict';

    var win = global;
    var doc = document;
    var slice = Array.prototype.slice;

    // DOM `rel` attribute
    var GLASS_CLASS = 'lightbox-glass';

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

    var Lightbox = function (options) {
        /**
         * @type {Object} base configuration
         */
        this.settings = extend({
            // attribute was use to get matching items
            rel: 'lightbox'
        }, options);
        /**
         * @type {Array}
         */
        this.items = [];

        // Run `prototype` initialize method
        this.initialize();
    };

    Lightbox.prototype = {
        initialize: function () {
            this.items = slice.apply(matchItems(this.settings.rel));
            this.enable();
        },
        enable: function () {
            /**
             * Click link contains `img` tag.
             * @param {Event} e
             */
            function handleClickLink(e) {
                // stop propagation and default action
                e.stopPropagation();
                e.preventDefault();

                var glass, popup, bigImageSource;

                var link = e.target;

                // fetch first element, after that fetch `src` attribute
                bigImageSource = e.target.parentNode.getAttribute('href');

                // create
                glass = buildGlass();
                addListener(glass, 'click', function () {
                    // clears
                    removeNodes([popup, glass]);
                });
                // append
                doc.body.appendChild(glass);


                // load image
                loadImage(bigImageSource, function (dimensions) {
                    // create
                    popup = buildPopup(dimensions);
                    // append
                    doc.body.appendChild(popup);
                });
            }

            // Loop each link item.
            this.items.forEach(function (link) {
                // Bind custom `click` handler
                addListener(link, 'click', handleClickLink);
            });
        }
    };

    /**
     * Iterate on each item from list, and delete this item from DOM.
     * @param {Array} list
     */
    function removeNodes(list) {
        slice.apply(list).forEach(function (node) {
            node.parentNode.removeChild(node);
        });
    }

    /**
     * Create DOM representation of glass - half-transparent layer.
     * `Width` are equal document `width` size, `height` parameter too.
     * @returns {HTMLElement}
     */
    function buildGlass() {
        var glass = doc.createElement('section');
        glass.classList.add(GLASS_CLASS);
        extend(glass.style, {
            width: doc.width + 'px',
            height: doc.height + 'px'
        });
        return glass;
    }

    function loadImage(source, callback) {
        console.log('loadImage:', source);
        var img = new Image();
        var anim = requestAnimationFrame(function () {
            console.log('width', img.width, img.naturalWidth);
            console.log('height', img.height, img.naturalHeight);
            console.dir(img);
        });

        addListener(img, 'load', function () {
            webkitCancelRequestAnimationFrame(anim);
            callback({
                source: source,
                width: img.width,
                height: img.height
            });
        });

        img.setAttribute('src', source);
    }

    function buildPopup(options) {
        var popup = doc.createElement('section');
        popup.classList.add('lightbox-popup');
        extend(popup.style, {
            width: options.width + 'px',
            height: options.height + 'px',
            left: ((win.innerWidth - options.width) / 2) + 'px',
            top: ((win.innerHeight - options.height) / 2) + 'px'
        });
        // append image
        popup.appendChild(createImage(options.source));
        return popup;
    }

    function createImage(source) {
        var image = doc.createElement('img');
        image.setAttribute('src', source);
        return image;
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

    // exports
    global.Lightbox = Lightbox;

}(this));
