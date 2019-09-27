export const EMPTY_GEOJSON_SOURCE_DATA = Object.freeze({
    type: 'FeatureCollection',
    features: []
});

const template = document.createElement('template');
template.innerHTML = `<slot name="layers"></slot>`;

export class GeoJSONSource extends HTMLElement {

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
            this._handleLayerChange();
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
        this.attachShadow({mode: 'open'});
        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this.setAttribute('slot', 'sources');
        this.shadowRoot.querySelector('slot').addEventListener('slotchange', this._handleLayerChange.bind(this));
    }

    disconnectedCallback() {
        if (this._map) {
            this._map.removeSource(this.sourceId);
        }
    }

    _handleLayerChange() {
        const layers = this.shadowRoot
            .querySelector('slot[name=layers]')
            .assignedNodes()
            .filter(el => el.hasAttribute('layer-id'));
        for (const layer of layers) {
            layer.setAttribute('source', this.sourceId);
            layer.map = this._map;
        }
    }
}
