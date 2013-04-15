var events = require('events');
var util = require('util');

var jwt = require('jwt-simple');

var config;
var configDefaults = {
  mozPayAudience: 'marketplace.firefox.com',
  mozPayType: 'mozilla/payments/pay/v1',
  mozPayRoutePrefix: '/mozpay'
};


/*
 * Set up custom events. Possible events:
 *
 * pay.on('postback', function(notice) {
 *   // process a validated payment notice.
 * });
 *
 * pay.on('chargeback', function(notice) {
 *   // process a validated chargeback notice.
 * });
 *
 */
function Pay() {}
util.inherits(Pay, events.EventEmitter);

var pay = new Pay();
module.exports = pay;


/**
 * Configure global settings.
 *
 * @param {Object} settings
 * @api public
 */
pay.configure = function(options) {
  config = options;
  for (var k in configDefaults) {
    if (!config[k]) {
      config[k] = configDefaults[k];
    }
  }
  if (!config.mozPayKey || !config.mozPaySecret) {
    throw new Error('Required mozPayKey or mozPaySecret are missing from config');
  }
  return config;
};

pay._resetConfig = function() {
  config = undefined;
};


/**
 * Encode a JWT payment request.
 *
 * @param {Object} request
 * @api public
 */
pay.request = function(request) {
  _requireConfig();
  return jwt.encode(pay.issueRequest(request), config.mozPaySecret, 'HS256');
};


/**
 * Verify an incoming JWT payment notice.
 *
 * @param {String} encoded JWT
 * @api public
 */
pay.verify = function(foreignJwt) {
  return jwt.decode(foreignJwt, config.mozPaySecret);
};


/**
 * Add routes to an express app object.
 *
 * @param {Object} express app object
 * @param {Object} settings to pass into configure()
 * @api public
 */
pay.routes = function(app, options) {
  if (options)
    pay.configure(options);
  _requireConfig();

  var prefix = config.mozPayRoutePrefix;
  if (prefix && prefix.slice(-1) == '/') {
    prefix = prefix.slice(0, -1);
  }
  if (!prefix)
    throw new Error('config.mozPayRoutePrefix cannot be blank');

  function handle(req, res, onData) {
    var data;

    var notice = req.param('notice');
    if (!notice) {
      res.send(400);
      return;
    }

    try {
      data = jwt.decode(notice, config.mozPaySecret);
    } catch (er) {
      console.log('Ignoring JWT: ' + er.toString());
      res.send(400);
      return;
    }

    try {
      pay.validateClaims(data);
    } catch (er) {
      console.log('JWT claims are not valid: ' + er.toString());
      res.send(400);
      return;
    }

    if (!data.request) {
      console.log('JWT request is empty: ' + data.request);
      res.send(400);
      return;
    }
    try {
      var tID = data.response.transactionID;
    } catch (er) {
      console.log('Unexpected JWT object: ' + er.toString());
      res.send(400);
      return;
    }
    if (!tID) {
      console.log('transactionID is empty: ' + tID);
      res.send(400);
      return;
    }
    res.send(tID);
    onData(data);
  }

  app.post(prefix + '/postback', function(req, res) {
    handle(req, res, function(data) {
      pay.emit('postback', data);
    });
  });

  app.post(prefix + '/chargeback', function(req, res) {
    handle(req, res, function(data) {
      pay.emit('chargeback', data);
    });
  });

};


/**
 * Issue a JWT object (i.e. not encoded) for a payment request.
 *
 * @param {Object} request
 * @api public
 */
pay.issueRequest = function(request) {
  _requireConfig();
  return {iss: config.mozPayKey,
          aud: config.mozPayAudience,
          typ: config.mozPayType,
          iat: pay.now(),
          exp: pay.now() + 3600,  // in 1hr
          request: request};
};


/*
 * Validate the JWT iat/exp/nbf claims.
 * */
pay.validateClaims = function(data) {
  var now = pay.now();
  if (!data.exp || !data.iat) {
    throw new Error('JWT is missing the iat or exp claim properties');
  }
  if (+data.exp < now) {
    throw new Error('JWT from iss ' + data.iss + ' expired: ' + data.exp + ' < ' + now);
  }
  if (data.nbf) {
    // Honor the optional nbf (not before) timestamp.
    if (+data.nbf > (now + 120)) {  // pad for clock skew
      throw new Error('JWT from iss ' + data.iss + ' cannot be processed: nbf=' + data.nbf + ' > ' + now);
    }
  }
}


/*
 * Return current UTC unix timestamp.
 * */
pay.now = function() {
  return Math.round(Date.now() / 1000);
}


function _requireConfig() {
  if (!config)
    throw new Error('configure() must be called before anything else.');
}
