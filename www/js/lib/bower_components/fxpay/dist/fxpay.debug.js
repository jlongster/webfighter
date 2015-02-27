// This is a minimal bootstrapping script that defines the fxpay
// namespace and allows all other modules to require fxpay attributes.
(function() {
  "use strict";
  if (typeof window.fxpay === "undefined") {
    window.fxpay = {};
  }
  var exports = window.fxpay;
  exports.getattr = function getattr(attr) {
    // Checks that 'any.attribute.foo' exists on the fxpay global
    // and returns the object.
    var parts = attr.split(".");
    var module = window.fxpay;
    var trail = "";
    for (var i = 0; i < parts.length; i++) {
      if (trail) {
        trail += ".";
      }
      trail += parts[i];
      if (!module.hasOwnProperty(parts[i])) {
        throw new Error('The module "' + attr + '" is not ' + "defined on fxpay. First undefined " + 'part: "' + trail + '"');
      }
      module = module[parts[i]];
    }
    return module;
  };
})();

(function() {
  "use strict";
  var exports = fxpay.utils = {};
  exports.defaults = function(object, defaults) {
    object = object || {};
    // Similar to _.defaults except this takes only a single defaults object.
    Object.keys(defaults).forEach(function(key) {
      if (typeof object[key] === "undefined") {
        object[key] = defaults[key];
      }
    });
    return object;
  };
  exports.getSelfOrigin = function(settings) {
    if (!settings) {
      settings = fxpay.getattr("settings");
    }
    if (settings.appSelf) {
      if (!settings.appSelf.origin) {
        throw new Error("app does not have an origin");
      }
      return settings.appSelf.origin;
    } else {
      var win = settings.window;
      if (win.location.origin) {
        return win.location.origin;
      } else {
        return win.location.protocol + "//" + win.location.hostname;
      }
    }
  };
  exports.getUrlOrigin = function(url) {
    var a = document.createElement("a");
    a.href = url;
    return a.origin || a.protocol + "//" + a.host;
  };
  exports.getCenteredCoordinates = function(w, h) {
    // Centering calcs that work on multiple monitors (bug 1122683).
    var x = window.screenX + Math.max(0, Math.floor((window.innerWidth - w) / 2));
    var y = window.screenY + Math.max(0, Math.floor((window.innerHeight - h) / 2));
    return [ x, y ];
  };
  exports.reCenterWindow = function(winRef, w, h) {
    var settings = fxpay.getattr("settings");
    w = w || settings.winWidth;
    h = h || settings.winHeight;
    var xy = exports.getCenteredCoordinates(w, h);
    try {
      // Allow for the chrome as resizeTo args are the external
      // window dimensions not the internal ones.
      w = w + (winRef.outerWidth - winRef.innerWidth);
      h = h + (winRef.outerHeight - winRef.innerHeight);
      settings.log.log("width: ", w, "height:", h);
      winRef.resizeTo(w, h);
      winRef.moveTo(xy[0], xy[1]);
    } catch (e) {
      settings.log.log("We don't have permission to resize this window");
    }
  };
  exports.openWindow = function(options) {
    var settings = fxpay.getattr("settings");
    var defaults = {
      url: "",
      title: "FxPay",
      w: settings.winWidth,
      h: settings.winHeight
    };
    options = exports.defaults(options, defaults);
    var xy = exports.getCenteredCoordinates(options.w, options.h);
    var winOptString = "toolbar=no,location=yes,directories=no," + "menubar=no,scrollbars=yes,resizable=no,copyhistory=no," + "width=" + options.w + ",height=" + options.h + ",top=" + xy[1] + ",left=" + xy[0];
    var windowRef = settings.window.open(options.url, options.title, winOptString);
    if (!windowRef) {
      settings.log.error("window.open() failed. URL:", options.url);
    }
    return windowRef;
  };
  exports.getAppSelf = function getAppSelf(callback) {
    var settings = fxpay.getattr("settings");
    function storeAppSelf(appSelf) {
      if (appSelf === null) {
        throw new Error("cannot store a null appSelf");
      }
      settings.appSelf = appSelf;
      return appSelf;
    }
    if (settings.appSelf !== null) {
      // This means getAppSelf() has already run successfully so let's
      // return the value immediately.
      return callback(null, settings.appSelf);
    }
    if (!settings.mozApps) {
      settings.log.info("web platform does not define mozApps, cannot get appSelf");
      return callback(null, storeAppSelf(false));
    }
    var appRequest = settings.mozApps.getSelf();
    appRequest.onsuccess = function() {
      var appSelf = this.result;
      // In the case where we're in a Firefox that supports mozApps but
      // we're not running as an app, this could be falsey.
      settings.log.info("got appSelf from mozApps.getSelf()");
      callback(null, storeAppSelf(appSelf || false));
    };
    appRequest.onerror = function() {
      var err = this.error.name;
      settings.log.error("mozApps.getSelf() returned an error", err);
      // We're not caching an appSelf result here.
      // This allows nested functions to report errors better.
      callback(err, settings.appSelf);
    };
  };
})();

