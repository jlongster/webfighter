var http = require('http');
var express = require('express');
var WebSocketServer = require('ws').Server;
var pay = require('mozpay');
var store = require('./store');

pay.configure({
    mozPayKey: '8e65b214-2370-461e-929b-7ed32403fd53',
    mozPaySecret: 'b3cf30622452594edbb66f8398586fcd8b8f7de3a0d96e837f262a93bd4d60c29b5b8ba485ec0be00365bc4812e63438',
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
    console.log('purchasing ' + name);

    if(store[name]) {
        var item = store[name];
        var token = 'FOO';

        var jwt = pay.request({
            id: item.name,
            name: item.name,
            description: item.description,
            pricePoint: 1,
            productData: token,
            postbackURL: 'http://jlongster.com:7890/mozpay/postback',
            chargebackURL: 'http://jlongster.com:7890/mozpay/chargeback',
            simulate: { 'result': 'postback' }
        });

        purchaseQueue[token] = 'processing';
        res.send(JSON.stringify(jwt));
    }
    else {
        res.send(500, { error: 'bad product' });
    }
});

app.get('/purchaseQueue', function(req, res) {
    var token = req.query['token'];
    res.send(purchaseQueue['token'] || 'notfound');
});

var purchaseQueue = [];
pay.on('postback', function(data) {
    var req = data.request;
    purchaseQueue[req.productData] = 'success';
});

pay.on('chargeback', function(data) {
    var req = data.request;
    purchaseQueue[req.productData] = 'failure';    
});

pay.routes(app);
app.listen(4000);
