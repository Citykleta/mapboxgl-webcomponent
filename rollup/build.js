export default {
    input: './src/index.js',
    output: [{
        file: './dist/index.js',
        sourcemap: true,
        format: 'cjs',
        name: 'CitykletaMbGlComp'
    }, {
        file: './dist/index.mjs',
        sourcemap: true,
        format: 'es'
    }, {
        file: './dist/module.js',
        sourcemap: true,
        format: 'es'
    }],
    plugins: []
};