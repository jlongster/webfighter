# mozpay

This is a NodeJS module for processing
[navigator.mozPay()](https://wiki.mozilla.org/WebAPI/WebPayment) payments on a
server.

You'll need to obtain a secret key from a provider such as the
[Firefox Marketplace](https://marketplace.firefox.com/)
but this module should work with any compliant
[provider](https://wiki.mozilla.org/WebAPI/WebPaymentProvider).
Here is a guide to
[setting up payments](https://developer.mozilla.org/en-US/docs/Apps/Publishing/In-app_payments)
with Firefox Marketplace.

The basic payment flow goes like this:

* A user clicks a buy button on your app
* Your app signs a [JSON Web Token (JWT)](http://openid.net/specs/draft-jones-json-web-token-07.html)
  describing the product, the price, and postback/chargeback URLs.
* Your app client fetches the JWT from the server and calls `navigator.mozPay()`
* Your server receives a JWT at its postback or chargeback URL
* If the postback was received and the JWT signature validates against your secret
  key then you can disburse your product.

## Install

    npm install mozpay

## Configuration

The module is intended to be used server side only because you can't expose
your secret key to the client. There are helpers to hook into an
[express](http://expressjs.com/) app but you could probably use other web frameworks too.

Load the module:

    var pay = require('mozpay');

Configure it when your app starts up:

    pay.configure({
      // This is your Application Key from the Firefox Marketplace Devhub.
      mozPayKey: '52ee5d47-9981-40ad-bf6e-bca957f65385',
      // This is your Application Secret from the Firefox Marketplace Devhub.
      mozPaySecret: 'd6338705419ea14328084e0c182603ebec4e52c1c6cbceda4d61ee125f10c0f728c4451a4637e4e960b3293df8bb6ac5',
      // This is the aud (audience) in the JWT. You only need to override this if you want to use a dev server.
      mozPayAudience: 'marketplace.firefox.com',
      // This is an optional prefix to your postback/chargeback URLs.
      // For example, a postback would be available at https://yourapp/mozpay/postback with the default prefix.
      mozPayRoutePrefix: '/mozpay',
      // Set a custom payment type for JWTs. You only need to override this if
      // you're working with a non-default payment provider.
      mozPayType: 'mozilla/payments/pay/v1'
    });

With an [express app object](http://expressjs.com/api.html#express), add your routes:

    var express = require('express');
    var pay = require('mozpay');
    var app = express();

    app.configure(function(){
      // Make sure you turn on the body parser for POST params.
      app.use(express.bodyParser());
    });

    pay.routes(app);

You can test your postback/chargeback URLs with something like this:

    curl -X POST -d notice=JWT http://localhost:3000/mozpay/postback
    curl -X POST -d notice=JWT http://localhost:3000/mozpay/chargeback

If you see a 400 Bad Request response then your app is configured to receive
real JWT requests.

You can combine the configuration and routes setup like this:

    pay.routes(app, {
      mozPayKey: '52ee5d47-9981-40ad-bf6e-bca957f65385',
      mozPaySecret: 'd6338705419ea14328084e0c182603ebec4e52c1c6cbceda4d61ee125f10c0f728c4451a4637e4e960b3293df8bb6ac5',
      // ...
    });

## Events

Here's how to take action when the postback notices are
received. The ``data`` argument to these event handlers are only for valid JWT
notices that pass the signature verification.

    pay.on('postback', function(data) {
      console.log('product ID ' + data.request.id + ' has been purchased');
      console.log('Transaction ID: ' + data.response.transactionID);
    });

    pay.on('chargeback', function(data) {
      console.log('product ID ' + data.request.id + ' failed');
      console.log('reason: ' + data.response.reason);
      console.log('Transaction ID: ' + data.response.transactionID);
    });

The ``data.request`` object is a copy of what you initiated the payment request
with.

## Issuing Payment Requests

When a user clicks the buy button you should fetch a JWT from the server via
Ajax. You can't cache JWTs for too long because they have a short expiration
(generally about an hour).

There is a helper to created a JWT to begin a payment.
On your server create a URL that does something like this:

    var jwt = pay.request({
      id: 'your-unique-product-id',
      name: 'Your Product',
      description: 'A little bit more about the product...',
      pricePoint: 1,  // Consult the Firefox Marketplace price points for details.
                      // This expands to a price/currency at the time of payment.
      productData: 'session_id=xyz',  // You can track whatever you like here.
      // These must be absolute URLs like what you configured above.
      postbackURL: 'http://localhost:3000/mozpay/postback',
      chargebackURL: 'http://localhost:3000/mozpay/chargeback'
    });

In your client-side JavaScript, you can initiate a payment with the JWT like
this:

    var request = navigator.mozPay([jwtFromServer]);
    request.onsuccess = function() {
      console.log('navigator.mozPay() finished');
      // The product has not yet been bought!
      // Poll your server until a valid postback has been received.
      waitForPostback();
    }
    request.onerror = function() {
      console.log('navigator.mozPay() error: ' + this.error.name);
    };

## Developers

Grab the [source](https://github.com/mozilla/mozpay-js):

    git clone git://github.com/mozilla/mozpay-js.git

Install the dependencies:

    cd mozpay-js
    npm install

Here's how to run the tests:

    npm test
