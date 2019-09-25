import node from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';

export default {
    input: './test/unit/index.js',
    output: [{
        file: './test/dist/test.js',
        sourcemap: true,
        format: 'es'
    }],
    plugins: [
        node(),
        cjs()
    ]
};