(function() {
  "use strict";
  var exports = fxpay.settings = {};
  var pkgInfo = {
    version: "0.0.14"
  };
  // this is updated by `grunt bump`
  var defaultSettings = {
    // Public settings.
    //
    // Reject test receipts which are generated by the Marketplace
    // and do not indicate real purchases.
    allowTestReceipts: false,
    apiUrlBase: "https://marketplace.firefox.com",
    apiVersionPrefix: "/api/v1",
    // When truthy, this will override the API object's default.
    apiTimeoutMs: null,
    // When defined, this optional map will override or
    // append values to payProviderUrls.
    extraProviderUrls: null,
    // When true, work with fake products and test receipts.
    // This implies allowTestReceipts=true.
    fakeProducts: false,
    // This object is used for all logging.
    log: window.console || {
      // Shim in a minimal set of the console API.
      debug: function() {},
      error: function() {},
      info: function() {},
      log: function() {},
      warn: function() {}
    },
    // Only these receipt check services are allowed.
    receiptCheckSites: [ "https://receiptcheck.marketplace.firefox.com", "https://marketplace.firefox.com" ],
    // Private settings.
    //
    adapter: null,
    // This will be the App object returned from mozApps.getSelf().
    // On platforms that do not implement mozApps it will be false.
    appSelf: null,
    // True if configuration has been run at least once.
    alreadyConfigured: false,
    // Map of JWT types to payment provider URLs.
    payProviderUrls: {
      "mozilla/payments/pay/v1": "https://marketplace.firefox.com/mozpay/?req={jwt}"
    },
    // Reference window so tests can swap it out with a stub.
    window: window,
    // Width for payment window as a popup.
    winWidth: 276,
    // Height for payment window as a popup.
    winHeight: 384,
    // Relative API URL that accepts a product ID and returns a JWT.
    prepareJwtApiUrl: "/webpay/inapp/prepare/",
    onerror: function(err) {
      throw err;
    },
    oninit: function() {
      exports.log.info("fxpay version:", exports.libVersion);
      exports.log.info("initialization ran successfully");
    },
    onrestore: function(error, info) {
      if (error) {
        exports.log.error("error while restoring product:", info.productId, "message:", error);
      } else {
        exports.log.info("product", info.productId, "was restored from receipt");
      }
    },
    localStorage: window.localStorage || null,
    localStorageKey: "fxpayReceipts",
    // When true, we're running on a broken webRT. See bug 1133963.
    onBrokenWebRT: navigator.mozPay && navigator.userAgent.indexOf("Mobile") === -1,
    mozPay: navigator.mozPay || null,
    mozApps: navigator.mozApps || null,
    libVersion: pkgInfo.version
  };
  exports.configure = function settings_configure(newSettings, opt) {
    //
    // Configure new settings values.
    //
    opt = opt || {};
    // On first run, we always need to reset.
    if (!exports.alreadyConfigured) {
      opt.reset = true;
    }
    // Reset existing configuration.
    if (opt.reset) {
      for (var def in defaultSettings) {
        exports[def] = defaultSettings[def];
      }
    }
    // Merge new values into existing configuration.
    for (var param in newSettings) {
      if (typeof exports[param] === "undefined") {
        exports.log.error("configure() received an unknown setting:", param);
        return exports.onerror("INCORRECT_USAGE");
      }
      exports[param] = newSettings[param];
    }
    // Set some implied values from other parameters.
    if (exports.extraProviderUrls) {
      exports.log.info("adding extra pay provider URLs", exports.extraProviderUrls);
      for (var paySpec in exports.extraProviderUrls) {
        exports.payProviderUrls[paySpec] = exports.extraProviderUrls[paySpec];
      }
    }
    if (exports.fakeProducts) {
      exports.allowTestReceipts = true;
    }
    // Construct our in-app payments adapter.
    var DefaultAdapter = fxpay.getattr("adapter").FxInappAdapter;
    if (!exports.adapter) {
      exports.log.info("creating default adapter");
      exports.adapter = new DefaultAdapter();
    }
    // Configure the new adapter or re-configure an existing adapter.
    exports.adapter.configure(exports);
    exports.log.info("using adapter:", exports.adapter.toString());
    exports.log.info("(re)configuration completed; fxpay version:", exports.libVersion);
    exports.alreadyConfigured = true;
    return exports;
  };
  exports.initialize = function(newSettings) {
    //
    // A hook to ensure that settings have been initialized.
    // Any public fxpay method that a user may call should call
    // this at the top. It can be called repeatedly without harm.
    //
    // When a newSettings object is defined, all settings will be
    // reconfigured with those values.
    //
    if (typeof newSettings === "object" && newSettings) {
      exports.configure(newSettings);
    } else if (!exports.alreadyConfigured) {
      exports.configure();
    }
  };
})();

