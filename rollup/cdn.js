import node from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';
import {terser} from 'rollup-plugin-terser';

export default {
    input: './src/index.js',
    output: [{
        file: './dist/mb-gl-comp-full.js',
        sourcemap: true,
        format: 'es'
    }],
    plugins: [
        node(),
        cjs(),
        terser()
    ]
};