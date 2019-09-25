const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const img1 = PNG.sync.read(fs.readFileSync('./bis.png'));
const img2 = PNG.sync.read(fs.readFileSync('./example.png'));

const diffCount = pixelmatch(img1.data, img2.data, null, 800, 600, {threshold: 0.1});

console.log(diffCount);