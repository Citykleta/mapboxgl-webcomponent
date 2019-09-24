import node from 'rollup-plugin-node-resolve';
import cjs from 'rollup-plugin-commonjs';

export default {
    input: './src/index.js',
    output: [{
        file: './components.js',
        sourcemap: true,
        format: 'es'
    }],
    plugins: [
        node(),
        cjs()
    ]
};