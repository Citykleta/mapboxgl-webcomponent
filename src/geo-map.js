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

export class GeoMap extends HTMLElement {

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
        const map = this._map = new mapbox.Map({
            container,
            style: this.mbStyle,
            center: this.center,
            zoom: this.zoom,
            bearing: this.bearing,
            pitch: this.pitch
        });

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
