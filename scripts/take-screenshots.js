const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:3002/index.html');
    await page.waitFor(2000);
    await page.screenshot({path: './example.png'});
    await browser.close();
})();