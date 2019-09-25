import mapbox from 'mapbox-gl';

const template = document.createElement('template');
template.innerHTML = `<style>
:host(){
    position: relative;
}
#map-container{
    width:100%;
    height:100%;
}

slot[name=placeholder]{
    position: absolute;
    display:flex;
    align-items:center;
    justify-content:center;
    width:100%;
    height:100%;
    z-index:3;
}
</style>
<slot name="placeholder">Loading...</slot>
<div id="map-container"></div>
<slot name="sources"></slot>
<slot name="layers"></slot>
`;

class GeoMap extends HTMLElement {

    static get observedAttributes() {
        return ['zoom', 'center', 'bearing', 'pitch'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this._map !== null) {
            switch (name) {
                case 'zoom': {
                    if (Number(newValue) !== this._map.getZoom()) {
                        this._map.setZoom(Number(newValue));
                    }
                    break;
                }
                case 'center': {
                    if (newValue !== this._map.getCenter().toArray().join()) {
                        this._map.setCenter(newValue.split(',').map(Number));
                    }
                    break;
                }
                case 'bearing': {
                    if (Number(newValue) !== this._map.getBearing()) {
                        this._map.setBearing(Number(newValue));
                    }
                    break;
                }
                case 'pitch': {
                    if (Number(newValue) !== this._map.getPitch()) {
                        this._map.setPitch(Number(newValue));
                    }
                    break;
                }
            }
        }
    }

    constructor() {
        super();
        this._isLoading = true;
        this._map = null;
        this._sources = [];
        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    get center() {
        return this.hasAttribute('center') ?
            this.getAttribute('center')
                .split(',')
                .map(Number) :
            [0, 0];
    }

    set center(value) {
        this.setAttribute('center', value.join());
    }

    get bearing() {
        return this.hasAttribute('bearing') ?
            Number(this.getAttribute('bearing')) :
            0;
    }

    set bearing(value) {
        this.setAttribute('bearing', String(Math.round(+value * 100) / 100));
    }

    get pitch() {
        return this.hasAttribute('pitch') ?
            Number(this.getAttribute('pitch')) :
            0;
    }

    set pitch(value) {
        this.setAttribute('pitch', String(Math.round(+value * 100) / 100));
    }

    get zoom() {
        return this.hasAttribute('zoom') ?
            Number(this.getAttribute('zoom')) :
            0;
    }

    set zoom(value) {
        this.setAttribute('zoom', String(Math.round(+value * 100) / 100));
    }

    get mbStyle() {
        return this.getAttribute('mb-style');
    }

    connectedCallback() {
        const container = this.shadowRoot.getElementById('map-container');
        const options = {
            container,
            // style: this.mbStyle,
            center: this.center,
            zoom: this.zoom,
            bearing: this.bearing,
            pitch: this.pitch
        };

        if (this.mbStyle) {
            options.style = this.mbStyle;
        }

        const map = this._map = new mapbox.Map(options);

        map.on('load', ev => {
            this.shadowRoot.querySelector('slot[name=placeholder]').remove();
            this._isLoading = false;

            // for next ones
            this.shadowRoot.querySelector('slot[name="sources"]').addEventListener('slotchange', this._handleSourceChange.bind(this));
            this.shadowRoot.querySelector('slot[name="layers"]').addEventListener('slotchange', this._handleLayerChange.bind(this));

            // already there
            this._handleSourceChange();
            this._handleLayerChange();
        });

        map.on('zoomend', ev => {
            this.zoom = map.getZoom();
        });

        map.on('moveend', ev => {
            this.center = map.getCenter().toArray();
        });

        map.on('ratateend', ev => {
            this.bearing = map.getBearing();
        });

        map.on('pitchend', ev => {
            this.pitch = map.getPitch();
        });
    }

    _handleSourceChange() {
        const sources = this.shadowRoot
            .querySelector('slot[name=sources]')
            .assignedNodes()
            .filter(el => el.hasAttribute('source-id'));

        for (const source of sources) {
            source.map = this._map;
        }
    }

    _handleLayerChange() {
        const sources = this.shadowRoot
            .querySelector('slot[name=layers]')
            .assignedNodes()
            .filter(el => el.hasAttribute('source') && el.hasAttribute('layer-id'));
        for (const source of sources) {
            source.map = this._map;
        }
    }
}

const EMPTY_GEOJSON_SOURCE_DATA = Object.freeze({
    type: 'FeatureCollection',
    features: []
});

class GeoJSONSource extends HTMLElement {

