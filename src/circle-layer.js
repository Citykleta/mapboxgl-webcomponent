import {layerFactory} from './util.js';

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


export const CircleLayer = layerFactory(LAYOUT_PROPERTIES, PAINT_PROPERTIES, 'circle');