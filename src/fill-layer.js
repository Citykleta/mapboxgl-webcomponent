import {layerFactory} from './util.js';

const LAYOUT_PROPERTIES = [
    {name: 'fill-sort-key'},
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES = [
    {name: 'fill-antialias', defaultValue: true},
    {name: 'fill-opacity', defaultValue: 1},
    {name: 'fill-color', defaultValue: '#000000'},
    {name: 'fill-outline-color'},
    {name: 'fill-translate', defaultValue: [0, 0]},
    {name: 'fill-translate-anchor', defaultValue: 'map'},
    {name: 'fill-pattern'}
];

export const FillLayer = layerFactory(LAYOUT_PROPERTIES, PAINT_PROPERTIES, 'fill');