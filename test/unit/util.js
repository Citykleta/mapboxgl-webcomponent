import {test} from 'zora';
import {kebabToCamel, layerFactory, parse, stringify} from '../../src/util.js';
import {fake} from './helper.js';

test('parse a number string should return a number', t => {
    t.eq(parse('1'), 1);
    t.eq(parse('0'), 0);
    t.eq(parse('234'), 234);
    t.eq(parse('3.14159'), 3.14159);
});

test('parse boolean string should return a boolean', t => {
    t.eq(parse('true'), true);
    t.eq(parse('false'), false);
});

test('parse array string should return an array', t => {
    t.eq(parse('[1,true]'), [1, true]);
    t.eq(parse(`["true",'blah']`), ['true', 'blah'], 'should support single quoted string');
    t.eq(parse('["foo",[4, [true]]]'), ['foo', [4, [true]]], 'should support nested array');
});

test('stringify string should return value as it is ', t => {
    t.eq(stringify('foo bar'), 'foo bar');
});

test('stringify boolean', t => {
    t.eq(stringify(true), 'true');
    t.eq(stringify(false), 'false');
});

test('stringify numbers', t => {
    t.eq(stringify(0), '0');
    t.eq(stringify(12), '12');
    t.eq(stringify(3.14159), '3.14159');
});

test('stringify arrays', t => {
    t.eq(stringify([4, true]), '[4,true]');
    t.eq(stringify(['foo', 'bar']), `['foo','bar']`, 'string members should be single quoted');
    t.eq(stringify(['foo', ['bar', [false, 4, 'hello']]]), `['foo',['bar',[false,4,'hello']]]`, 'should work on nexted structure');
});

test('kebab to camel case', t => {
    t.eq(kebabToCamel('circle-radius'), 'circleRadius');
    t.eq(kebabToCamel('circle'), 'circle', 'single part kebab string');
});

