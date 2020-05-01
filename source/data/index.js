const proxyChecker = require('./proxy-checker/index.js');
const fs = require('fs');
const request = require('request');
let out = {};
let geoip = require("geoip-country");

const download = (url, dest, cb) => {
    const file = fs.createWriteStream(dest);
    const sendReq = request.get(url);

    // verify response code
    sendReq.on('response', (response) => {
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }

        sendReq.pipe(file);
    });

    // close() is async, call cb after close completes
    file.on('finish', () => file.close(cb));

    // check for request errors
    sendReq.on('error', (err) => {
        fs.unlink(dest);
        return cb(err.message);
    });

    file.on('error', (err) => { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        return cb(err.message);
    });
};


const check = (item, resolve) => {

    try {
        if (!item) {
            resolve();
            return;
        }
        proxyChecker.checkProxy(
            item.split(':')[0],
            item.split(':')[1],
            {
                // the complete URL to check the proxy
                url: 'https://www.example.com',
                // an optional regex to check for the presence of some text on the page
                regex: /Example Domain/
            },
            // Callback function to be called after the check
            function (host, port, ok, statusCode, err, body) {
                // console.log(host + ':' + port + ' => '+ ok + ' (status: ' + statusCode + ', err: ' + err + ' body: ' + body + ')');
                if (body) {
                    try {
                        let info = JSON.parse(body);
                        if (!out[info.country]) {
                            out[info.country] = [];
                        }
                        out[info.country].push({
                            schema: "HTTP",
                            ip: host,
                            port: port,
                        });
                    } catch (e) {
                    }
                }
                console.log(host);
                resolve();
            }
        );
    } catch (error) {
        console.log(error);
        resolve();
    }
}

module.exports.start = async function () {
    await new Promise((resolve) => {
        download('https://api.proxyscrape.com?request=getproxies&proxytype=http&timeout=1000&country=all&ssl=yes&anonymity=all', './list_proxyscrape.txt', resolve);
    });
    await new Promise((resolve) => {
        download('https://www.proxy-list.download/api/v1/get?type=https&country=RU', './list_p-l_ru.txt', resolve);
    });
    await new Promise((resolve) => {
        download('https://www.proxy-list.download/api/v1/get?type=https&country=US', './list_p-l_us.txt', resolve);
    });
    await new Promise((resolve) => {
        download('https://www.proxy-list.download/api/v1/get?type=https&country=FR', './list_p-l_fr.txt', resolve);
    });
    await new Promise((resolve) => {
        download('https://www.proxy-list.download/api/v1/get?type=https&country=NL', './list_p-l_nl.txt', resolve);
    });
    await new Promise((resolve) => {
        download('https://www.proxy-list.download/api/v1/get?type=https&country=GB', './list_p-l_gb.txt', resolve);
    });
    await new Promise((resolve) => {
        download('https://www.proxy-list.download/api/v1/get?type=https&country=DE', './list_p-l_de.txt', resolve);
    });
    let proxy = [];
    console.log(proxy);
    console.log(typeof proxy);
    console.log(Array.isArray(proxy));
    proxy = proxy.concat(fs.readFileSync('./list_proxyscrape.txt', 'utf8').toString().split("\r\n"));
    proxy = proxy.concat(fs.readFileSync('./list_p-l_us.txt', 'utf8').toString().split("\r\n"));
    proxy = proxy.concat(fs.readFileSync('./list_p-l_fr.txt', 'utf8').toString().split("\r\n"));
    proxy = proxy.concat(fs.readFileSync('./list_p-l_nl.txt', 'utf8').toString().split("\r\n"));
    proxy = proxy.concat(fs.readFileSync('./list_p-l_gb.txt', 'utf8').toString().split("\r\n"));
    proxy = proxy.concat(fs.readFileSync('./list_p-l_de.txt', 'utf8').toString().split("\r\n"));
    proxy = proxy.filter((item, index) => proxy.indexOf(item) === index);
    console.log('find ' + proxy.length + ' proxy');
    const promises = [];
    for (let i = 0; i < proxy.length; i++) {
        if (proxy[i].split(':').length == 2 && !proxy[i].split(':')[1].includes('.')) {
            let geo = geoip.lookup(proxy[i].split(':')[0]) || {
                country: 'UNKNOWN'
            };
            if (geo && geo.country) {
                if (geo.country == 'US'
                    || geo.country == 'FR'
                    || geo.country == 'NL'
                    || geo.country == 'GB'
                    || geo.country == 'DE'
                    || geo.country == 'RU') {
                    // console.log(proxy[i]);
                    promises.push(new Promise(resolve =>
                            check(proxy[i], resolve)
                        // {
                        //   setTimeout(()=> {return resolve()}, 15000);
                        //   return check(proxy[i], resolve);
                        // }
                    ));
                }
            }
        }
    }
    await Promise.all(promises);
    let outComplete = {
        locations: [
            {
                "country_code": "US",
                "country_name": "United States",
                "nodes": []
            },
            {
                "country_code": "FR",
                "country_name": "France",
                "nodes": []
            },
            {
                country_code: "NL",
                country_name: "Netherlands",
                "nodes": []
            },
            {
                country_code: "RU",
                country_name: "Russian Federation",
                "nodes": []
            },
            {
                country_code: "GB",
                country_name: "United Kingdom",
                "nodes": []
            },
            {
                country_code: "DE",
                country_name: "Germany",
                "nodes": []
            },
        ]
    }
    await asyncForEach(Object.keys(out), async cntr => {
        const ind = outComplete.locations.findIndex(itm => itm.country_code == cntr);
        if (ind > -1) {
            outComplete.locations[ind].nodes = out[cntr];
        }
    })
    fs.writeFileSync('./out.json', JSON.stringify(outComplete), 'utf8');
    fs.writeFileSync('./out_all.json', JSON.stringify(out), 'utf8');
}


async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
