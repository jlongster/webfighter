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
    purchasedItems = [];

    // util

    function isArray(obj) {
        return Object.prototype.toString.call(obj) == '[object Array]';
    }

    function addClass(el, cls) {
        if(el.className.indexOf(cls) === -1) {
            el.className += ' ' + cls;
        }
    }

    function removeClass(el, cls) {
        el.className = el.className.replace(cls, '');
    }

    // store

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

    function buy(name, type) {
        ajax('POST', '/sign-jwt', { name: name,
                                    type: type }, function(res) {
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

    function isBuiltin(name) {
        return ['Fighter'].indexOf(name) !== -1;
    }

    function isPurchased(name) {
        return purchasedItems.indexOf(name) !== -1;
    }

    function isSelected(name, type) {
        var item = selectedItems[type];
        if(isArray(item)) {
            return item.indexOf(name) !== -1;
        }
        return item == name;
    }

    function formatPrice(point) {
        return '$' + (point - .01).toFixed(2);
    }

    function itemClass(name) {
        return name.replace(/[ !']/g, '-');
    }

    function selectItem(name, type) {
        var item = selectedItems[type];
        if(isArray(item)) {
            var el = document.querySelector('.item.' + name);
            
            if(item.indexOf(name) === -1) {
                item.push(name);
                el.className += ' selected';
            }
            else {
                item.splice(item.indexOf(name), 1);
                removeClass(el, 'selected');
            }
        }
        else {
            Array.prototype.slice.call(
                document.querySelectorAll('.' + type + ' .item')
            ).forEach(function(el) {
                if(el.dataset.name == name) {
                    addClass(el, 'selected');
                }
                else {
                    removeClass(el, 'selected');
                }
            });

            selectedItems[type] = name;
        }
    }

    // need to style the store much better
    function templatize(data, type) {
        var str = '<div class="img"><img src="' + data.icon + '" /></div>' +
            '<div class="info"><h4>' + data.name + '</h4>' + data.description + '</div>' +
            '<div class="purchase">';

        if(!isBuiltin(data.name)) {
            if(isPurchased(data.name)) {
                str += 'purchased';
            }
            else {
                str += '<div class="price">' + formatPrice(data.price) + '</div>' +
                    '<div><button data-type="' + type + '" data-item="' + data.name + '">Buy</button></div>';
            }
        }
        else {
            str += '<div class="price">free</div>';
        }

        return str + '</div>';
    }

    function populateCategory(type, items) {
        var el = document.querySelector('#store-screen .' + type);

        for(var name in items[type]) {
            var item = items[type][name];
            item.name = name;

            var div = document.createElement('div');
            div.className = 'item ' + itemClass(name);

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
            populateCategory('additions', items);

            Array.prototype.slice.call(
                document.querySelectorAll('#store-screen .items button')
            ).forEach(function(btn) {
                btn.addEventListener(clickEvent, function(e) {
                    e.stopPropagation();
                    buy(this.dataset.item, this.dataset.type);
                });
            });

            Array.prototype.slice.call(
                document.querySelectorAll('#store-screen .item')
            ).forEach(function(el) {
                el.addEventListener(clickEvent, function() {
                    if(isBuiltin(this.dataset.name) || isPurchased(this.dataset.name)) {
                        selectItem(this.dataset.name, this.dataset.type);
                    }
                    else {
                        alert('need to purchase');
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
