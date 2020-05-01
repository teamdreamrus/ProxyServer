const fs = require('fs');
const request = require('request');
const ProxyVerifier = require('proxy-verifier');
const geoip = require('geoip-lite');

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


LetsGo()
    .then(res => console.log(res))
    .catch(err => console.log(err));

async function LetsGo() {
    await new Promise((resolve) => {
        download('https://api.proxyscrape.com?request=getproxies&proxytype=http&timeout=10000&country=all&ssl=all&anonymity=all', './list_proxyscrape.txt', resolve);
    });
    await new Promise((resolve) => {
        download('https://www.proxy-list.download/api/v1/get?type=http&country=RU', './list_p-l_ru.txt', resolve);
    });
    await new Promise((resolve) => {
        download('https://www.proxy-list.download/api/v1/get?type=http&country=US', './list_p-l_us.txt', resolve);
    });
    await new Promise((resolve) => {
        download('https://www.proxy-list.download/api/v1/get?type=http&country=FR', './list_p-l_fr.txt', resolve);
    });
    await new Promise((resolve) => {
        download('https://www.proxy-list.download/api/v1/get?type=http&country=NL', './list_p-l_nl.txt', resolve);
    });
    await new Promise((resolve) => {
        download('https://www.proxy-list.download/api/v1/get?type=http&country=GB', './list_p-l_gb.txt', resolve);
    });
    await new Promise((resolve) => {
        download('https://www.proxy-list.download/api/v1/get?type=http&country=DE', './list_p-l_de.txt', resolve);
    });

    let proxies = [];
    proxies = proxies.concat(fs.readFileSync('./list_proxyscrape.txt', 'utf8').toString().split("\r\n"));
    proxies = proxies.concat(fs.readFileSync('./list_p-l_ru.txt', 'utf8').toString().split("\r\n"));
    proxies = proxies.concat(fs.readFileSync('./list_p-l_us.txt', 'utf8').toString().split("\r\n"));
    proxies = proxies.concat(fs.readFileSync('./list_p-l_fr.txt', 'utf8').toString().split("\r\n"));
    proxies = proxies.concat(fs.readFileSync('./list_p-l_nl.txt', 'utf8').toString().split("\r\n"));
    proxies = proxies.concat(fs.readFileSync('./list_p-l_gb.txt', 'utf8').toString().split("\r\n"));
    proxies = proxies.concat(fs.readFileSync('./list_p-l_de.txt', 'utf8').toString().split("\r\n"));
    proxies = proxies.filter((item, index) => proxies.indexOf(item) === index);
    console.log('find ' + proxies.length + ' proxy');
    let proxiesResultOk = [];
    const promises = [];
    proxies.forEach((el) => {
        if (el.split(':').length === 2 && !el.split(':')[1].includes('.')) {
            let proxy = {
                ip: el.split(':')[0],
                port: el.split(':')[1],
                protocol: 'http'
            };
            let timeSpeed = new Date();

            promises.push(new Promise((resolve, reject) => ProxyVerifier.testProtocol(proxy, {}, function (error, result) {
                if (error) {
                    reject();
                } else {
                    // console.log(result);
                    if (result.ok) {
                        let geo = geoip.lookup(proxy.ipAddress);
                        if (geo.country) {
                            proxy.country = geo.country || 'UNKNOWN';
                            proxy.timer = new Date() - timeSpeed;
                            proxy.ll = geo.ll || null;
                            proxiesResultOk.push(proxy);
                            resolve();
                        } else {
                            reject();
                        }
                    } else {
                        reject();
                    }
                }
            })));
        }
    });
    await Promise.all(promises);
    console.log('result length: ' + proxiesResultOk.length);
    console.log(proxiesResultOk[proxiesResultOk.length - 1]);


}
