const EMPTY_GEOJSON_SOURCE_DATA = Object.freeze({
    type: 'FeatureCollection',
    features: []
});

export class GeoJSONSource extends HTMLElement {

    set map(value) {
        if (value !== this._map) {
            this._map = value;
            this._map.addSource(this.sourceId, {
                type: 'geojson',
                data: this.data
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
