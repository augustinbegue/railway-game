const puppeteer = require('puppeteer');
const fs = require('fs');

const url = 'https://fr.wikipedia.org/wiki/Liste_des_gares_du_RER_d%27%C3%8Ele-de-France';
const fileName = 'stations-rer.json';

(async () => {
    const browser = await puppeteer.launch({
        executablePath: '/nix/store/h4w1f11b7bhb3h9kq1kwdxz5csrljrm3-system-path/bin/google-chrome-stable',
        headless: true,
    });
    const page = await browser.newPage();
    await page.goto(url);

    let stationHrefs = await page.evaluate(() => {
        let stationHrefs = []

        let tbody = document.querySelector("#mw-content-text > div.mw-parser-output > table > tbody");

        for (let i = 0; i < tbody.childNodes.length; i++) {
            const tr = tbody.childNodes[i];

            if (tr.childNodes.length > 0) {
                const stationHref = tr.childNodes[1].querySelector('a').href

                stationHrefs.push(stationHref);
            }
        }

        return stationHrefs;
    })

    let stationList = [];

    for (let i = 0; i < stationHrefs.length; i++) {
        const href = stationHrefs[i];

        console.log("Scraping station", href);

        const stationPage = await browser.newPage();
        await stationPage.goto(href);

        let station = await stationPage.evaluate(() => {
            let stationName = document.querySelector("#mw-content-text > div.mw-parser-output > table.infobox_v2 > tbody > tr:nth-child(1) > td").innerText;
            let stationCoordinatesText = document.querySelector("#coordinates > a").innerText;

            let stationCoordinates = stationCoordinatesText.split(',');
            for (let i = 0; i < stationCoordinates.length; i++) {
                let str = stationCoordinates[i];
                str = str.replace('°', '.')
                str = str.replace(/([′″a-z])/g, '')
                str = str.replace(/\s/g, '')

                let f = parseFloat(str) * 10000;

                let s = parseInt(f % 100);
                f = parseInt(f / 100);
                let m = parseInt(f % 100);
                f = parseInt(f / 100);

                console.log(f, m, s);

                f += m / 60;
                f += s / 3600;

                stationCoordinates[i] = f.toString();
            }

            return {
                stationName,
                coordinates: {
                    lat: stationCoordinates[0],
                    long: stationCoordinates[1]
                },
            }
        })

        console.log(station);

        stationList.push(station);

        await stationPage.close();
    }

    fs.writeFileSync(fileName, JSON.stringify(stationList));

    await page.close();
    await browser.close();
})();