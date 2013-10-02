[vanilla][0]-lightbox
================

Use [vanilla.js][0] to create animation gallery - using [*lightbox*][2].

[*lightbox*][2] - light container centered above dark background.

Usage
=====

Should attach `css/lightbox.css` file to make it look good.

In html file:
```html
<a href="http://beerhold.it/300/400" rel="gallery">
    <img src="http://beerhold.it/150/150/g" alt="example text" />
</a>

<a href="http://beerhold.it/400/300" rel="gallery">
    <img src="http://beerhold.it/150/150/s" alt="example text 2" />
</a>
```

After render html run this JavaScript code:

```javascript
new LightBox({
    rel: 'gallery' // default: lightbox
});
```

Options
=======

- `rel` - define this attribute in *item* which will show child `<img/>` in *lightbox*.

Support
=======

- Google Chrome
- Mozilla Firefox
- Opera
- Safari
- <del>Internet Explorer</del>

License
=======

[The MIT License][1]

[0]: https://github.com/piecioshka/vanilla.js
[1]: https://github.com/piecioshka/vanilla-lightbox/blob/master/LICENSE
[2]: http://en.wikipedia.org/wiki/Lightbox_(JavaScript)
