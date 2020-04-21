// const axios = require('axios');
// const request = require('request');
// const arrayResults = [];
//
//
// //
// axios.get('https://www.proxy-list.download/api/v1/get?type=http')
//     .then(response => {
//         arrayResults.push(...response.data.split('\n'))
//         splitting();
//     })
//     .catch(error => {
//         console.log(error);
//     });
// function splitting() {
//     arrayResults.map(el => {
//        let splitEl = el.split(':');
//        return {ip: splitEl[0], port: splitEl[1]}
//     });
//     arrayResults.forEach(el => check(el));
//
// }

//
// function check(el) {
// let proxy = {
//     ipAddress: el.ip,
//     port: +el.port,
//     protocol: 'http'
// };

//     request.get({
//         url: 'https://www.google.com/',
//         proxy: el.ip+':'+el.port
//     }, (err, res) => {
//         if (err) {
//             console.log('ERROR', err.code);
//         } else {
//             console.log('OK', res);
//         }
//     });
//
// }


// const options = {
//     timeout: 60000,
//     maxResponse: 3000,
//     check: {
//         anonymityLevel: false,
//         protocols: true,
//         tunneling: true,
//     },
//     /* proxy-lists config follows*/
//     series: false,
//     protocols: ['https'],
// };
// f(options);
//
// async function f(options) {
//     const proxySource = new ProxySourceMain.ProxySource(options);
//     await proxySource.initialize();
//
//     const proxy = await proxySource.get();
//
// }
//


const ProxyVerifier = require('proxy-verifier');
const ProxyLists = require('proxy-lists');
const geoip = require('geoip-lite');
let proxiesResultOk = [];

// var proxy = {
//     ipAddress: '180.252.181.2',
//     port: 80,
//     protocol: 'http'
// };
//
// ProxyVerifier.testProtocol(proxy, {},function(error, result) {
//
//     if (error) {
//         // Some unusual error occurred.
//     } else {
//         // The result object will contain success/error information.
//         console.log(result);
//     }
// });
// `getProxies` returns an event emitter.
ProxyLists.getProxies({
    // options
})
    .on('data', function (proxies) {
        // Received some proxies.
        // console.log('got some proxies');
        // console.log(proxies);
        proxies.forEach(el => {
            let proxy = {
                ipAddress: el.ipAddress,
                port: +el.port,
                protocol: el.protocols[0]
            };

            if (proxy.ipAddress && proxy.port && proxy.protocol) {
                ProxyVerifier.testProtocol(proxy, {}, function (error, result) {

                    if (error) {
                        // console.log(error.code)
                        // Some unusual error occurred.
                    } else {
                        // The result object will contain success/error information.
                        if (result.ok) {
                            let geo = geoip.lookup(proxy.ipAddress);
                            if (geo.country) {
                                proxy.country = geo.country;
                                proxiesResultOk.push(proxy);
                                // console.log(proxy);
                            }


                            // console.log(proxy);
                        }
                        // console.log(result);

                    }
                });
            }

        })
    })
    .on('error', function (error) {
        // Some error has occurred.
        // console.log('error!', error);
    })
    .once('end', function () {
        // Done getting proxies.
        console.log('end!');
        console.log('results');
        console.log(proxiesResultOk);
        let countries = {
            Russia: 0,
            United_Kingdom: 0,
            USA: 0,
            Netherlands: 0,
            Germany: 0
        };

        proxiesResultOk.forEach(el => {
            switch (el.country) {
                case 'RU': {
                    countries.Russia++;
                    break;
                }
                case 'GB': {
                    countries.United_Kingdom++;
                    break;
                }
                case 'US': {
                    countries.USA++;
                    break;
                }
                case 'NL': {
                    countries.Netherlands++;
                    break;
                }
                case 'DE': {
                    countries.Germany++;
                    break;
                }
                default: {
                    break;
                }
            }
        });
    console.log(countries);
    });
