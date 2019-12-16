[![CircleCI](https://badgen.net/circleci/github/Citykleta/mapboxgl-webcomponent)](https://circleci.com/gh/Citykleta/mapboxgl-webcomponent)

# mapboxgl-webcomponent

Use [mapbox-gl](https://github.com/mapbox/mapbox-gl-js) in a declarative way with web components (no UI framework required)

## Getting started

### Installation

``npm install --save @citykleta/mb-gl-comp``

mapbox-gl is not installed and you will have to install it too

``npm install --save mapbox-gl``

### Basic usage

You need to import the **GeoMap** element class definition and put it into the custom elements registry with the namespace you wish to use.

```html
<body>
<mb-geo-map mb-style="url-to-style" access-token="token_if_required"></mb-geo-map>
<script type="module">
import {GeoMap} from 'path/to/library-file';

customElements.define('mb-geo-map',GeoMap);
</script>
</body>
``` 

#### Configuring the map 

You can pass camera values through attributes. Note that every camera attribute has a corresponding property and property changes will be reflected on the attribute. That will also be the case 
if your map is interactive (the default) and your start scrolling, panning, using keyboard shortcut

For example, if you initially set your component as so
```html
<mb-geo-map id="my-map" mb-style="url-to-style" center="-82.40865,23.12735" zoom="14" pitch="30" bearing="25"></mb-geo-map>
``` 

you can change the zoom in different ways

```javascript
const myMap = document.getElementById(`my-map`);

// by changing the element attribute value
myMap.setAttribute('zoom','12');

//by changing the corresponding property
myApp.zoom =13;
//note in that case the attribute value will automatically change. 

// By scrolling the map (in the same way the attribute value, and the property will be updated) 
```

#### Loading placeholder

You can add a loading placeholder element inside the component which will disappear as soon as the map is loaded. Simply put its ``slot`` attribute to ``placeholder``. The default is the text node ``Loading...``

```html
<!-- For a full screen map  -->
<style>
    body {
        margin: 0;
        padding: 0;
        height: 100vh;
        width: 100vw;
        background: hsl(47, 26%, 88%);
    }
</style>

<body>
    <mb-geo-map mb-style="url-to-style" access-token="token_if_required">
        <div slot="placeholder">Waiting for map to load data !</div>
    </mb-geo-map>
</body>
```

#### Registering event listeners

Map's events are proxied by the element, so you can add event listeners on the map element:

```Javascript
const mapEl = document.querySelector('mb-geo-map');

mapEl.addEventListener('zoom', someListener) // the mapbox zoom event !
```

### GeoJSON source

This will let you define custom dynamic data source

In the same way you need to register the custom element under the desired namespace
```javascript
    const {GeoMap, GeoJSONSource} = CitykletaMbGlComp;
    customElements.define('lr-geo-map', GeoMap);
    customElements.define('lr-geo-json-source', GeoJSONSource);
```

and use it with either a data url or a json object. In both case, do not forget to pass the ``source-id`` attribute

```html
<lr-geo-map>
    <lr-geo-json-source source-id="my-source" data-url="path/to/some_data.geojson"></lr-geo-json-source>
</lr-geo-map>
```

Note that ``data-url`` is dynamic and has a matching property ``dataUrl`` which reflects on the attribute

If you wish to use a JSON object for the source, you need to use the setter programmatically (data can be verbose and you don't want the attribute to be hundred lines long)

```javascript
const someGeoJSONSourceElement = document.querySelector('lr-geo-json-source');

someGeoJSONSourceElement.data = {
    type: 'FeatureCollection',
    features: [{
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [-82, 23]
        }
    }]
};
``` 

### Layers

Most of the layers have a matching custom element and every style property available for the layer type can be set by an attribute or a matching property. You need to set the source for the layer either by nesting it within a source element or by setting the ``source`` attribute.
If you wish to remove/hide the layer, you can remove the element from the DOM tree

Here is an example with two circle layers referencing the same data source:

```html
<lr-geo-map center="-82.40849,23.1327" zoom="14" mb-style="./test/screenshots/data/style.json">
    <lr-geo-json-source source-id="amenity_p"
                        data-url="./test/screenshots/data/amenity_points.geojson">
        <lr-geo-circle-layer layer-id="amenity-points" circle-color="green"
                             circle-radius="3"></lr-geo-circle-layer>
    </lr-geo-json-source>
    <lr-geo-circle-layer circle-stroke-width="2" circle-stroke-color="blue"
                         filter="['==',['get','amenity'],'restaurant']" layer-id="restaurants-points" source="amenity_p"
                         circle-radius="5" circle-color="red"></lr-geo-circle-layer>
</lr-geo-map>
<script src="./node_modules/mapbox-gl/dist/mapbox-gl.js"></script>
<script src="./dist/index.js"></script>
<script>
    const {GeoMap, GeoJSONSource, CircleLayer} = CitykletaMbGlComp;

    customElements.define('lr-geo-map', GeoMap);
    customElements.define('lr-geo-json-source', GeoJSONSource);
    customElements.define('lr-geo-circle-layer', CircleLayer);
</script>
```

In the same way the Map Element proxies mapbox's events, a layer's event can be listened to by adding an event listener on the layer Element

```javascript
const layer = document.querySelector('lr-geo-circle-layer');

layer.addEventListener('click', ev => {
    // a feature on the layer has been clicked !
})
```

You will find more example in the [test section](./test/screenshots)
