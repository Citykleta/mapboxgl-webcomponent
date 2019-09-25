const {test} = require('zora');
const puppeteer = require('puppeteer');
const globby = require('globby');
const {resolve, readFileSync} = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const createScreenShot = async name => {
    const htmlUrl = `http://localhost:3002/test/screenshots/cases/${name}.html`;
    const imagePath = resolve(process.cwd(), `./test/dist/screenshots/${name}.png`);
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    const page = await browser.newPage();
    await page.goto(htmlUrl);
    await page.waitFor(2000);
    await page.screenshot({path: imagePath});
    await browser.close();
};

test('screen shots', async t => {
    const cases = await globby('./test/screenshots/cases/*.html');
    const caseNames = cases.map(fileName => fileName.split('.')[0]);

    await t.test('taking screenshots', async t => {
        return Promise.all(caseNames.map(name => t.test(`taking screen shot for ${name}`, async t => {
            await createScreenShot(name);
            t.ok(true, `screen shot for ${name} successfully taken`);
        })));
    });

    await t.test('comparing screenshots with standards', async t => {
        return Promise.all(caseNames.map(name => t.test(`comparing for "${name}" case`, t => {
            const current = PNG.sync.read(readFileSync(resolve(process.cwd(), `./test/dist/screenshots/${name}.png`)));
            const standard = PNG.sync.read(readFileSync(resolve(process.cwd(), `./test/screenshots/standards/${name}.png`)));
            const diffCount = pixelmatch(current, standard, null, 800, 600, {threshold: 0.1});
            t.eq(diffCount, 0, 'pixel diff count should be 0');
        })));
    });
});