import {test} from 'zora';
import {fake} from './helper.js';
import {EMPTY_GEOJSON_SOURCE_DATA, GeoJSONSource} from '../../src/geo-json-source.js';

test('geo source component', t => {
    customElements.define('test-geojson', GeoJSONSource);

    t.test('when connected, it should set its slot attribute', t => {
        const el = document.createElement('test-geojson');
        document
            .querySelector('body')
            .appendChild(el);

        t.eq(el.getAttribute('slot'), 'sources');
        el.remove();
    });

    t.test('add source when the map property is set', t => {
        const addSource = fake();
        const map = {
            addSource
        };
        const el = new GeoJSONSource();
        el.setAttribute('source-id', 'some_source');
        el.map = map;
        t.ok(addSource.calledOnce);
        t.eq(addSource.calls[0], ['some_source', {
            type: 'geojson',
            data: EMPTY_GEOJSON_SOURCE_DATA
        }]);
    });

    t.test('add source, when the data-url attribute is set, it should be forwarded', t => {
        const addSource = fake();
        const map = {
            addSource
        };
        const el = new GeoJSONSource();
        el.setAttribute('source-id', 'some_source');
        el.setAttribute('data-url', 'http://example.com');
        el.map = map;
        t.ok(addSource.calledOnce);
        t.eq(addSource.calls[0], ['some_source', {
            type: 'geojson',
            data: 'http://example.com'
        }]);
    });

    t.test('should remove the source when element is disconnected', t => {
        const removeSource = fake();
        const addSource = fake();

        const map = {
            removeSource,
            addSource
        };

        const el = document.createElement('test-geojson');
        el.setAttribute('source-id', 'soouurrce');
        document
            .querySelector('body')
            .appendChild(el);

        el.map = map;

        t.eq(el.getAttribute('slot'), 'sources');

        el.remove();

        t.ok(addSource.calledOnce);
        t.ok(removeSource.calledOnce);
        t.eq(removeSource.calls[0], ['soouurrce']);
    });

    t.test('when updating data-url attribute, source data should be changed', t => {
        const addSource = fake();
        const setData = fake();
        const map = {
            addSource,
            getSource(id) {
                if (id !== 'source') {
                    throw new Error(`expected "source" but got ${id}`);
                }
                return {
                    setData
                };
            }
        };
        const el = new GeoJSONSource();
        el.setAttribute('source-id', 'source');
        el.setAttribute('data-url', 'http://example.com');
        el.map = map;
        t.ok(addSource.calledOnce);
        t.eq(addSource.calls[0], ['source', {
            type: 'geojson',
            data: 'http://example.com'
        }]);
        el.setAttribute('data-url', 'http://other.com');
        t.ok(setData.calledOnce);
        t.eq(setData.calls[0], ['http://other.com']);
    });

    t.test('when updating the data property, the source should update its data', t => {
        const addSource = fake();
        const setData = fake();
        const map = {
            addSource,
            getSource(id) {
                if (id !== 'source') {
                    throw new Error(`expected "source" but got ${id}`);
                }
                return {
                    setData
                };
            }
        };
        const el = new GeoJSONSource();
        el.setAttribute('source-id', 'source');
        el.map = map;
        t.ok(addSource.calledOnce);
        t.eq(addSource.calls[0], ['source', {
            type: 'geojson',
            data: EMPTY_GEOJSON_SOURCE_DATA
        }]);
        el.data = {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [-82, 23]
                }
            }]
        };
        t.ok(setData.calledOnce);
        t.eq(setData.calls[0], [{
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [-82, 23]
                }
            }]
        }]);
    });

    t.test('dataUrl property should reflect on data-url attribute', t => {
        const el = new GeoJSONSource();
        el.setAttribute('data-url', 'foo');
        t.eq(el.dataUrl, 'foo');
        el.dataUrl = 'anotherfoo';
        t.eq(el.getAttribute('data-url'), 'anotherfoo');
    });
});