(function() {
  "use strict";
  var exports = fxpay.api = {};
  var settings = fxpay.getattr("settings");
  function API(baseUrl, opt) {
    opt = opt || {};
    this.baseUrl = baseUrl;
    this.log = settings.log;
    this.timeoutMs = settings.apiTimeoutMs || 1e4;
    this.versionPrefix = settings.apiVersionPrefix || undefined;
  }
  exports.API = API;
  API.prototype.url = function(path, opt) {
    opt = opt || {};
    opt.versioned = typeof opt.versioned !== "undefined" ? opt.versioned : true;
    var url = this.baseUrl;
    if (opt.versioned) {
      url += this.versionPrefix || "";
    }
    url += path;
    return url;
  };
  API.prototype.request = function(method, path, data, cb, opt) {
    opt = opt || {};
    var defaultCType = data ? "application/x-www-form-urlencoded" : null;
    opt.contentType = opt.contentType || defaultCType;
    var defaultHeaders = {
      Accept: "application/json"
    };
    if (opt.contentType) {
      defaultHeaders["Content-Type"] = opt.contentType;
    }
    opt.headers = opt.headers || {};
    for (var h in defaultHeaders) {
      if (!(h in opt.headers)) {
        opt.headers[h] = defaultHeaders[h];
      }
    }
    opt.headers["x-fxpay-version"] = settings.libVersion;
    var log = this.log;
    var api = this;
    var url;
    if (!cb) {
      cb = function(err, data) {
        if (err) {
          throw err;
        }
        log.info("default callback received data:", data);
      };
    }
    if (/^http(s)?:\/\/.*/.test(path)) {
      // Requesting an absolute URL so no need to prefix it.
      url = path;
    } else {
      url = this.url(path);
    }
    var xhr = new XMLHttpRequest();
    // This doesn't seem to be supported by sinon yet.
    //xhr.responseType = "json";
    var events = {
      abort: function() {
        log.error("xhr abort: path:", path);
        cb("API_REQUEST_ABORTED");
      },
      error: function(evt) {
        log.error("xhr error: ", evt, "path:", path);
        cb("API_REQUEST_ERROR");
      },
      load: function() {
        var data;
        if (this.status.toString().slice(0, 1) !== "2") {
          // TODO: handle status === 0 ?
          // TODO: handle redirects.
          var code = "BAD_API_RESPONSE";
          log.error(code, "status:", this.status, "for URL:", url);
          log.debug(code, "response:", this.responseText);
          return cb("BAD_API_RESPONSE");
        }
        log.debug("xhr load: GOT", this.responseText);
        try {
          // TODO: be smarter about content-types here.
          data = JSON.parse(this.responseText);
        } catch (parseErr) {
          var code = "BAD_JSON_RESPONSE";
          log.error(code, "for URL:", url, "exception", parseErr, "response:", this.responseText);
          return cb(code);
        }
        cb(null, data);
      },
      timeout: function() {
        log.error("xhr request to", url, "timed out after", api.timeoutMs, "ms");
        cb("API_REQUEST_TIMEOUT");
      }
    };
    for (var k in events) {
      xhr.addEventListener(k, events[k], false);
    }
    log.debug("opening", method, "to", url);
    xhr.open(method, url, true);
    // Has to be after xhr.open to avoid
    // invalidStateError in IE.
    xhr.timeout = api.timeoutMs;
    for (var hdr in opt.headers) {
      xhr.setRequestHeader(hdr, opt.headers[hdr]);
    }
    if (opt.contentType === "application/x-www-form-urlencoded" && data) {
      data = serialize(data);
    }
    xhr.send(data);
  };
  API.prototype.get = function(path, cb, opt) {
    this.request("GET", path, null, cb, opt);
  };
  API.prototype.del = function(path, cb, opt) {
    this.request("DELETE", path, null, cb, opt);
  };
  API.prototype.post = function(path, data, cb, opt) {
    this.request("POST", path, data, cb, opt);
  };
  API.prototype.put = function(path, data, cb, opt) {
    this.request("PUT", path, data, cb, opt);
  };
  function serialize(obj) {
    // {"foo": "bar", "baz": "zup"} -> "foo=bar&baz=zup"
    var str = [];
    for (var p in obj) {
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    }
    return str.join("&");
  }
})();

(function() {
  "use strict";
  // This is a very minimal JWT utility. It does not validate signatures.
  var exports = fxpay.jwt = {};
  var settings = fxpay.getattr("settings");
  exports.decode = function jwt_decode(jwt, callback) {
    var parts = jwt.split(".");
    if (parts.length !== 3) {
      settings.log.error("JWT does not have 3 segments:", jwt);
      return callback("WRONG_JWT_SEGMENT_COUNT");
    }
    var jwtData = parts[1];
    // Normalize URL safe base64 into regular base64.
    jwtData = jwtData.replace("-", "+", "g").replace("_", "/", "g");
    var jwtString;
    try {
      jwtString = atob(jwtData);
    } catch (error) {
      settings.log.error("atob() error:", error.toString(), "when decoding JWT", jwtData);
      return callback("INVALID_JWT_DATA");
    }
    var data;
    try {
      data = JSON.parse(jwtString);
    } catch (error) {
      settings.log.error("JSON.parse() error:", error.toString(), "when parsing", jwtString);
      return callback("INVALID_JWT_DATA");
    }
    callback(null, data);
  };
  exports.getPayUrl = function jwt_getPayUrl(encodedJwt, callback) {
    exports.decode(encodedJwt, function(err, jwtData) {
      if (err) {
        return callback(err);
      }
      var payUrl = settings.payProviderUrls[jwtData.typ];
      if (!payUrl) {
        settings.log.error("JWT type", jwtData.typ, "does not map to any known payment providers");
        return callback("UNEXPECTED_JWT_TYPE");
      }
      if (payUrl.indexOf("{jwt}") === -1) {
        settings.log.error("JWT type", jwtData.typ, "pay URL is formatted incorrectly:", payUrl);
        return callback("INVALID_PAY_PROVIDER_URL");
      }
      payUrl = payUrl.replace("{jwt}", encodedJwt);
      settings.log.info("JWT", jwtData.typ, "resulted in pay URL:", payUrl);
      callback(null, payUrl);
    });
  };
})();

