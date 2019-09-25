const puppeteer = require('puppeteer');
const globby = require('globby');
const {resolve} = require('path');

(async () => {
    const cases = (await globby('./test/screenshots/cases/*.html'))
        .map(f => f.split('/')[4])
        .map(f => f.split('.')[0]);
    const caseNames = cases.map(fileName => fileName.split('.')[0]);
    await Promise.all(caseNames.map(createScreenShot));
})();

const createScreenShot = async name => {
    console.log(name);
    const htmlUrl = `http://localhost:3002/test/screenshots/cases/${name}.html`;
    const imagePath = resolve(process.cwd(), `./test/screenshots/standards/${name}.png`);
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    const page = await browser.newPage();
    await page.goto(htmlUrl);
    await page.waitFor(2000);
    await page.screenshot({path: imagePath});
    await browser.close();
};