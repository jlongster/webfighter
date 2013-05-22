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
    // Send the JSON blob containing all the information about the
    // available items to the client, to be displayed to the user
    res.send(JSON.stringify(store));
});

app.post('/sign-jwt', function(req, res) {
    // The client code calls this to get a signed JWT object
    // representing a purchase of a specific item

    var name = req.body.name;
    var type = req.body.type;

    if(store[type][name]) {
        var item = store[type][name];
        var token = 'o' + Math.floor(Math.random() * 1000000);

        // Use the mozpay modue to create the JWT object
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

        // Keep track of which JWT objects we are waiting on
        purchaseQueue[token] = 'processing';

        // Send it back to the client which will be posted to the mozPay API
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
    // This is called every second by the client when it is waiting
    // for a payment response. When we hear back from the payment
    // server, the purchase is marked "success" (or "failure")

    var token = req.query['token'];
    var status = purchaseQueue[token];

    if(status != 'processing') {
        delete purchaseQueue[token];
    }

    res.send(status || 'notfound');
});

// These two events hook into the mozpay module and are fired when we
// hear back from the external payment server

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