(function() {
  "use strict";
  var exports = fxpay.pay = {};
  var jwt = fxpay.getattr("jwt");
  var settings = fxpay.getattr("settings");
  var utils = fxpay.getattr("utils");
  var timer;
  exports.processPayment = function pay_processPayment(jwt, callback, opt) {
    opt = utils.defaults(opt, {
      managePaymentWindow: true,
      paymentWindow: undefined
    });
    if (settings.mozPay) {
      settings.log.info("processing payment with mozPay using jwt", jwt);
      var payReq = settings.mozPay([ jwt ]);
      payReq.onerror = function mozPay_onerror() {
        settings.log.error("mozPay: received onerror():", this.error.name);
        if (settings.onBrokenWebRT && this.error.name === "USER_CANCELLED") {
          // This is a workaround for bug 1133963.
          settings.log.warn("webRT: pretending the cancel message is actually a success!");
          callback();
        } else {
          callback(this.error.name);
        }
      };
      payReq.onsuccess = function mozPay_onsuccess() {
        settings.log.debug("mozPay: received onsuccess()");
        callback();
      };
    } else {
      if (!opt.paymentWindow) {
        settings.log.error("Cannot start a web payment without a " + "reference to the payment window");
        return callback("MISSING_PAYMENT_WINDOW");
      }
      settings.log.info("processing payment with web flow");
      return processWebPayment(opt.paymentWindow, opt.managePaymentWindow, jwt, callback);
    }
  };
  exports.acceptPayMessage = function pay_acceptPayMessage(event, allowedOrigin, paymentWindow, callback) {
    settings.log.debug("received", event.data, "from", event.origin);
    if (event.origin !== allowedOrigin) {
      settings.log.debug("ignoring message from foreign window at", event.origin);
      return callback("UNKNOWN_MESSAGE_ORIGIN");
    }
    var eventData = event.data || {};
    if (eventData.status === "unloaded") {
      // Look for the window having been closed.
      if (timer) {
        window.clearTimeout(timer);
      }
      // This delay is introduced so that the closed property
      // of the window has time to be updated.
      timer = window.setTimeout(function() {
        if (!paymentWindow || paymentWindow.closed === true) {
          settings.log.info("Window closed by user.");
          return callback("DIALOG_CLOSED_BY_USER");
        }
      }, 300);
    } else if (eventData.status === "ok") {
      settings.log.info("received pay success message from window at", event.origin);
      return callback();
    } else if (eventData.status === "failed") {
      settings.log.info("received pay fail message with status", eventData.status, "code", eventData.errorCode, "from window at", event.origin);
      return callback(eventData.errorCode || "PAY_WINDOW_FAIL_MESSAGE");
    } else {
      settings.log.info("received pay message with unknown status", eventData.status, "from window at", event.origin);
      return callback("UNKNOWN_MESSAGE_STATUS");
    }
  };
  function processWebPayment(paymentWindow, managePaymentWindow, payJwt, callback) {
    jwt.getPayUrl(payJwt, function(err, payUrl) {
      if (err) {
        return callback(err);
      }
      // Now that we've extracted a payment URL from the JWT,
      // load it into the freshly created popup window.
      paymentWindow.location = payUrl;
      // This interval covers closure of the popup
      // whilst on external domains that won't postMessage
      // onunload.
      var popupInterval = setInterval(function() {
        if (!paymentWindow || paymentWindow.closed) {
          clearInterval(popupInterval);
          return callback("DIALOG_CLOSED_BY_USER");
        }
      }, 500);
      function receivePaymentMessage(event) {
        function messageCallback(err) {
          if (err === "UNKNOWN_MESSAGE_ORIGIN") {
            // These could come from anywhere so ignore them.
            return;
          }
          // We know if we're getting messages from our UI
          // at this point so we can do away with the
          // interval watching for the popup closing
          // whilst on 3rd party domains.
          if (popupInterval) {
            clearInterval(popupInterval);
          }
          settings.window.removeEventListener("message", receivePaymentMessage);
          if (managePaymentWindow) {
            paymentWindow.close();
          } else {
            settings.log.info("payment window should be closed but client " + "is managing it");
          }
          if (err) {
            return callback(err);
          }
          callback();
        }
        exports.acceptPayMessage(event, utils.getUrlOrigin(payUrl), paymentWindow, messageCallback);
      }
      settings.window.addEventListener("message", receivePaymentMessage);
    });
  }
})();

(function() {
  "use strict";
  var exports = fxpay.products = {};
  var settings = fxpay.getattr("settings");
  var utils = fxpay.getattr("utils");
  var API = fxpay.getattr("api").API;
  exports.all = function products_all(onResult) {
    var allProducts = [];
    var api = new API(settings.apiUrlBase);
    var origin = utils.getSelfOrigin();
    if (!origin) {
      return onResult("PAY_PLATFORM_UNAVAILABLE", allProducts);
    }
    origin = encodeURIComponent(origin);
    var url;
    if (settings.fakeProducts) {
      settings.log.warn("about to fetch fake products");
      url = "/payments/stub-in-app-products/";
    } else {
      settings.log.info("about to fetch real products for app", origin);
      url = "/payments/" + origin + "/in-app/?active=1";
    }
    api.get(url, function(err, result) {
      if (err) {
        return onResult(err, allProducts);
      }
      settings.log.info("total products fetched:", result.objects.length);
      for (var i = 0; i < result.objects.length; i++) {
        var ob = result.objects[i];
        var productInfo = expandInfo(ob);
        allProducts.push(productInfo);
      }
      onResult(err, allProducts);
    });
  };
  exports.getById = function products_getById(productId, onFetch, opt) {
    opt = opt || {};
    if (typeof opt.fetchStubs === "undefined") {
      opt.fetchStubs = false;
    }
    if (!opt.api) {
      opt.api = new API(settings.apiUrlBase);
    }
    var origin = encodeURIComponent(utils.getSelfOrigin());
    var url;
    if (opt.fetchStubs) {
      url = "/payments/stub-in-app-products/" + productId.toString() + "/";
    } else {
      url = "/payments/" + origin + "/in-app/" + productId.toString() + "/";
    }
    settings.log.info("fetching product info at URL", url, "fetching stubs?", opt.fetchStubs);
    opt.api.get(url, function(err, productData) {
      if (err) {
        settings.log.error("Error fetching product info", err);
        return onFetch(err, {
          productId: productId
        });
      }
      onFetch(null, expandInfo(productData));
    });
  };
  //
  // private functions:
  //
  function expandInfo(ob) {
    return {
      pricePointId: ob.price_id,
      productId: ob.guid,
      name: ob.name,
      smallImageUrl: ob.logo_url
    };
  }
})();

