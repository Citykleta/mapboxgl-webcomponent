import {layerFactory} from './util.js';

const LAYOUT_PROPERTIES = [
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES = [
    {name: 'hillshade-illumination-direction', defaultValue: 335},
    {name: 'hillshade-illumination-anchor', defaultValue: 'viewport'},
    {name: 'hillshade-exaggeration', defaultValue: 0.5},
    {name: 'hillshade-shadow-color', defaultValue: '#000000'},
    {name: 'hillshade-highlight-color', defaultValue: '#FFFFFF'},
    {name: 'hillshade-accent-color', defaultValue: '#000000'}
];

export const HillshadeLayer = layerFactory(LAYOUT_PROPERTIES, PAINT_PROPERTIES, 'hillshade');