test('layerFactory', t => {

    const TestClass = layerFactory([
        {name: 'circle-sort-key'},
        {name: 'visibility', defaultValue: 'visible'}
    ], [
        {name: 'circle-radius', defaultValue: 5},
        {name: 'some-other'}
    ], 'circle');

    customElements.define('test-class', TestClass);

    t.test('set the map property should add the layer to the underlying mapbox object', t => {
        const fakeMethod = fake();
        const map = {
            addLayer: fakeMethod
        };

        const instance = new TestClass();

        instance.setAttribute('layer-id', 'test-1');

        instance.map = map;

        t.ok(fakeMethod.calledOnce, 'addLayer should have been called once');
        t.eq(fakeMethod.calls[0], [{
            type: 'circle',
            id: 'test-1',
            paint: {'circle-radius': 5},
            layout: {visibility: 'visible'}
        }], 'should have forwarded "type", "layer-id" and built default "paint" and "layout"');

    });

    t.test('set the map property should add the layer to the underlying mapbox object and set sources and filter if specified ', t => {
        const fakeMethod = fake();
        const map = {
            addLayer: fakeMethod
        };

        const instance = new TestClass();

        instance.setAttribute('layer-id', 'test-2');
        instance.setAttribute('source', 'mysource');
        instance.setAttribute('source-layer', 'mysource-layer');
        instance.setAttribute('filter', '[\'==\',\'$type\',\'Polygon\']');

        instance.map = map;

        t.ok(fakeMethod.calledOnce, 'addLayer should have been called once');
        t.eq(fakeMethod.calls[0], [{
            'type': 'circle',
            'id': 'test-2',
            'paint': {'circle-radius': 5},
            'layout': {'visibility': 'visible'},
            'source': 'mysource',
            'source-layer': 'mysource-layer',
            'filter': ['==', '$type', 'Polygon']
        }], 'should have forwarded "type", "layer-id", "source","source-id", "filter" and built default "paint" and "layout"');
    });

    t.test('should have forwarded "type", "layer-id" and built default "paint" and "layout" with provided value', t => {
        const fakeMethod = fake();
        const map = {
            addLayer: fakeMethod
        };

        const instance = new TestClass();

        instance.setAttribute('layer-id', 'test-3');
        instance.setAttribute('circle-radius', '12');
        instance.setAttribute('visibility', 'none');
        instance.setAttribute('circle-sort-key', 'foo');
        instance.setAttribute('some-other', 'value');

        instance.map = map;

        t.ok(fakeMethod.calledOnce, 'addLayer should have been called once');
        t.eq(fakeMethod.calls[0], [{
            'type': 'circle',
            'id': 'test-3',
            'paint': {'circle-radius': 12, 'some-other': 'value'},
            'layout': {'circle-sort-key': 'foo', 'visibility': 'none'}
        }], 'should have forwarded "type", "layer-id" and built "paint" and "layout" based on attributes values');
    });

    t.test('paint and layout propeties getters should have been created', t => {
        const fakeMethod = fake();
        const map = {
            addLayer: fakeMethod
        };
        const instance = new TestClass();
        instance.map = map;
        t.eq(instance.circleRadius, 5, 'default value should be returned');
        t.eq(instance.visibility, 'visible', 'default value should be returned');
        t.eq(instance.someOther, null, 'null should be returned if not default value is specified');
        t.eq(instance.circleSortKey, null, 'null should be returned if not default value is specified');
    });

    t.test('paint and layout should be observed attributes', t => {
        t.eq(TestClass.observedAttributes, ['circle-radius', 'some-other', 'circle-sort-key', 'visibility']);
    });

    t.test('upgraded instance should set its slot attribute', t => {
        const el = document.createElement('test-class');
        document.querySelector('body').appendChild(el);
        t.eq(el.getAttribute('slot'), 'layers');
        el.remove();
    });

    t.test('when disconnecting element the layer should be remove', t => {
        const el = document.createElement('test-class');
        el.setAttribute('layer-id', 'test-X');
        const fakeAddLayer = fake();
        const fakeRemoveLayer = fake();
        const map = {
            addLayer: fakeAddLayer,
            removeLayer: fakeRemoveLayer
        };
        document.querySelector('body').appendChild(el);
        t.eq(el.getAttribute('slot'), 'layers');
        el.map = map;
        t.ok(fakeAddLayer.calledOnce);
        t.eq(fakeRemoveLayer.calls.length, 0);
        el.remove();
        t.ok(fakeAddLayer.calledOnce);
        t.ok(fakeRemoveLayer.calledOnce);
        t.eq(fakeRemoveLayer.calls[0], ['test-X']);
    });

    t.test('setting paint and layout properties should reflect on attributes', t => {
        const instance = new TestClass();

        t.eq(instance.circleRadius, 5, 'default value should be returned');
        t.eq(instance.visibility, 'visible', 'default value should be returned');
        t.eq(instance.someOther, null, 'null should be returned if not default value is specified');
        t.eq(instance.circleSortKey, null, 'null should be returned if not default value is specified');

        instance.circleRadius = 12;
        t.eq(instance.getAttribute('circle-radius'), '12');

        instance.visibility = 'none';
        t.eq(instance.getAttribute('visibility'), 'none');

        instance.someOther = ['==', '$type', 'Polygon'];
        t.eq(instance.getAttribute('some-other'), `['==','$type','Polygon']`, 'should reflect on array prop too');

        instance.circleSortKey = ['==', '$type', 'Polygon'];
        t.eq(instance.getAttribute('circle-sort-key'), `['==','$type','Polygon']`, 'should reflect on array prop too');
    });

    t.test('change in attributes should respectively call a repaint update and a layout update', t => {
        const instance = new TestClass();
        instance.setAttribute('layer-id', 'test-woot');
        const setPaintProperty = fake();
        const setLayoutProperty = fake();
        const map = {
            setLayoutProperty: setLayoutProperty,
            setPaintProperty: setPaintProperty,
            addLayer() {
                // do nothing
            }
        };
        instance.map = map;

        instance.setAttribute('circle-radius', 12);
        t.eq(instance.circleRadius, 12, 'property should have been updated');
        t.ok(setPaintProperty.calledOnce);
        t.eq(setLayoutProperty.callCount, 0);
        t.eq(setPaintProperty.lastCall, ['test-woot', 'circle-radius', 12]);

        instance.setAttribute('some-other', `['blah',[3,4]]`);
        t.eq(instance.someOther, ['blah', [3, 4]]);
        t.eq(setPaintProperty.callCount, 2);
        t.eq(setLayoutProperty.callCount, 0);
        t.eq(setPaintProperty.lastCall, ['test-woot', 'some-other', ['blah', [3, 4]]]);

        instance.setAttribute('visibility', 'none');
        t.eq(instance.visibility, 'none', 'property should have been updated');
        t.eq(setPaintProperty.callCount, 2);
        t.ok(setLayoutProperty.calledOnce);
        t.eq(setLayoutProperty.lastCall, ['test-woot', 'visibility', 'none']);

        instance.setAttribute('circle-sort-key', `['blah',[3,4]]`);
        t.eq(instance.circleSortKey, ['blah', [3, 4]]);
        t.eq(setPaintProperty.callCount, 2);
        t.eq(setLayoutProperty.callCount, 2);
        t.eq(setLayoutProperty.lastCall, ['test-woot', 'circle-sort-key', ['blah', [3, 4]]]);
    });
});