(function() {
  "use strict";
  var exports = fxpay.receipts = {};
  var API = fxpay.getattr("api").API;
  var products = fxpay.getattr("products");
  var settings = fxpay.getattr("settings");
  var utils = fxpay.getattr("utils");
  exports.all = function receipts_all(callback) {
    utils.getAppSelf(function(error, appSelf) {
      if (error) {
        return callback(error);
      }
      var nativeNum = 0;
      var receipts = [];
      if (appSelf && appSelf.receipts) {
        nativeNum = appSelf.receipts.length;
        receipts = Array.prototype.slice.call(appSelf.receipts);
      }
      var locNum = 0;
      var storedReceipts = settings.localStorage.getItem(settings.localStorageKey);
      if (storedReceipts) {
        storedReceipts = JSON.parse(storedReceipts);
        for (var j = 0; j < storedReceipts.length; j++) {
          if (receipts.indexOf(storedReceipts[j]) === -1) {
            receipts.push(storedReceipts[j]);
            locNum++;
          } else {
            settings.log.info("ignoring dupe receipt fetched from local storage", storedReceipts[j].substring(0, 5));
          }
        }
      }
      settings.log.info("receipts fetched from mozApps:", nativeNum);
      settings.log.info("receipts fetched from localStorage:", locNum);
      callback(null, receipts);
    });
  };
  exports.add = function receipts_add(receipt, onFinish) {
    utils.getAppSelf(function(error, appSelf) {
      if (error) {
        return onFinish(error);
      }
      if (appSelf && appSelf.addReceipt) {
        settings.log.info("adding receipt to device with addReceipt");
        return addReceiptNatively(receipt, onFinish);
      } else {
        settings.log.info("adding receipt to device with localStorage");
        return addReceiptWithLocStor(receipt, onFinish);
      }
    });
  };
  exports.validateAppReceipt = function(receipt, callback) {
    exports.verifyAppData(receipt, function(err, data, productInfo) {
      if (err) {
        return callback(err, productInfo);
      }
      verifyReceiptOnServer(receipt, data, productInfo, function(err, productInfo) {
        if (err) {
          return callback(err, productInfo);
        }
        // Even though it's valid, make sure it's a receipt for our app.
        var selfOrigin = utils.getSelfOrigin();
        if (productInfo.productUrl !== selfOrigin) {
          settings.log.error("valid receipt but wrong product; our origin:", selfOrigin, "; receipt product origin:", productInfo.productUrl);
          return callback("INVALID_RECEIPT_PRODUCT", productInfo);
        }
        callback(null, productInfo);
      });
    });
  };
  exports.validateInAppProductReceipt = function(receipt, onRestore) {
    exports.verifyInAppProductData(receipt, function(err, data, productInfo) {
      if (err) {
        return onRestore(err, productInfo);
      }
      verifyReceiptOnServer(receipt, data, productInfo, function(err, productInfo) {
        if (err) {
          return onRestore(err, productInfo);
        }
        var api = getApiFromReceipt(data);
        products.getById(productInfo.productId, function(err, newProductInfo) {
          productInfo = productInfo || {};
          Object.keys(newProductInfo).forEach(function(attr) {
            productInfo[attr] = newProductInfo[attr];
          });
          if (err) {
            return onRestore(err, productInfo);
          }
          return onRestore(null, productInfo);
        }, {
          // If this is a test receipt, only fetch stub products.
          fetchStubs: data.typ === "test-receipt",
          api: api
        });
      });
    });
  };
  exports.verifyData = function(receipt, onVerify) {
    verifyReceiptJwt(receipt, function(err, data) {
      if (err) {
        return onVerify(err, data, {});
      }
      verifyReceiptStoreData(data, function(err, productInfo) {
        if (err) {
          return onVerify(err, data, productInfo);
        }
        verifyReceiptCheckUrl(data, function(err) {
          if (err) {
            return onVerify(err, data, productInfo);
          }
          onVerify(null, data, productInfo);
        });
      });
    });
  };
  exports.verifyAppData = function(receipt, callback) {
    exports.verifyData(receipt, function(error, data, productInfo) {
      if (error) {
        return callback(error, data, productInfo);
      }
      utils.getAppSelf(function(error, appSelf) {
        if (error) {
          return callback(error, data, productInfo);
        }
        if (!appSelf) {
          return callback("PAY_PLATFORM_UNAVAILABLE", data, productInfo);
        }
        var manifest = appSelf.manifest;
        var allowAny;
        if (!manifest.installs_allowed_from) {
          // This is an unlikely case but let's guess that it implies "*".
          allowAny = true;
        } else {
          allowAny = manifest.installs_allowed_from.indexOf("*") !== -1;
        }
        if (allowAny) {
          settings.log.warn("your paid app manifest specifies " + 'installs_allowed_from = ["*"] which means ' + "an attacker can provide a spoofed receipt " + "validation service");
        }
        if (!allowAny && manifest.installs_allowed_from.indexOf(data.iss) === -1) {
          settings.log.error("receipt issuer", data.iss, "is not an allowed issuer; allowed:", manifest.installs_allowed_from);
          return callback("INVALID_RECEIPT", data, productInfo);
        }
        productInfo.productId = data.product.storedataObject.id;
        if (!productInfo.productId) {
          settings.log.error("Could not find app productId in storedata:", data.product.storedata);
          return callback("INVALID_RECEIPT", data, productInfo);
        }
        callback(null, data, productInfo);
      });
    });
  };
  exports.verifyInAppProductData = function(receipt, callback) {
    exports.verifyData(receipt, function(error, data, productInfo) {
      if (error) {
        return callback(error, data, productInfo);
      }
      productInfo.productId = data.product.storedataObject.inapp_id;
      if (!productInfo.productId) {
        settings.log.error("Could not find in-app productId in storedata:", data.product.storedata);
        return callback("INVALID_RECEIPT", data, productInfo);
      }
      callback(null, data, productInfo);
    });
  };
  exports.checkStoreData = function(receipt) {
    // Return the storedata portion of the receipt without doing any
    // server validation. If the receipt is unparsable, returns null.
    var data = getReceiptData(receipt);
    if (!data) {
      return null;
    }
    return parseStoreData(data);
  };
  //
  // private functions:
  //
  function addReceiptNatively(receipt, onFinish) {
    var receiptReq = settings.appSelf.addReceipt(receipt);
    receiptReq.onsuccess = function() {
      settings.log.info("item fully purchased and receipt installed");
      onFinish(null);
    };
    receiptReq.onerror = function() {
      var err = this.error.name;
      settings.log.error("error calling app.addReceipt", err);
      onFinish(err);
    };
  }
  function addReceiptWithLocStor(receipt, onFinish) {
    var allReceipts = settings.localStorage.getItem(settings.localStorageKey);
    if (allReceipts) {
      allReceipts = JSON.parse(allReceipts);
    } else {
      allReceipts = [];
    }
    if (allReceipts.indexOf(receipt) === -1) {
      allReceipts.push(receipt);
    } else {
      settings.log.info("not adding receipt", receipt.substring(0, 5), "because it has already been added");
    }
    settings.localStorage.setItem(settings.localStorageKey, JSON.stringify(allReceipts));
    onFinish(null);
  }
  function verifyReceiptJwt(receipt, onVerify) {
    var data = getReceiptData(receipt);
    if (!data) {
      return onVerify("INVALID_RECEIPT", {});
    }
    onVerify(null, data);
  }
  function verifyReceiptOnServer(receipt, data, productInfo, callback) {
    settings.log.debug("receipt data:", data);
    var api = getApiFromReceipt(data);
    settings.log.info("about to post to verifier URL", data.verify);
    api.post(data.verify, receipt, function(err, verifyResult) {
      productInfo.receiptInfo = verifyResult;
      if (err) {
        settings.log.error("Error verifying receipt:", err);
        return callback(err, productInfo);
      }
      settings.log.info("verification result:", verifyResult);
      if (verifyResult.status === "ok") {
        settings.log.info("validated receipt for", productInfo);
        return callback(null, productInfo);
      } else {
        settings.log.error("receipt", receipt.substring(0, 10), "is invalid; service returned:", verifyResult.status, verifyResult.reason);
        return callback("INVALID_RECEIPT", productInfo);
      }
    }, {
      contentType: "text/plain"
    });
  }
  function verifyReceiptStoreData(data, onVerify) {
    var productInfo = {};
    if (!data.product) {
      settings.log.error("receipt is missing the product field");
      return onVerify("INVALID_RECEIPT", productInfo);
    }
    if (!data.product.url) {
      settings.log.error("receipt is missing product.url");
      return onVerify("INVALID_RECEIPT", productInfo);
    }
    if (!data.product.storedata) {
      settings.log.error("receipt is missing product.storedata");
      return onVerify("INVALID_RECEIPT", productInfo);
    }
    data.product.storedataObject = parseStoreData(data);
    if (!data.product.storedataObject) {
      return onVerify("INVALID_RECEIPT", productInfo);
    }
    var isTestReceipt = data.typ === "test-receipt";
    if (isTestReceipt && !settings.allowTestReceipts) {
      settings.log.error("cannot restore test receipts when allowTestReceipts " + "is false");
      return onVerify("TEST_RECEIPT_NOT_ALLOWED", productInfo);
    }
    var productUrl = data.product.url;
    if (productUrl && !productUrl.match(/^(http(s)?|app):\/\/.*$/g)) {
      // Assume that un-prefixed product URLs are for packaged apps.
      // TODO: This seems wrong. Remove this when it's fixed in
      // Marketplace receipts: bug 1034264.
      productUrl = "app://" + productUrl;
    }
    productInfo.productUrl = productUrl;
    if (!isTestReceipt) {
      // Make sure the receipt belongs only to this app.
      // In the future, it seems plausible that productUrl would
      // point to a specific path on the server rather than just the
      // origin. Instead of accounting for it, let's wait until that happens.
      var selfOrigin = utils.getSelfOrigin();
      if (productUrl !== selfOrigin) {
        settings.log.error("app origin", selfOrigin, "does not match receipt product URL", productUrl);
        return onVerify("INVALID_RECEIPT", productInfo);
      }
    }
    onVerify(null, productInfo);
  }
  function verifyReceiptCheckUrl(data, onVerify) {
    // Make sure the receipt check URL is in the whitelist so we
    // don't give away free products.
    var urlOk = false;
    var verifyUrl = data.verify || "";
    for (var i = 0; i < settings.receiptCheckSites.length; i++) {
      var domain = settings.receiptCheckSites[i];
      if (verifyUrl.indexOf(domain) === 0) {
        urlOk = true;
        break;
      }
    }
    if (!urlOk) {
      settings.log.error("Receipt check URL", data.verify, "is not whitelisted. Valid choices:", settings.receiptCheckSites);
      return onVerify("INVALID_RECEIPT", data);
    }
    onVerify(null, data);
  }
  function getReceiptData(receipt) {
    var data;
    if (typeof receipt !== "string") {
      settings.log.error("unexpected receipt type:", typeof receipt);
      return null;
    }
    var majorParts = receipt.split("~");
    if (majorParts.length === 1) {
      data = majorParts[0];
    } else if (majorParts.length === 2) {
      // Ignore the preceding json key.
      data = majorParts[1];
    } else {
      settings.log.error("wrong number of tilde separated " + "segments in receipt");
      return null;
    }
    var jwtParts = data.split(".");
    if (jwtParts.length !== 3) {
      settings.log.error("wrong number of JWT segments in receipt:", jwtParts.length);
      return null;
    }
    // Throw away the first and last JWT parts.
    data = jwtParts[1];
    try {
      data = base64urldecode(data);
    } catch (exc) {
      settings.log.error("error base64 decoding receipt:", exc.name, exc.message);
      return null;
    }
    try {
      data = JSON.parse(data);
    } catch (exc) {
      settings.log.error("error parsing receipt JSON:", exc.name, exc.message);
      return null;
    }
    return data;
  }
  function parseStoreData(receiptData) {
    if (!receiptData.product) {
      return null;
    }
    if (typeof receiptData.product.storedata !== "string") {
      settings.log.error("unexpected storedata in receipt:", receiptData.product.storedata);
      return null;
    }
    var params = {};
    receiptData.product.storedata.split("&").forEach(function(pair) {
      var parts = pair.split("=");
      params[parts[0]] = decodeURIComponent(parts[1]);
    });
    return params;
  }
  function getApiFromReceipt(receiptData) {
    // The issuer of the receipt is typically the Marketplace.
    // This is the site we want to use for making API requests.
    var apiUrlBase = receiptData.iss;
    settings.log.info("derived base API URL from receipt:", apiUrlBase);
    return new API(apiUrlBase);
  }
  function base64urldecode(s) {
    s = s.replace(/-/g, "+");
    // 62nd char of encoding
    s = s.replace(/_/g, "/");
    // 63rd char of encoding
    switch (s.length % 4) {
     // Pad with trailing '='s
      case 0:
      break;

     // No pad chars in this case
      case 1:
      s += "===";
      break;

     case 2:
      s += "==";
      break;

     case 3:
      s += "=";
      break;

     default:
      throw "Illegal base64url string!";
    }
    return atob(s);
  }
})();

