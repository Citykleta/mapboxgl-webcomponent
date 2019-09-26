export default {
    input: './src/index.js',
    output: [{
        file: './dist/index.js',
        format: 'umd',
        name: 'CitykletaMbGlComp'
    }, {
        file: './dist/index.mjs',
        format: 'es'
    }, {
        file: './dist/module.js',
        format: 'es'
    }],
    plugins: []
};