import {layerFactory} from './util.js';

const LAYOUT_PROPERTIES = [
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES = [
    {name: 'fill-extrusion-opacity', defaultValue: 1},
    {name: 'fill-extrusion-color', defaultValue: '#000000'},
    {name: 'fill-extrusion-translate', defaultValue: [0, 0]},
    {name: 'fill-extrusion-translate-anchor', defaultValue: 'map'},
    {name: 'fill-extrusion-pattern'},
    {name: 'fill-extrusion-height', defaultValue: 0},
    {name: 'fill-extrusion-base', defaultValue: 0},
    {name: 'fill-extrusion-vertical-gradient', defaultValue: true}
];

export const FillExtrusionLayer = layerFactory(LAYOUT_PROPERTIES, PAINT_PROPERTIES, 'fill-extrusion');