(function() {
  "use strict";
  var exports = fxpay.adapter = {};
  var API = fxpay.getattr("api").API;
  var products = fxpay.getattr("products");
  var receipts = fxpay.getattr("receipts");
  var utils = fxpay.getattr("utils");
  function FxInappAdapter() {}
  FxInappAdapter.prototype.toString = function() {
    return "<FxInappAdapter at " + (this.api && this.api.baseUrl) + ">";
  };
  FxInappAdapter.prototype.configure = function(settings) {
    //
    // Adds a configuration hook for when settings change.
    //
    // This is called when settings are first intialized
    // and also whenever settings are reconfigured.
    //
    this.settings = settings;
    this.api = new API(settings.apiUrlBase);
    settings.log.info("configuring Firefox Marketplace In-App adapter");
  };
  FxInappAdapter.prototype.init = function(callback) {
    //
    // Initialize the payment system.
    //
    // This is called when the fxpay library itself is initialized.
    // This is a chance to restore purchases or anything that should
    // happen when an app starts up.
    //
    // This must execute callback(error) when finished.
    // The error parameter should be null when there are no errors.
    //
    var settings = this.settings;
    utils.getAppSelf(function(error, appSelf) {
      if (error) {
        return callback(error);
      }
      var platformHasAddReceipt = appSelf && appSelf.addReceipt;
      if (!platformHasAddReceipt && !settings.localStorage) {
        settings.log.error("no way to store receipts on this platform");
        return callback("PAY_PLATFORM_UNAVAILABLE");
      }
      if (appSelf && settings.window.location.href.indexOf("app://") === 0 && !appSelf.manifest.origin) {
        settings.log.error("packaged app did not define an origin so " + "we have no key to look up products");
        return callback("UNDEFINED_APP_ORIGIN");
      }
      receipts.all(function(error, allReceipts) {
        if (error) {
          return callback(error);
        }
        allReceipts.forEach(function(receipt) {
          settings.log.info("Installed receipt:", receipt);
          receipts.validateInAppProductReceipt(receipt, settings.onrestore);
        });
        settings.log.info("Number of receipts installed:", allReceipts.length);
        callback();
      });
    });
  };
  FxInappAdapter.prototype.startTransaction = function(opt, callback) {
    //
    // Start a transaction.
    //
    // The `opt` object contains the following parameters:
    //
    // - productId: the ID of the product purchased.
    //
    // When finished, execute callback(error, transactionData).
    //
    // - error: an error if one occurred or null if not
    // - transactionData: an object that describes the transaction.
    //   This can be specific to your adapter but must include
    //   the `productJWT` parameter which is a JSON Web Token
    //   that can be passed to navigator.mozPay().
    //
    opt = utils.defaults(opt, {
      productId: null
    });
    var settings = this.settings;
    this.api.post(settings.prepareJwtApiUrl, {
      inapp: opt.productId
    }, function(err, productData) {
      if (err) {
        return callback(err);
      }
      settings.log.debug("requested JWT for ", opt.productId, "from API; got:", productData);
      return callback(null, {
        productJWT: productData.webpayJWT,
        productId: opt.productId,
        productData: productData
      });
    });
  };
  FxInappAdapter.prototype.transactionStatus = function(transData, callback) {
    //
    // Get the status of a transaction.
    //
    // The `transData` object received is the same one returned by
    // startTransaction().
    //
    // When finished, execute callback(error, isCompleted, productInfo).
    //
    // - error: an error if one occurred or null if not.
    // - isCompleted: true or false if the transaction has been
    //   completed successfully.
    // - productInfo: an object that describes the product purchased.
    //   If there was an error or the transaction was not completed,
    //   this can be null.
    //   A productInfo object should have the propeties described at:
    //
    //   https://developer.mozilla.org/en-US/Marketplace/Monetization
    //   /In-app_payments_section/fxPay_iap#Product_Info_Object
    //
    var self = this;
    var settings = this.settings;
    var url = self.api.url(transData.productData.contribStatusURL, {
      versioned: false
    });
    self.api.get(url, function(err, data) {
      if (err) {
        return callback(err);
      }
      if (data.status === "complete") {
        self._finishTransaction(data, transData.productId, function(err, productInfo) {
          if (err) {
            return callback(err);
          }
          callback(null, true, productInfo);
        });
      } else if (data.status === "incomplete") {
        return callback(null, false);
      } else {
        settings.log.error("transaction status", data.status, "from", url, "was unexpected");
        return callback("INVALID_TRANSACTION_STATE");
      }
    });
  };
  FxInappAdapter.prototype._finishTransaction = function(data, productId, callback) {
    //
    // Private helper method to finish transactionStatus().
    //
    var settings = this.settings;
    settings.log.info("received completed transaction:", data);
    receipts.add(data.receipt, function(err) {
      if (err) {
        return callback(err);
      }
      products.getById(productId, function(err, fullProductInfo) {
        if (err) {
          return callback(err, fullProductInfo);
        }
        callback(null, fullProductInfo);
      }, {
        // If this is a purchase for fake products, only fetch stub products.
        fetchStubs: settings.fakeProducts
      });
    });
  };
  exports.FxInappAdapter = FxInappAdapter;
})();

