import {layerFactory} from './util.js';

const LAYOUT_PROPERTIES = [
    {name: 'line-cap', defaultValue: 'butt'},
    {name: 'line-join', defaultValue: 'miter'},
    {name: 'line-miter-limit', defaultValue: 2},
    {name: 'line-round-limit', defaultValue: 1.05},
    {name: 'line-sort-key'},
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES = [
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

export const LineLayer = layerFactory(LAYOUT_PROPERTIES, PAINT_PROPERTIES, 'line');
