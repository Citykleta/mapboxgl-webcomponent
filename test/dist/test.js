const startTestMessage = (test, offset) => ({
    type: "TEST_START" /* TEST_START */,
    data: test,
    offset
});
const assertionMessage = (assertion, offset) => ({
    type: "ASSERTION" /* ASSERTION */,
    data: assertion,
    offset
});
const endTestMessage = (test, offset) => ({
    type: "TEST_END" /* TEST_END */,
    data: test,
    offset
});
const bailout = (error, offset) => ({
    type: "BAIL_OUT" /* BAIL_OUT */,
    data: error,
    offset
});

const delegateToCounter = (counter) => (target) => Object.defineProperties(target, {
    skipCount: {
        get() {
            return counter.skipCount;
        },
    },
    failureCount: {
        get() {
            return counter.failureCount;
        }
    },
    successCount: {
        get() {
            return counter.successCount;
        }
    },
    count: {
        get() {
            return counter.count;
        }
    }
});
const counter = () => {
    let success = 0;
    let failure = 0;
    let skip = 0;
    return Object.defineProperties({
        update(assertion) {
            const { pass, skip: isSkipped } = assertion;
            if (isSkipped) {
                skip++;
            }
            else if (!isAssertionResult(assertion)) {
                skip += assertion.skipCount;
                success += assertion.successCount;
                failure += assertion.failureCount;
            }
            else if (pass) {
                success++;
            }
            else {
                failure++;
            }
        }
    }, {
        successCount: {
            get() {
                return success;
            }
        },
        failureCount: {
            get() {
                return failure;
            }
        },
        skipCount: {
            get() {
                return skip;
            }
        },
        count: {
            get() {
                return skip + success + failure;
            }
        }
    });
};

const defaultTestOptions = Object.freeze({
    offset: 0,
    skip: false
});
const noop = () => {
};
const tester = (description, spec, { offset = 0, skip = false } = defaultTestOptions) => {
    let id = 0;
    let pass = true;
    let executionTime = 0;
    let error = null;
    const testCounter = counter();
    const withTestCounter = delegateToCounter(testCounter);
    const assertions = [];
    const collect = item => assertions.push(item);
    const specFunction = skip === true ? noop : function zora_spec_fn() {
        return spec(assert(collect, offset));
    };
    const testRoutine = (async function () {
        try {
            const start = Date.now();
            const result = await specFunction();
            executionTime = Date.now() - start;
            return result;
        }
        catch (e) {
            error = e;
        }
    })();
    return Object.defineProperties(withTestCounter({
        [Symbol.asyncIterator]: async function* () {
            await testRoutine;
            for (const assertion of assertions) {
                assertion.id = ++id;
                if (assertion[Symbol.asyncIterator]) {
                    // Sub test
                    yield startTestMessage({ description: assertion.description }, offset);
                    yield* assertion;
                    if (assertion.error !== null) {
                        // Bubble up the error and return
                        error = assertion.error;
                        pass = false;
                        return;
                    }
                }
                yield assertionMessage(assertion, offset);
                pass = pass && assertion.pass;
                testCounter.update(assertion);
            }
            return error !== null ?
                yield bailout(error, offset) :
                yield endTestMessage(this, offset);
        }
    }), {
        description: {
            enumerable: true,
            value: description
        },
        pass: {
            enumerable: true,
            get() {
                return pass;
            }
        },
        executionTime: {
            enumerable: true,
            get() {
                return executionTime;
            }
        },
        length: {
            get() {
                return assertions.length;
            }
        },
        error: {
            get() {
                return error;
            }
        },
        routine: {
            value: testRoutine
        },
        skip: {
            value: skip
        }
    });
};

var isArray = Array.isArray;
var keyList = Object.keys;
var hasProp = Object.prototype.hasOwnProperty;

var fastDeepEqual = function equal(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    var arrA = isArray(a)
      , arrB = isArray(b)
      , i
      , length
      , key;

    if (arrA && arrB) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!equal(a[i], b[i])) return false;
      return true;
    }

    if (arrA != arrB) return false;

    var dateA = a instanceof Date
      , dateB = b instanceof Date;
    if (dateA != dateB) return false;
    if (dateA && dateB) return a.getTime() == b.getTime();

    var regexpA = a instanceof RegExp
      , regexpB = b instanceof RegExp;
    if (regexpA != regexpB) return false;
    if (regexpA && regexpB) return a.toString() == b.toString();

    var keys = keyList(a);
    length = keys.length;

    if (length !== keyList(b).length)
      return false;

    for (i = length; i-- !== 0;)
      if (!hasProp.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      key = keys[i];
      if (!equal(a[key], b[key])) return false;
    }

    return true;
  }

  return a!==a && b!==b;
};