(function() {
  "use strict";
  // This object is created by init_module.js
  var exports = window.fxpay;
  var pay = fxpay.getattr("pay");
  var receipts = fxpay.getattr("receipts");
  var settings = fxpay.getattr("settings");
  var products = fxpay.getattr("products");
  var utils = fxpay.getattr("utils");
  //
  // publicly exported functions:
  //
  exports.configure = function() {
    return settings.configure.apply(settings, arguments);
  };
  exports.init = function _init(opt) {
    settings.initialize(opt);
    settings.adapter.init(function(err) {
      if (err) {
        return settings.onerror(err);
      }
      settings.oninit();
    });
  };
  exports.validateAppReceipt = function validateAppReceipt(callback) {
    settings.initialize();
    var defaultProductInfo = {};
    utils.getAppSelf(function(error, appSelf) {
      if (error) {
        return callback(error, defaultProductInfo);
      }
      if (!appSelf) {
        return callback("PAY_PLATFORM_UNAVAILABLE", defaultProductInfo);
      }
      var allAppReceipts = [];
      receipts.all(function(error, allReceipts) {
        if (error) {
          return callback(error, defaultProductInfo);
        }
        allReceipts.forEach(function(receipt) {
          var storedata = receipts.checkStoreData(receipt);
          if (!storedata) {
            settings.log.info("ignoring receipt with missing or unparsable storedata");
            return;
          }
          if (storedata.inapp_id) {
            settings.log.info("ignoring in-app receipt with storedata", storedata);
            return;
          }
          allAppReceipts.push(receipt);
        });
        settings.log.info("app receipts found:", allAppReceipts.length);
        var appReceipt;
        if (allAppReceipts.length === 0) {
          return callback("APP_RECEIPT_MISSING", defaultProductInfo);
        } else if (allAppReceipts.length === 1) {
          appReceipt = allAppReceipts[0];
          settings.log.info("Installed receipt:", appReceipt);
          return receipts.validateAppReceipt(appReceipt, function(error, productInfo) {
            settings.log.info("got verification result for", productInfo);
            callback(error, productInfo);
          });
        } else {
          // TODO: support multiple app stores? bug 1134739.
          // This is an unlikely case where multiple app receipts are installed.
          settings.log.error("multiple app receipts were found which is not yet supported");
          return callback("NOT_IMPLEMENTED_ERROR", defaultProductInfo);
        }
      });
    });
  };
  exports.purchase = function _purchase(productId, onPurchase, opt) {
    settings.initialize();
    opt = utils.defaults(opt, {
      maxTries: undefined,
      managePaymentWindow: undefined,
      paymentWindow: undefined,
      pollIntervalMs: undefined
    });
    if (typeof opt.managePaymentWindow === "undefined") {
      // By default, do not manage the payment window when a custom
      // window is defined. This means the client must close its own window.
      opt.managePaymentWindow = !opt.paymentWindow;
    }
    var partialProdInfo = {
      productId: productId
    };
    if (!onPurchase) {
      onPurchase = function _onPurchase(err, returnedProdInfo) {
        if (err) {
          throw err;
        }
        settings.log.info("product", returnedProdInfo.productId, "purchased");
      };
    }
    settings.log.debug("starting purchase for product", productId);
    if (!settings.mozPay) {
      if (!opt.paymentWindow) {
        // Open a blank payment window on the same event loop tick
        // as the click handler. This avoids popup blockers.
        opt.paymentWindow = utils.openWindow();
      } else {
        settings.log.info("web flow will use client provided payment window");
        utils.reCenterWindow(opt.paymentWindow, settings.winWidth, settings.winHeight);
      }
    }
    function closePayWindow() {
      if (opt.paymentWindow && !opt.paymentWindow.closed) {
        if (opt.managePaymentWindow) {
          opt.paymentWindow.close();
        } else {
          settings.log.info("payment window should be closed but client " + "is managing it");
        }
      }
    }
    settings.adapter.startTransaction({
      productId: productId
    }, function(err, transData) {
      if (err) {
        closePayWindow();
        return onPurchase(err, partialProdInfo);
      }
      pay.processPayment(transData.productJWT, function(err) {
        if (err) {
          closePayWindow();
          return onPurchase(err, partialProdInfo);
        }
        // The payment flow has completed and the window has closed.
        // Wait for payment verification.
        waitForTransaction(transData, function(err, fullProductInfo) {
          onPurchase(err, fullProductInfo || partialProdInfo);
        }, {
          maxTries: opt.maxTries,
          pollIntervalMs: opt.pollIntervalMs
        });
      }, {
        managePaymentWindow: opt.managePaymentWindow,
        paymentWindow: opt.paymentWindow
      });
    });
  };
  exports.getProducts = function getProducts() {
    products.all.apply(products, arguments);
  };
  //
  // private functions:
  //
  // NOTE: if you change this function signature, change the setTimeout below.
  function waitForTransaction(transData, cb, opt) {
    opt = opt || {};
    opt.maxTries = opt.maxTries || 10;
    opt.pollIntervalMs = opt.pollIntervalMs || 1e3;
    opt._tries = opt._tries || 1;
    var log = settings.log;
    log.debug("Getting transaction state for", transData, "tries=", opt._tries);
    if (opt._tries > opt.maxTries) {
      log.error("Giving up on transaction for", transData, "after", opt._tries, "tries");
      return cb("TRANSACTION_TIMEOUT");
    }
    settings.adapter.transactionStatus(transData, function(err, isComplete, productInfo) {
      if (err) {
        return cb(err);
      }
      if (isComplete) {
        return cb(null, productInfo);
      } else {
        log.debug("Re-trying incomplete transaction in", opt.pollIntervalMs, "ms");
        window.setTimeout(function() {
          waitForTransaction(transData, cb, {
            maxTries: opt.maxTries,
            pollIntervalMs: opt.pollIntervalMs,
            _tries: opt._tries + 1
          });
        }, opt.pollIntervalMs);
      }
    });
  }
})();