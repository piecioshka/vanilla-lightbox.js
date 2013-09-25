[vanilla][0]-lightbox
================

Use vanilla.js to create animation gallery - using *lightbox*.<br />
*lightbox* - light container centered above dark background.

Usage
=====

```html
<a href="http://bit.ly/16ywGAx" rel="gallery">
    <img src="http://beerhold.it/150/150/g" alt="example text" />
</a>

<a href="http://bit.ly/181xMbP" rel="gallery">
    <img src="http://beerhold.it/150/150/s" alt="example text 2" />
</a>
```

```javascript
new LightBox({
    rel: 'gallery'
});
```

Options
=======

- `rel` - attribute `rel` define item used in plugin

License
=======

[The MIT License][1]

[0]: https://github.com/piecioshka/vanilla.js
[1]: https://github.com/piecioshka/vanilla-lightbox/blob/master/LICENSE
