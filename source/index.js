const proxyScrape = require('./data/proxyscrape.js');
const express = require('express');
const fs = require('fs');
const app = express();


proxyScrape.start()
    .then(res => console.log(res))
    .catch(err => console.log(err));
//
setInterval(() => {
    proxyScrape.start()
        .then(res => console.log(res))
        .catch(err => console.log(err));
}, 1000 * 60 * 60 * 5);
app.get('/getProxies', function (req, res) {
    let json = JSON.parse(fs.readFileSync('./config.json', 'utf8').toString());
    res.send(json);
});
app.get('/nearest', function (req, res) {
    if (req.param('lon') && req.param('lat')) {
        let lon = req.param('lon');
        let lat = req.param('lat');

        res.send('ближайший ' + lon + ' ' + lat);
    }
    res.send('no parameters lon and lat')
});
app.get('/fastest', function (req, res) {
    if (req.param('country')) {
        let country = req.param('country').toUpperCase();
        let json = JSON.parse(fs.readFileSync('./config.json', 'utf8').toString());
        let locations = json.locations;
        let neededCountry = locations.filter(el => el.country_code == country)[0];
        sortByTimeCheck(neededCountry.nodes);
        res.send(neededCountry);
    } else {
        res.send('proxy for this country not found')
    }
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});


function sortByTimeCheck(arr) {
    arr.sort((a, b) => a.timeSpentСhecking > b.timeSpentСhecking ? 1 : -1);
}


