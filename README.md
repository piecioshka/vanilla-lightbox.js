[vanilla][0]-lightbox
================

Use vanilla.js to create animation gallery - using *lightbox*.

*lightbox* - light container centered above dark background.

Usage
=====

In layout:
```html
<a href="http://bit.ly/16ywGAx" rel="gallery">
    <img src="http://beerhold.it/150/150/g" alt="example text" />
</a>

<a href="http://bit.ly/181xMbP" rel="gallery">
    <img src="http://beerhold.it/150/150/s" alt="example text 2" />
</a>
```

After render html run this code:

```javascript
new LightBox({
    rel: 'gallery'
});
```

Options
=======

- `rel` - define this attribute in *item* which will show child `<img/>` in *lightbox*.

License
=======

[The MIT License][1]

[0]: https://github.com/piecioshka/vanilla.js
[1]: https://github.com/piecioshka/vanilla-lightbox/blob/master/LICENSE
