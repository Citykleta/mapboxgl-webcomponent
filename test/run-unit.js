const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    const page = await browser.newPage();
    page.on('console', ev => console.log(ev.text()));
    await page.goto(`http://localhost:3002/test/dist/index.html`);
    await browser.close();
})();