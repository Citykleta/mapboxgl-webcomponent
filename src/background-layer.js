import {layerFactory} from './util.js';

const LAYOUT_PROPERTIES = [
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES = [
    {name: 'background-color', defaultValue: '#000000'},
    {name: 'background-pattern'},
    {name: 'background-opacity', defaultValue: 1}
];

export const BackgroundLayer = layerFactory(LAYOUT_PROPERTIES, PAINT_PROPERTIES, 'background');