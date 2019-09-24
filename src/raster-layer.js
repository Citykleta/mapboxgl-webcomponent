import {layerFactory} from './util.js';

const LAYOUT_PROPERTIES = [
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES = [
    {name: 'raster-opacity', defaultValue: 1},
    {name: 'raster-hue-rotate', defaultValue: 0},
    {name: 'raster-brightness-min', defaultValue: 0},
    {name: 'raster-brightness-max', defaultValue: 1},
    {name: 'raster-saturation', defaultValue: 0},
    {name: 'raster-resampling', defaultValue: 'linear'},
    {name: 'raster-fade-duration', defaultValue: 300}
];

export const RasterLayer = layerFactory(LAYOUT_PROPERTIES, PAINT_PROPERTIES, 'raster');