define(function(require) {
    var util = require('./util');
    var clickEvent = util.clickEvent;
    var ajax = util.ajax;

    var purchasedItems = JSON.parse(localStorage.getItem('purchased') || '[]');
    var selectedItems = JSON.parse(localStorage.getItem('selected') || 'null') || {
        ships: 'Fighter',
        weapons: [],
        additions: []
    };

    var priceTiers = {
        1: '$0.10',
        10: '$0.99',
        30: '$2.99'
    };

    // store

    var pollTimer = null;

    function pollQueue(token, name) {
        // Poll the server every second to see the status of our
        // payment request

        ajax('GET', '/purchaseQueue?token=' + token, function(res) {
            switch(res) {
            case 'success':
                onPurchase(name); 
                clearPolling();
                break;
            case 'failure':
                alert('payment failure');
                clearPolling();
                break;
            default:
                // let the timer continue to poll until 'success' or
                // 'failure' is returned
            }
        });
    }

    function clearPolling() {
        if(pollTimer) {
            clearInterval(pollTimer);
        }
        pollTimer = null;
    }

    function buy(name, type) {
        // Purchase an item by requesting a JWT object from the
        // server, and posting it to the mozPay API
        ajax('POST', '/sign-jwt', { name: name,
                                    type: type }, function(res) {
            if(navigator.mozPay) {
                res = JSON.parse(res);

                var req = navigator.mozPay([res.jwt]);

                req.onerror = function() {
                    console.log('mozPay error: ' + this.error.name);
                    clearPolling();
                };

                // Poll to see when the payment is complete
                pollTimer = setInterval(function() { pollQueue(res.token, name); }, 1000);
            }
            else {
                alert('in-app payments unavailable, so giving it to you for free');
                onPurchase(name);
            }
        });
    }

    function onPurchase(name) {
        // The purchase was successful, so update the user's inventory
        purchasedItems.push(name);
        localStorage.setItem('purchased', JSON.stringify(purchasedItems));

        var el = document.querySelector('.' + itemClass(name) + ' .purchase');
        el.innerHTML = '<div class="purchased">purchased</div>';
    }

    function isBuiltin(name) {
        return ['Fighter'].indexOf(name) !== -1;
    }

    function isPurchased(name) {
        return purchasedItems.indexOf(name) !== -1;
    }

    function isSelected(name, type) {
        var item = selectedItems[type];
        if(util.isArray(item)) {
            return item.indexOf(name) !== -1;
        }
        return item == name;
    }

    // The rest of this code implements the UI of the store

    function formatPrice(point) {
        return priceTiers[point];
    }

    function itemClass(name) {
        return name.replace(/[ !']/g, '-');
    }

    function selectItem(name, type) {
        var item = selectedItems[type];
        if(util.isArray(item)) {
            var el = document.querySelector('.item.' + itemClass(name));
            
            if(item.indexOf(name) === -1) {
                item.push(name);
                util.addClass(el, 'selected');
            }
            else {
                item.splice(item.indexOf(name), 1);
                util.removeClass(el, 'selected');
            }
        }
        else {
            util.getElements('.' + type + ' .item').forEach(function(el) {
                if(el.dataset.name == name) {
                    util.addClass(el, 'selected');
                }
                else {
                    util.removeClass(el, 'selected');
                }
            });

            selectedItems[type] = name;
        }

        localStorage.setItem('selected', JSON.stringify(selectedItems));
    }

    // need to style the store much better
    function templatize(data, type) {
        var str = '';

        str += '<img src="' + data.icon + '" />' +
            '<h4>' + data.name + '</h4>' +
            '<div class="desc">' + data.description + '</div>';


        if(!isBuiltin(data.name)) {
            str += '<div class="purchase">';

            if(isPurchased(data.name)) {
                str += '<div class="purchased">purchased</div>';
            }
            else {
                str += '<button data-type="' + type + '" data-item="' + data.name + '">Buy for ' + formatPrice(data.price) + '</button>';
            }
            str += '</div>';
        }

        return str;
    }

    function populateCategory(type, items) {
        var el = document.querySelector('#store-screen .' + type);

        for(var name in items[type]) {
            var item = items[type][name];
            item.name = name;

            var div = document.createElement('div');
            div.className = 'item ' + itemClass(name);
            div.dataset.name = name;
            div.dataset.type = type;

            if(isSelected(name, type)) {
                div.className = div.className += ' selected';
            }

            div.innerHTML = templatize(item, type);
            el.appendChild(div);
        }
    }

    function populate() {
        ajax('GET', '/store-items', function(res) {
            var items = JSON.parse(res);

            // populate the stores with individual items, hook up the
            // buttons, and figure out the UI for "selecting" items
            populateCategory('ships', items);
            populateCategory('weapons', items);

            util.getElements('#store-screen .items button').forEach(function(btn) {
                btn.addEventListener(clickEvent, function(e) {
                    e.stopPropagation();
                    buy(this.dataset.item, this.dataset.type);
                });
            });

            util.getElements('#store-screen .item').forEach(function(el) {
                el.addEventListener(clickEvent, function() {
                    if(isBuiltin(this.dataset.name) || isPurchased(this.dataset.name)) {
                        selectItem(this.dataset.name, this.dataset.type);
                    }
                });
            });

        });
    }

    return {
        populate: populate,
        isPurchased: isPurchased,
        isSelected: isSelected
    };
});
