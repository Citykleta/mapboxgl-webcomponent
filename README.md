# mapboxgl-webcomponent

Use [mapbox-gl]() in a declarative way with web components (no UI framework required)

## Getting started

### Installation

simply run ``npm install --save @citykleta/mb-gl-comp``

Unless you use the [cdn bundle file](), mapbox-gl is not installed and you will have to install it too

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

You can add a loading placeholder element inside the component which will disappear as soon as the map is loaded. Simply put its ``slot`` attribute to ``placeholder``. The default is simply the text ``Loading...``

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

### GeoJSON source

todo

### Style Layers

todo