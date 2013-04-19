define(function(require) {
    var util = require('./util');
    var clickEvent = util.clickEvent;
    var ajax = util.ajax;

    var purchasedItems = JSON.parse(localStorage.getItem('purchased') || '[]');
    purchasedItems = [];

    function pollQueue(token, name) {
        ajax('GET', '/purchaseQueue?token=' + token, function(res) {
            switch(res) {
            case 'success': onPurchase(name); break;
            case 'failure': alert('payment failure'); break;
            default:
                setTimeout(function() { pollQueue(token, name); }, 1000);
                break;
            }
        });
    }

    function buy(name) {
        ajax('POST', '/sign-jwt', { name: name }, function(res) {
            if(navigator.mozPay) {
                res = JSON.parse(res);

                var req = navigator.mozPay([res.jwt]);

                req.onerror = function() {
                    console.log('mozPay error: ' + this.error.name);
                };

                // poll to see when res is done
                pollQueue(res.token, name);
            }
            else {
                alert('in-app payments unavailable');
            }
        });
    }

    function onPurchase(name) {
        purchasedItems.push(name);
        localStorage.setItem('purchased', JSON.stringify(purchasedItems));

        var el = document.querySelector('.' + itemClass(name) + ' .purchase');
        el.innerHTML = 'purchased';
    }

    function isPurchased(name) {
        return purchasedItems.indexOf(name) !== -1;
    }

    function formatPrice(point) {
        return '$' + (point - .01).toFixed(2);
    }

    function itemClass(name) {
        return name.replace(/[ !']/g, '-');
    }

    function templatize(data) {
        var str = '<div class="content">' +
            '<img src="' + data.icon + '" />' +
            '<h2>' + data.name + '</h2>' +
            '<div class="desc">' + data.description + '</div>' +
            '</div>' +
            '<div class="purchase">';

        if(isPurchased(data.name)) {
            str += 'purchased';
        }
        else {
            str += formatPrice(data.price) +
                '<div><button data-item="' + data.name + '">Buy</button></div>';
        }

        return str + '</div>';
    }

    function populate() {
        ajax('GET', '/store-items', function(res) {
            var items = JSON.parse(res);

            for(var name in items) {
                items[name].name = name;
                var el = document.querySelector('#store-screen .items');
                var div = document.createElement('div');
                div.className = 'item ' + itemClass(name);
                div.innerHTML = templatize(items[name]);
                el.appendChild(div);
            }

            Array.prototype.slice.call(
                document.querySelectorAll('#store-screen .items button')
            ).forEach(function(btn) {
                btn.addEventListener(clickEvent, function() {
                    buy(this.dataset.item);
                });
            });
        });
    }

    return {
        populate: populate,
        isPurchased: isPurchased
    };
});
