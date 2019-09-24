import {layerFactory} from './util.js';

const LAYOUT_PROPERTIES = [
    {name: 'visibility', defaultValue: 'visible'}
];

const PAINT_PROPERTIES = [
    {name: 'heatmap-radius', defaultValue: 30},
    {name: 'heatmap-weight', defaultValue: 1},
    {name: 'heatmap-intensity', defaultValue: 1},
    {
        name: 'heatmap-color',
        defaultValue: ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(0, 0, 255, 0)', 0.1, 'royalblue', 0.3, 'cyan', 0.5, 'lime', 0.7, 'yellow', 1, 'red']
    },
    {name: 'heatmap-opacity', defaultValue: 1}
];

export const HeatmapLayer = layerFactory(LAYOUT_PROPERTIES, PAINT_PROPERTIES, 'heatmap');