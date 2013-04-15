var http = require('http');
var express = require('express');
var WebSocketServer = require('ws').Server;
var pay = require('mozpay');

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
var server = http.createServer(app);
var socketServer = new WebSocketServer({ server: server });

app.configure(function() {
    app.use(express.static(__dirname + '/www'));
    app.use(express.bodyParser());
});

pay.on('postback', function(data) {
    var req = data.request;
    var socket = sockets[req.productData];

    socket.send(JSON.stringify({
        name: 'purchased',
        productId: req.id
    }));
});

pay.on('chargeback', function(data) {

});

var sockets = [];

socketServer.on('connection', function(socket) {
    console.log('connected');
    socket.id = sockets.length;
    sockets.push(socket);

    socket.on('message', function(msg) {
        msg = JSON.parse(msg);
        console.log(msg);

        switch(msg.name) {
        case 'sign-jwt':
            var jwt = pay.request({
                id: 'red-ship',
                name: 'webfighter',
                description: 'a fighter game',
                pricePoint: 1,
                productData: socket.id,
                postbackURL: 'http://jlongster.com:7890/mozpay/postback',
                chargebackURL: 'http://jlongster.com:7890/mozpay/chargeback',
                simulate: { 'result': 'postback' }
            });
            
            socket.send(JSON.stringify({
                name: 'signed-jwt',
                jwt: jwt
            }));

            break;
        default:
        }
    });
});

pay.routes(app);
server.listen(4000);
