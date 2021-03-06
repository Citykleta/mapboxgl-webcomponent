const {test} = require('zora');
const puppeteer = require('puppeteer');
const globby = require('globby');
const {readFileSync} = require('fs');
const {resolve} = require('path');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');

const createScreenShot = async (name, browser) => {
    const htmlUrl = `http://localhost:3002/test/screenshots/cases/${name}.html`;
    const imagePath = resolve(process.cwd(), `./test/dist/screenshots/${name}.png`);
    const page = await browser.newPage();
    await page.goto(htmlUrl);
    await page.waitFor(2500);
    await page.screenshot({path: imagePath});
};

test('screen shots', async t => {
    const browser = await puppeteer.launch({
        // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {

        const cases = (await globby('./test/screenshots/cases/*.html'))
            .map(f => f.split('/')[4])
            .map(f => f.split('.')[0]);
        const caseNames = cases.map(fileName => fileName.split('.')[0]);

        await t.test('taking screenshots', async t => {
            return Promise.all(caseNames.map(name => t.test(`taking screen shot for ${name}`, async t => {
                await createScreenShot(name, browser);
                t.ok(true, `screen shot for ${name} successfully taken`);
            })));
        });

        t.test('comparing screenshots with standards', async t => {
            for (const name of caseNames) {
                t.test(`comparing for "${name}" case`, t => {
                    const current = PNG.sync.read(readFileSync(resolve(process.cwd(), `./test/dist/screenshots/${name}.png`)));
                    const standard = PNG.sync.read(readFileSync(resolve(process.cwd(), `./test/screenshots/standards/${name}.png`)));
                    const diffCount = pixelmatch(current.data, standard.data, null, 800, 600, {threshold: 0.1});
                    t.eq(diffCount, 0, 'pixel diff count should be 0');
                });
            }
        });
    } catch (e) {
        console.error(e);
        process.exitCode = 1;
    } finally {
        browser.close();
    }
});