const expressionTest = /^\d|^\[|^true|^false/;

export const parse = string => {
    if (expressionTest.test(string)) {
        return JSON.parse(string.replace(/'/g, '"'));
    }

    //normal string
    return string;
};

export const stringify = val => typeof val === 'string' ? val : JSON
    .stringify(val)
    .replace(/"/g, '\'');

export const instanceToLayerProperties = instance => (acc, prop) => {
    if ((prop.defaultValue !== void 0) || (instance[kebabToCamel(prop.name)] !== null)) {
        acc[prop.name] = instance[kebabToCamel(prop.name)];
    }
    return acc;
};

export const kebabToCamel = prop => prop
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

export const layerFactory = (layoutProperties, paintProperties, layerType) => {

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
