# `vanilla-lightbox` powered by [vanilla.js][0]

🔨 Create simple [lightbox][2] gallery.

## Preview 🎉

<https://piecioshka.github.io/vanilla-lightbox.js/demo/>

## Usage

1. In HTML file attach files `src/lightbox.css` and `src/lightbox.js`.
2. In HTML file:

    ```html
    <a href="https://example.com/link-1" rel="lightbox">
        <img src="image-1.jpg" alt="example text" />
    </a>

    <a href="https://example.com/link-2" rel="lightbox">
        <img src="image-2.jpg" alt="example text 2" />
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

[The MIT License](https://piecioshka.mit-license.org) @ 2026