    static get observedAttributes() {
        return ['data-url'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this._map) {
            if (name === 'data-url' && oldValue !== newValue) {
                this._map.getSource(this.sourceId).setData(newValue);
            }
        }
    }

    set map(value) {
        if (value !== this._map) {
            this._map = value;
            this._map.addSource(this.sourceId, {
                type: 'geojson',
                data: this.dataUrl ? this.dataUrl : this.data
            });
        }
    }

    get data() {
        return Object.assign({}, this._data);
    }

    set data(value) {
        this._data = value;
        if (this._map) {
            this._map.getSource(this.sourceId).setData(value);
        }
    }

    get dataUrl() {
        return this.getAttribute('data-url');
    }

    set dataUrl(value) {
        this.setAttribute('data-url', value);
    }

    get sourceId() {
        return this.getAttribute('source-id');
    }

    constructor() {
        super();
        this._data = EMPTY_GEOJSON_SOURCE_DATA;
    }

    connectedCallback() {
        this.setAttribute('slot', 'sources');
    }
}

const expressionTest = /^\d|^\[|^true|^false/;

const parse = string => {
    if (expressionTest.test(string)) {
        return JSON.parse(string.replace(/'/g, '"'));
    }

    //normal string
    return string;
};

const stringify = val => typeof val === 'string' ? val : JSON
    .stringify(val)
    .replace(/"/g, '\'');

const instanceToLayerProperties = instance => (acc, prop) => {
    if ((prop.defaultValue !== void 0) || (instance[kebabToCamel(prop.name)] !== null)) {
        acc[prop.name] = instance[kebabToCamel(prop.name)];
    }
    return acc;
};

const kebabToCamel = prop => prop
    .split('-')
    .map((word, index) => {
        if (index === 0)
            return word;

        const [first, ...rest] = word;

        return first.toUpperCase() + rest.join('');
    })
    .join('');

const layerFactory = (layoutProperties, paintProperties, layerType) => {

    const klass = class extends HTMLElement {
        static get observedAttributes() {
            return [...paintProperties, ...layoutProperties]
                .map(({name}) => name);
        }

        get filter() {
            return parse(this.getAttribute('filter'));
        }

        set filter(value) {
            this.setAttribute('filter', stringify(value));
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (this._map) {
                if (paintProperties.some(p => p.name === name)) {
                    this._map.setPaintProperty(this.layerId, name, parse(newValue));
                } else if (layoutProperties.some(p => p.name === name)) {
                    this._map.setLayoutProperty(this.layerId, name, parse(newValue));
                }
            }
        }

        set map(value) {
            if (value !== this._map) {
                this._map = value;
                const setProps = instanceToLayerProperties(this);
                const paint = paintProperties.reduce(setProps, {});
                const layout = layoutProperties.reduce(setProps, {});
                const spec = {
                    type: layerType,
                    id: this.layerId,
                    paint,
                    layout
                };

                if (this.source) {
                    spec.source = this.source;
                }

                if (this.sourceLayer) {
                    spec['source-layer'] = this.sourceLayer;
                }

                if (this.filter) {
                    spec.filter = this.filter;
                }

                this._map.addLayer(spec);
            }
        }

        get layerId() {
            return this.getAttribute('layer-id');
        }

        get source() {
            return this.getAttribute('source');
        }

        get sourceLayer() {
            return this.getAttribute('source-layer');
        }

        constructor() {
            super();
        }

        connectedCallback() {
            this.setAttribute('slot', 'layers');
        }

        disconnectedCallback() {
            if (this._map) {
                this._map.removeLayer(this.layerId);
            }
        }
    };

    for (const p of [...layoutProperties, ...paintProperties]) {
        Object.defineProperty(klass.prototype, kebabToCamel(p.name), {
            enumarable: true,
            get() {
                const attributeValue = parse(this.getAttribute(p.name));
                return p.defaultValue !== void 0 ? (
                        this.hasAttribute(p.name) ? attributeValue :
                            p.defaultValue) :
                    attributeValue;
            },
            set(value) {
                this.setAttribute(p.name, stringify(value));
            }
        });
    }

    return klass;
};

const LAYOUT_PROPERTIES = [
    {name: 'circle-sort-key'},
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES = [
    {name: 'circle-color', defaultValue: '#000000'},
    {name: 'circle-radius', defaultValue: 5},
    {name: 'circle-stroke-width', defaultValue: 0},
    {name: 'circle-stroke-color', defaultValue: '#000000'},
    {name: 'circle-opacity', defaultValue: 1},
    {name: 'circle-blur', defaultValue: 0},
    {name: 'circle-translate', defaultValue: [0, 0]},
    {name: 'circle-translate-anchor', defaultValue: 'map'},
    {name: 'circle-pitch-scale', defaultValue: 'map'},
    {name: 'circle-pitch-alignment', defaultValue: 'viewport'}
];


const CircleLayer = layerFactory(LAYOUT_PROPERTIES, PAINT_PROPERTIES, 'circle');

const LAYOUT_PROPERTIES$1 = [
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES$1 = [
    {name: 'background-color', defaultValue: '#000000'},
    {name: 'background-pattern'},
    {name: 'background-opacity', defaultValue: 1}
];

const BackgroundLayer = layerFactory(LAYOUT_PROPERTIES$1, PAINT_PROPERTIES$1, 'background');

const LAYOUT_PROPERTIES$2 = [
    {name: 'fill-sort-key'},
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES$2 = [
    {name: 'fill-antialias', defaultValue: true},
    {name: 'fill-opacity', defaultValue: 1},
    {name: 'fill-color', defaultValue: '#000000'},
    {name: 'fill-outline-color'},
    {name: 'fill-translate', defaultValue: [0, 0]},
    {name: 'fill-translate-anchor', defaultValue: 'map'},
    {name: 'fill-pattern'}
];

const FillLayer = layerFactory(LAYOUT_PROPERTIES$2, PAINT_PROPERTIES$2, 'fill');

const LAYOUT_PROPERTIES$3 = [
    {name: 'line-cap', defaultValue: 'butt'},
    {name: 'line-join', defaultValue: 'miter'},
    {name: 'line-miter-limit', defaultValue: 2},
    {name: 'line-round-limit', defaultValue: 1.05},
    {name: 'line-sort-key'},
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES$3 = [
    {name: 'line-opacity', defaultValue: 1},
    {name: 'line-color', defaultValue: '#000000'},
    {name: 'line-translate', defaultValue: [0, 0]},
    {name: 'line-translate-anchor', defaultValue: 'map'},
    {name: 'line-width', defaultValue: 1},
    {name: 'line-gap-width', defaultValue: 0},
    {name: 'line-offset', defaultValue: 0},
    {name: 'line-blur', defaultValue: 0},
    {name: 'line-dasharray'},
    {name: 'line-pattern'},
    {name: 'line-gradient'}
];

const LineLayer = layerFactory(LAYOUT_PROPERTIES$3, PAINT_PROPERTIES$3, 'line');

const LAYOUT_PROPERTIES$4 = [
    {name: 'symbol-placement', defaultValue: 'point'},
    {name: 'symbol-spacing', defaultValue: 250},
    {name: 'symbol-avoid-edges', defaultValue: false},
    {name: 'symbol-sort-key'},
    {name: 'symbol-z-order', defaultValue: 'auto'},
    {name: 'icon-allow-overlap', defaultValue: false},
    {name: 'icon-ignore-placement', defaultValue: false},
    {name: 'icon-optional', defaultValue: false},
    {name: 'icon-rotation-alignment', defaultValue: 'auto'},
    {name: 'icon-size', defaultValue: 1},
    {name: 'icon-text-fit', defaultValue: 'none'},
    {name: 'icon-text-fit-padding', defaultValue: [0, 0, 0, 0]},
    {name: 'icon-image'},
    {name: 'icon-rotate', defaultValue: 0},
    {name: 'icon-padding', defaultValue: 2},
    {name: 'icon-keep-upright', defaultValue: false},
    {name: 'icon-offset', defaultValue: [0, 0]},
    {name: 'icon-anchor', defaultValue: 'center'},
    {name: 'icon-pitch-alignment', defaultValue: 'auto'},
    {name: 'text-pitch-alignment', defaultValue: 'auto'},
    {name: 'text-rotation-alignment', defaultValue: 'auto'},
    {name: 'text-field', defaultValue: ''},
    {name: 'text-font', defaultValue: ['Open Sans Regular', 'Arial Unicode MS Regular']},
    {name: 'text-size', defaultValue: 16},
    {name: 'text-max-width', defaultValue: 10},
    {name: 'text-line-height', defaultValue: 1.2},
    {name: 'text-letter-spacing', defaultValue: 0},
    {name: 'text-justify', defaultValue: 'center'},
    {name: 'text-radial-offset', defaultValue: 0},
    {name: 'text-variable-anchor'},
    {name: 'text-anchor', defaultValue: 'center'},
    {name: 'text-max-angle', defaultValue: 45},
    {name: 'text-writing-mode'},
    {name: 'text-rotate', defaultValue: 0},
    {name: 'text-padding', defaultValue: 2},
    {name: 'text-keep-upright', defaultValue: true},
    {name: 'text-transform', defaultValue: 'none'},
    {name: 'text-offset', defaultValue: [0, 0]},
    {name: 'text-allow-overlap', defaultValue: false},
    {name: 'text-ignore-placement', defaultValue: false},
    {name: 'text-optional', defaultValue: false},
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES$4 = [
    {name: 'icon-opacity', defaultValue: 1},
    {name: 'icon-color', defaultValue: '#000000'},
    {name: 'icon-halo-color', defaultValue: 'rgba(0,0,0,0)'},
    {name: 'icon-halo-width', defaultValue: 0},
    {name: 'icon-halo-blur', defaultValue: 0},
    {name: 'icon-translate', defaultValue: [0, 0]},
    {name: 'icon-translate-anchor', defaultValue: 'map'},
    {name: 'text-opacity', defaultValue: 1},
    {name: 'text-color', defaultValue: '#000000'},
    {name: 'text-halo-color', defaultValue: 'rgba(0,0,0,0)'},
    {name: 'text-halo-width', defaultValue: 0},
    {name: 'text-halo-blur', defaultValue: 0},
    {name: 'text-translate', defaultValue: [0, 0]},
    {name: 'text-translate-anchor', defaultValue: 'map'}
];

const SymbolLayer = layerFactory(LAYOUT_PROPERTIES$4, PAINT_PROPERTIES$4, 'symbol');

const LAYOUT_PROPERTIES$5 = [
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES$5 = [
    {name: 'raster-opacity', defaultValue: 1},
    {name: 'raster-hue-rotate', defaultValue: 0},
    {name: 'raster-brightness-min', defaultValue: 0},
    {name: 'raster-brightness-max', defaultValue: 1},
    {name: 'raster-saturation', defaultValue: 0},
    {name: 'raster-resampling', defaultValue: 'linear'},
    {name: 'raster-fade-duration', defaultValue: 300}
];

const RasterLayer = layerFactory(LAYOUT_PROPERTIES$5, PAINT_PROPERTIES$5, 'raster');

const LAYOUT_PROPERTIES$6 = [
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES$6 = [
    {name: 'fill-extrusion-opacity', defaultValue: 1},
    {name: 'fill-extrusion-color', defaultValue: '#000000'},
    {name: 'fill-extrusion-translate', defaultValue: [0, 0]},
    {name: 'fill-extrusion-translate-anchor', defaultValue: 'map'},
    {name: 'fill-extrusion-pattern'},
    {name: 'fill-extrusion-height', defaultValue: 0},
    {name: 'fill-extrusion-base', defaultValue: 0},
    {name: 'fill-extrusion-vertical-gradient', defaultValue: true}
];

const FillExtrusionLayer = layerFactory(LAYOUT_PROPERTIES$6, PAINT_PROPERTIES$6, 'fill-extrusion');

const LAYOUT_PROPERTIES$7 = [
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES$7 = [
    {name: 'heatmap-radius', defaultValue: 30},
    {name: 'heatmap-weight', defaultValue: 1},
    {name: 'heatmap-intensity', defaultValue: 1},
    {
        name: 'heatmap-color',
        defaultValue: ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0, 0, 255, 0)', 0.1, 'royalblue', 0.3, 'cyan', 0.5, 'lime', 0.7, 'yellow', 1, 'red']
    },
    {name: 'heatmap-opacity', defaultValue: 1}
];

const HeatmapLayer = layerFactory(LAYOUT_PROPERTIES$7, PAINT_PROPERTIES$7, 'heatmap');

const LAYOUT_PROPERTIES$8 = [
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES$8 = [
    {name: 'hillshade-illumination-direction', defaultValue: 335},
    {name: 'hillshade-illumination-anchor', defaultValue: 'viewport'},
    {name: 'hillshade-exaggeration', defaultValue: 0.5},
    {name: 'hillshade-shadow-color', defaultValue: '#000000'},
    {name: 'hillshade-highlight-color', defaultValue: '#FFFFFF'},
    {name: 'hillshade-accent-color', defaultValue: '#000000'}
];

const HillshadeLayer = layerFactory(LAYOUT_PROPERTIES$8, PAINT_PROPERTIES$8, 'hillshade');

export { BackgroundLayer, CircleLayer, FillExtrusionLayer, FillLayer, GeoJSONSource, GeoMap, HeatmapLayer, HillshadeLayer, LineLayer, RasterLayer, SymbolLayer };
//# sourceMappingURL=index.js.map