const isAssertionResult = (result) => {
    return 'operator' in result;
};
const specFnRegexp = /zora_spec_fn/;
const nodeInternal = /node_modules\/.*|\(internal\/.*/;
const getAssertionLocation = () => {
    const err = new Error();
    const stack = (err.stack || '')
        .split('\n')
        .filter(l => !nodeInternal.test(l) && l !== '');
    const userLandIndex = stack.findIndex(l => specFnRegexp.test(l));
    return (userLandIndex >= 1 ?
        stack[userLandIndex - 1] : (stack[stack.length - 1] || 'N/A'))
        .trim()
        .replace(/^at|^@/, '');
};
const assertMethodHook = (fn) => function (...args) {
    // @ts-ignore
    return this.collect(fn(...args));
};
const aliasMethodHook = (methodName) => function (...args) {
    return this[methodName](...args);
};
const AssertPrototype = {
    equal: assertMethodHook((actual, expected, description = 'should be equivalent') => ({
        pass: fastDeepEqual(actual, expected),
        actual,
        expected,
        description,
        operator: "equal" /* EQUAL */
    })),
    equals: aliasMethodHook('equal'),
    eq: aliasMethodHook('equal'),
    deepEqual: aliasMethodHook('equal'),
    notEqual: assertMethodHook((actual, expected, description = 'should not be equivalent') => ({
        pass: !fastDeepEqual(actual, expected),
        actual,
        expected,
        description,
        operator: "notEqual" /* NOT_EQUAL */
    })),
    notEquals: aliasMethodHook('notEqual'),
    notEq: aliasMethodHook('notEqual'),
    notDeepEqual: aliasMethodHook('notEqual'),
    is: assertMethodHook((actual, expected, description = 'should be the same') => ({
        pass: Object.is(actual, expected),
        actual,
        expected,
        description,
        operator: "is" /* IS */
    })),
    same: aliasMethodHook('is'),
    isNot: assertMethodHook((actual, expected, description = 'should not be the same') => ({
        pass: !Object.is(actual, expected),
        actual,
        expected,
        description,
        operator: "isNot" /* IS_NOT */
    })),
    notSame: aliasMethodHook('isNot'),
    ok: assertMethodHook((actual, description = 'should be truthy') => ({
        pass: Boolean(actual),
        actual,
        expected: 'truthy value',
        description,
        operator: "ok" /* OK */
    })),
    truthy: aliasMethodHook('ok'),
    notOk: assertMethodHook((actual, description = 'should be falsy') => ({
        pass: !Boolean(actual),
        actual,
        expected: 'falsy value',
        description,
        operator: "notOk" /* NOT_OK */
    })),
    falsy: aliasMethodHook('notOk'),
    fail: assertMethodHook((description = 'fail called') => ({
        pass: false,
        actual: 'fail called',
        expected: 'fail not called',
        description,
        operator: "fail" /* FAIL */
    })),
    throws: assertMethodHook((func, expected, description) => {
        let caught;
        let pass;
        let actual;
        if (typeof expected === 'string') {
            [expected, description] = [description, expected];
        }
        try {
            func();
        }
        catch (err) {
            caught = { error: err };
        }
        pass = caught !== undefined;
        actual = caught && caught.error;
        if (expected instanceof RegExp) {
            pass = expected.test(actual) || expected.test(actual && actual.message);
            actual = actual && actual.message || actual;
            expected = String(expected);
        }
        else if (typeof expected === 'function' && caught) {
            pass = actual instanceof expected;
            actual = actual.constructor;
        }
        return {
            pass,
            actual,
            expected,
            description: description || 'should throw',
            operator: "throws" /* THROWS */,
        };
    }),
    doesNotThrow: assertMethodHook((func, expected, description) => {
        let caught;
        if (typeof expected === 'string') {
            [expected, description] = [description, expected];
        }
        try {
            func();
        }
        catch (err) {
            caught = { error: err };
        }
        return {
            pass: caught === undefined,
            expected: 'no thrown error',
            actual: caught && caught.error,
            operator: "doesNotThrow" /* DOES_NOT_THROW */,
            description: description || 'should not throw'
        };
    })
};
const assert = (collect, offset) => {
    const actualCollect = item => {
        if (!item.pass) {
            item.at = getAssertionLocation();
        }
        collect(item);
        return item;
    };
    return Object.assign(Object.create(AssertPrototype, { collect: { value: actualCollect } }), {
        test(description, spec, opts = defaultTestOptions) {
            const subTest = tester(description, spec, Object.assign({}, defaultTestOptions, opts, { offset: offset + 1 }));
            collect(subTest);
            return subTest.routine;
        },
        skip(description, spec = noop, opts = defaultTestOptions) {
            return this.test(description, spec, Object.assign({}, opts, { skip: true }));
        }
    });
};

// with two arguments
const curry = (fn) => (a, b) => b === void 0 ? b => fn(a, b) : fn(a, b);
const toCurriedIterable = gen => curry((a, b) => ({
    [Symbol.asyncIterator]() {
        return gen(a, b);
    }
}));

const map = toCurriedIterable(async function* (fn, asyncIterable) {
    let index = 0;
    for await (const i of asyncIterable) {
        yield fn(i, index, asyncIterable);
        index++;
    }
});

const filter = toCurriedIterable(async function* (fn, asyncIterable) {
    let index = 0;
    for await (const i of asyncIterable) {
        if (fn(i, index, asyncIterable) === true) {
            yield i;
        }
        index++;
    }
});

const print = (message, offset = 0) => {
    console.log(message.padStart(message.length + (offset * 4))); // 4 white space used as indent (see tap-parser)
};
const stringifySymbol = (key, value) => {
    if (typeof value === 'symbol') {
        return value.toString();
    }
    return value;
};
const printYAML = (obj, offset = 0) => {
    const YAMLOffset = offset + 0.5;
    print('---', YAMLOffset);
    for (const [prop, value] of Object.entries(obj)) {
        print(`${prop}: ${JSON.stringify(stringifySymbol(null, value), stringifySymbol)}`, YAMLOffset + 0.5);
    }
    print('...', YAMLOffset);
};
const comment = (value, offset) => {
    print(`# ${value}`, offset);
};
const subTestPrinter = (prefix = '') => (message) => {
    const { data } = message;
    const value = `${prefix}${data.description}`;
    comment(value, message.offset);
};
const mochaTapSubTest = subTestPrinter('Subtest: ');
const tapeSubTest = subTestPrinter();
const assertPrinter = (diagnostic) => (message) => {
    const { data, offset } = message;
    const { pass, description, id } = data;
    const label = pass === true ? 'ok' : 'not ok';
    if (isAssertionResult(data)) {
        print(`${label} ${id} - ${description}`, offset);
        if (pass === false) {
            printYAML(diagnostic(data), offset);
        }
    }
    else {
        const comment = data.skip === true ? 'SKIP' : `${data.executionTime}ms`;
        print(`${pass ? 'ok' : 'not ok'} ${id} - ${description} # ${comment}`, message.offset);
    }
};
const tapeAssert = assertPrinter(({ id, pass, description, ...rest }) => rest);
const mochaTapAssert = assertPrinter(({ expected, id, pass, description, actual, operator, at, ...rest }) => ({
    wanted: expected,
    found: actual,
    at,
    operator,
    ...rest
}));
const testEnd = (message) => {
    const length = message.data.length;
    const { offset } = message;
    print(`1..${length}`, offset);
};
const printBailout = (message) => {
    print('Bail out! Unhandled error.');
};
const reportAsMochaTap = (message) => {
    switch (message.type) {
        case "TEST_START" /* TEST_START */:
            mochaTapSubTest(message);
            break;
        case "ASSERTION" /* ASSERTION */:
            mochaTapAssert(message);
            break;
        case "TEST_END" /* TEST_END */:
            testEnd(message);
            break;
        case "BAIL_OUT" /* BAIL_OUT */:
            printBailout();
            throw message.data;
    }
};
const reportAsTapeTap = (message) => {
    switch (message.type) {
        case "TEST_START" /* TEST_START */:
            tapeSubTest(message);
            break;
        case "ASSERTION" /* ASSERTION */:
            tapeAssert(message);
            break;
        case "BAIL_OUT" /* BAIL_OUT */:
            printBailout();
            throw message.data;
    }
};
const flatFilter = filter((message) => {
    return message.type === "TEST_START" /* TEST_START */
        || message.type === "BAIL_OUT" /* BAIL_OUT */
        || (message.type === "ASSERTION" /* ASSERTION */ && (isAssertionResult(message.data) || message.data.skip === true));
});
const flattenStream = (stream) => {
    let id = 0;
    const mapper = map(message => {
        if (message.type === "ASSERTION" /* ASSERTION */) {
            const mappedData = Object.assign(message.data, { id: ++id });
            return assertionMessage(mappedData, 0);
        }
        return Object.assign({}, message, { offset: 0 });
    });
    return mapper(flatFilter(stream));
};
const printSummary = (harness) => {
    print('', 0);
    comment(harness.pass ? 'ok' : 'not ok', 0);
    comment(`success: ${harness.successCount}`, 0);
    comment(`skipped: ${harness.skipCount}`, 0);
    comment(`failure: ${harness.failureCount}`, 0);
};
const tapeTapLike = async (stream) => {
    print('TAP version 13');
    const streamInstance = flattenStream(stream);
    for await (const message of streamInstance) {
        reportAsTapeTap(message);
    }
    print(`1..${stream.count}`, 0);
    printSummary(stream);
};
const mochaTapLike = async (stream) => {
    print('TAP version 13');
    for await (const message of stream) {
        reportAsMochaTap(message);
    }
    printSummary(stream);
};

const harnessFactory = () => {
    const tests = [];
    const testCounter = counter();
    const withTestCounter = delegateToCounter(testCounter);
    const rootOffset = 0;
    const collect = item => tests.push(item);
    const api = assert(collect, rootOffset);
    let pass = true;
    let id = 0;
    const instance = Object.create(api, {
        length: {
            get() {
                return tests.length;
            }
        },
        pass: {
            get() {
                return pass;
            }
        }
    });
    return withTestCounter(Object.assign(instance, {
        [Symbol.asyncIterator]: async function* () {
            for (const t of tests) {
                t.id = ++id;
                if (t[Symbol.asyncIterator]) {
                    // Sub test
                    yield startTestMessage({ description: t.description }, rootOffset);
                    yield* t;
                    if (t.error !== null) {
                        pass = false;
                        return;
                    }
                }
                yield assertionMessage(t, rootOffset);
                pass = pass && t.pass;
                testCounter.update(t);
            }
            yield endTestMessage(this, 0);
        },
        report: async (reporter = tapeTapLike) => {
            return reporter(instance);
        }
    }));
};

let autoStart = true;
let indent = false;
const defaultTestHarness = harnessFactory();
const rootTest = defaultTestHarness.test.bind(defaultTestHarness);
rootTest.indent = () => indent = true;
const test = rootTest;
const skip = (description, spec, options = {}) => rootTest(description, spec, Object.assign({}, options, { skip: true }));
rootTest.skip = skip;
const equal = defaultTestHarness.equal.bind(defaultTestHarness);
const notEqual = defaultTestHarness.notEqual.bind(defaultTestHarness);
const is = defaultTestHarness.is.bind(defaultTestHarness);
const isNot = defaultTestHarness.isNot.bind(defaultTestHarness);
const ok = defaultTestHarness.ok.bind(defaultTestHarness);
const notOk = defaultTestHarness.notOk.bind(defaultTestHarness);
const fail = defaultTestHarness.fail.bind(defaultTestHarness);
const throws = defaultTestHarness.throws.bind(defaultTestHarness);
const doesNotThrow = defaultTestHarness.doesNotThrow.bind(defaultTestHarness);
const start = () => {
    if (autoStart) {
        defaultTestHarness.report(indent ? mochaTapLike : tapeTapLike);
    }
};
// on next tick start reporting
// @ts-ignore
if (typeof window === 'undefined') {
    setTimeout(start, 0);
}
else {
    // @ts-ignore
    window.addEventListener('load', start);
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

const layerEventsList = [
    'mouseup',
    'click',
    'dblclick',
    'mousemove',
    'mouseenter',
    'mouseleave',
    'mouseover',
    'mouseout',
    'contextmenu',
    'touchstart',
    'touchend',
    'touchcancel'
];

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

                let listener;

                while (listener = this._listenersQueue.shift()) {
                    this._map.on(listener[0], this.layerId, listener[1]);
                }

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
            this._listenersQueue = [];
        }

        connectedCallback() {
            this.setAttribute('slot', 'layers');
        }

        disconnectedCallback() {
            if (this._map) {
                this._map.removeLayer(this.layerId);
            }
        }

        addEventListener(type, listener, options) {
            if (layerEventsList.includes(type)) {
                if (this._map) {
                    this._map.on(type, this.layerId, listener);
                } else {
                    this._listenersQueue.push([type, listener]);
                }
            } else {
                super.addEventListener(type, listener, options);
            }
        }

        removeEventListener(type, listener, options) {
            if (layerEventsList.includes(type)) {
                this._map.off(type, this.layerId, listener);
            } else {
                super.removeEventListener(type, listener, options);
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

const fake = () => {
    const calls = [];
    const fn = function (...args) {
        calls.push(args);
    };

    Object.defineProperty(fn, 'calledOnce', {
        get() {
            return calls.length === 1;
        }
    });

    Object.defineProperty(fn, 'calls', {
        get() {
            return calls;
        }
    });

    Object.defineProperty(fn, 'callCount', {
        get() {
            return calls.length;
        }
    });

    Object.defineProperty(fn, 'lastCall', {
        get() {
            return calls[calls.length - 1];
        }
    });

    return fn;
};

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

const EMPTY_GEOJSON_SOURCE_DATA = Object.freeze({
    type: 'FeatureCollection',
    features: []
});

const template = document.createElement('template');
template.innerHTML = `<slot name="layers"></slot>`;

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
//# sourceMappingURL=test.js.map
