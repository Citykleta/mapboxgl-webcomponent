import replace from 'rollup-plugin-replace';
import {terser} from 'rollup-plugin-terser';

export default {
    input: ['./src/index.js'],
    output: [{
        file: './dist/mb-gl-comp.js',
        sourcemap: true,
        format: 'es'
    }],
    plugins: [
        replace({
            [`import mapbox from 'mapbox-gl;`]: ''
        }),
        terser()
    ]
};