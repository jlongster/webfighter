define(function(require) {

    var util = require('./util');
    var clickEvent = util.clickEvent;
    var fxpay = require('fxpay');

    var purchasedItems = []; //JSON.parse(localStorage.getItem('purchased') || '[]');
    var selectedItems = JSON.parse(localStorage.getItem('selected') || 'null') || {
        ships: 'Fighter',
        weapons: [],
        additions: []
    };

    // Mapping of cat ids to category names.
    var catMapping = {
        1: 'ships',
        2: 'weapons',
    };

    // Mapping of price point id (tier id) to price in $USD
    var pricePoints = {
        36: '$0.50',
        1: '$0.99',
        3: '$2.99',
    };

    // Mapping of in-app item guids to names, categories and descriptions.
    var itemMapping = {
        'dea4faad-ca8a-4784-8dcc-79244fcc4932': {
            name: 'Carrot Ship',
            cat: 1,
            description: 'This is a carrot ship. Narrowly avoid your enemies.',
        },
        'e8239a0a-4e8c-4ffa-9912-9713d520dded': {
            name: 'Blaster',
            cat: 1,
            description: 'A ship with powerful armour. Has a life of 4.',
        },
        'e30c8416-ca0b-400c-9b27-7e63c6501b63': {
            name: 'Duel Fighter',
            cat: 1,
            description: 'Equipped with duel-blasting cannons, take on even more enemies at once.',
        },
        '7c1eb858-b048-447d-96ce-7c8759080024': {
            name: 'Reverse Plasma',
            cat: 2,
            description: 'Send a deadly plasma beam to those trying to sneak up behind you.',
        },
        '24397cc8-850d-4b58-af82-952a5f4d3a59': {
            name: 'Flying Hotdog',
            cat: 2,
            description: 'Call for additional aid from the hotdogs!',
        }
    };

    function isPurchased(name) {
        return purchasedItems.indexOf(name) !== -1;
    }

    function onPurchase(name) {
        console.log(name);
        // The purchase was successful, so update the user's inventory
        purchasedItems.push(name);
        //localStorage.setItem('purchased', JSON.stringify(purchasedItems));

        var el = document.querySelector('.' + itemClass(name) + ' .purchase');
        if (el) {
            el.innerHTML = '<div class="purchased">purchased</div>';
        } else {
            console.log('Element not ready for update');
        }
    }

    function isBuiltin(name) {
        return ['Fighter'].indexOf(name) !== -1;
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
        return pricePoints[point];
    }

    function itemClass(name) {
        return name.toLowerCase().replace(/[ !']/g, '-');
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

        str += '<img src="' + data.smallImageUrl + '" />' +
            '<h4>' + data.name + '</h4>' +
            '<div class="desc">' + data.description + '</div>';


        if(!isBuiltin(data.name)) {
            var price = formatPrice(data.pricePointId) || 'Buy';
            str += '<div class="purchase">';

            if (isPurchased(data.name)) {
                str += '<div class="purchased">purchased</div>';
            } else {
                str += '<button data-type="' + type + '" data-item="' + data.productId + '"> ' + price + '</button>';
            }
            str += '</div>';
        }

        return str;
    }

    function populateCategory(type, products) {
        var el = document.querySelector('#store-screen .' + type);

        for(var i=0; i<products.length; i++) {
            var item = products[i];
            if (catMapping[item.cat] !== type) {
                continue;
            }
            var name = item.name;
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

    function populate(products) {
        // populate the stores with individual items, hook up the
        // buttons, and figure out the UI for "selecting" items
        populateCategory('ships', products);
        populateCategory('weapons', products);

        util.getElements('#store-screen .items button').forEach(function(btn) {
            btn.addEventListener(clickEvent, function(e) {
                e.stopPropagation();
                fxpay.purchase(this.dataset.item, function(error, product) {
                    if (error) {
                        return console.error(error);
                    }
                    console.log(product.productId, product.name, 'purchased and verified!');
                    onPurchase(product.name);
               });
            });
        });

        util.getElements('#store-screen .item').forEach(function(el) {
            el.addEventListener(clickEvent, function() {
                if(isBuiltin(this.dataset.name) || isPurchased(this.dataset.name)) {
                    selectItem(this.dataset.name, this.dataset.type);
                }
            });
        });
    }


    // Take the in-app items list and merge-in the
    // data in the itemMapping.
    function mergeProductData(products) {

        for (var i=0; i<products.length; i++) {
            var guid = products[i].productId;
            /*jshint -W083 */
            Object.keys(itemMapping[guid]).forEach(function(key) {
                products[i][key] = itemMapping[guid][key];
            });
        }

        products.unshift({
            name: 'Fighter',
            cat: 1,
            smallImageUrl: '/img/items/fighter-ship.png',
            description: 'Your main ship.',
        });

        return products;
    }


    function init() {
        fxpay.init({
            payProviderUrls: {
                'mozilla/payments/pay/v1':
                    'https://marketplace.firefox.com/mozpay/?req={jwt}',
                'mozilla-stage/payments/pay/v1':
                    'https://marketplace.allizom.org/mozpay/?req={jwt}'
            },
            receiptCheckSites: [
                'https://receiptcheck.marketplace.firefox.com',
                'https://marketplace.firefox.com',
                'https://receiptcheck-marketplace.allizom.org'
            ],
            apiUrlBase: 'https://marketplace.allizom.org',
            onerror: function(error) {
                console.error('An error occurred:', error);
            },
            oninit: function() {
                console.log('fxpay initialized without errors');

                fxpay.getProducts(function(error, products) {
                    if (error) {
                        return console.error('Error getting products:', error);
                    }
                    products = mergeProductData(products);
                    populate(products);
                });
            },
            onrestore: function(error, product) {
                // If error is null, product.productId has been
                // restored from receipt.
                if (error === null) {
                    console.log('onrestore fired');
                    onPurchase(product.name);
                } else {
                    console.error('A receipt restoration error occured', error);
                }
            }
        });
    }

    return {
        init: init,
        populate: populate,
        isSelected: isSelected,
        isPurchase: isPurchased,
    };
});
