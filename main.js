var http = require('http');
var express = require('express');
var pay = require('mozpay');
var store = require('./store');
var settings = require('./settings');

// This uses the mozpay node module to set up the server-side payment
// handling for us: https://github.com/mozilla/mozpay-js
//
// You can generate payment keys for your app here:
// https://marketplace.firefox.com/developers/in-app-keys/
pay.configure({
    mozPayKey: settings.payKey,
    mozPaySecret: settings.paySecret,
    mozPayAudience: 'marketplace.firefox.com',

    // This is an optional prefix to your postback/chargeback URLs.
    // For example, a postback would be available at https://yourapp/mozpay/postback with the default prefix.
    mozPayRoutePrefix: '/mozpay',

    // Set a custom payment type for JWTs. You only need to override this if
    // you're working with a non-default payment provider.
    mozPayType: 'mozilla/payments/pay/v1'
});

var app = express();

app.configure(function() {
    app.use(express.static(__dirname + '/www'));
    app.use(express.bodyParser());
});

app.get('/store-items', function(req, res) {
    res.send(JSON.stringify(store));
});

app.post('/sign-jwt', function(req, res) {
    var name = req.body.name;
    var type = req.body.type;

    if(store[type][name]) {
        var item = store[type][name];
        var token = 'o' + Math.floor(Math.random() * 1000000);

        var jwt = pay.request({
            id: name,
            name: name,
            description: item.description,
            pricePoint: 1,
            productData: token,
            postbackURL: settings.url + '/mozpay/postback',
            chargebackURL: settings.url + '/mozpay/chargeback',
            simulate: { 'result': 'postback' }
        });

        purchaseQueue[token] = 'processing';
        res.send(JSON.stringify({
            jwt: jwt,
            token: token
        }));
    }
    else {
        res.send(500, { error: 'bad product' });
    }
});

app.get('/purchaseQueue', function(req, res) {
    var token = req.query['token'];
    var status = purchaseQueue[token];

    console.log(status);

    if(status != 'processing') {
        delete purchaseQueue[token];
    }

    res.send(status || 'notfound');
});

var purchaseQueue = [];
pay.on('postback', function(data) {
    var req = data.request;
    purchaseQueue[req.productData] = 'success';
});

pay.on('chargeback', function(data) {
    var req = data.request;
    console.log(req);
    purchaseQueue[req.productData] = 'failure';
});

pay.routes(app);
app.listen(settings.port);
