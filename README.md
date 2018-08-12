# `vanilla-lightbox` powered by [vanilla.js][0]

🔨 Create simple [lightbox][2] gallery.

## Demo

<http://piecioshka.github.io/vanilla-lightbox.js/demo/>

## Usage

1. In HTML file attach files `src/lightbox.css` and `src/lightbox.js`.
2. In HTML file:

    ```html
    <a href="https://via.placeholder.com/300x400" rel="lightbox">
        <img src="https://via.placeholder.com/150x150/g" alt="example text" />
    </a>
    
    <a href="https://via.placeholder.com/400x300" rel="lightbox">
        <img src="https://via.placeholder.com/150x150/s" alt="example text 2" />
    </a>
    ```

3. Run this JavaScript code, when DOM is ready:

    ```javascript
    new LightBox();
    ```

## Options

#### `rel {string}`

Define this attribute in *item* which should display in lightbox.

#### `prev {string}`

Label of button which display _previous_ image.

#### `next {string}`

Label of button which display _next_ image.

## Support

* Google Chrome
* Mozilla Firefox
* Opera
* Safari
* <del>Internet Explorer</del>

## Acknowledge

[lightbox][2] - light (white) container centered above dark background.

## License

[The MIT License](http://piecioshka.mit-license.org) @ 2013

[0]: https://github.com/piecioshka/vanilla.js
[2]: http://en.wikipedia.org/wiki/Lightbox_(JavaScript)
