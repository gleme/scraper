const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const argv = require('yargs').argv;
const fs = require('fs');
const {
  set
} = require('lodash');
const url = argv.url;

(async () => {
  try {
    /**
     * Browse to the url and await until 
     * the table is loaded to evaluate
     */
    const browser = await puppeteer.launch({
      headless: true
    });
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForSelector('table');

    const resultHtml = await page.evaluate(() => {
      const html = document.documentElement.innerHTML;

      /**
       * Scroll the table until all data is loaded
       */

      return html;
    });

    // close browser after getting all page html
    browser.close();

    const $ = cheerio.load(resultHtml);
    const tableBody = [];
    const tableHeaders = [];
    $('table.unselectable > tbody > tr').each(function (trIdx, rowEl) {
      const rowData = [];
      $(this).find('td').each(function (tdIdx, tdEl) {
        const data = $(tdEl).text();
        if (trIdx === 0 && tdIdx !== 0) {
          tableHeaders.push(data);
        } else if (tdIdx !== 0) {
          rowData.push(data);
        }
      });
      if (trIdx !== 0) {
        tableBody.push(rowData);
      }
    });

    console.log('Number of extracted rows:', tableBody.length);

    /**
     * Assembly the json data
     */
    const jsonData = [];
    for (let rowData of tableBody) {
      let data = {};
      for (let prop of tableHeaders) {
        set(data, prop, rowData);
      }
      jsonData.push(data);
    }

    fs.writeFileSync(argv.out, JSON.stringify(jsonData));

  } catch (ex) {
    console.error(ex);
  }
})();