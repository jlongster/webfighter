define(function(require) {

    var server = 'ws:' + window.location.href.substring(window.location.protocol.length);
    var socket = new WebSocket(server);
    var clickEvent = 'ontouchstart' in window ? 'touchstart' : 'click';

    socket.onmessage = function(msg) {
        msg = JSON.parse(msg.data);

        switch(msg.name) {
        case 'signed-jwt':
            if(navigator.mozPay) {
                var req = navigator.mozPay([msg.jwt]);
                console.log(msg.jwt);
                req.onerror = function() {
                    console.log('mozPay error: ' + this.error.name);
                };
            }
            else {
                alert('in-app payments unavailable');
            }

            break;
        case 'purchased':
            alert('purchased ' + msg.productId);
        default:
        }
    };

    var items = {
        'Carrot Ship': {
            icon: 'img/items/carrot-ship.png',
            description: 'This carrot ship. yes.',
            price: '1'
        }
    };

    function buy(name) {
        // GAH need to put items object on the server-side because it
        // needs to access the price of it there

        // socket.send(JSON.stringify({
        //     name: 'sign-jwt',
        //     item: name,
        //     description: items[name].description
        // }));
    }

    function formatPrice(point) {
        return '$' + (point - .01).toFixed(2);
    }

    function templatize(data) {
        return '<div class="content">' +
            '<img src="' + data.icon + '" />' +
            '<h2>' + data.name + '</h2>' +
            '<div class="desc">' + data.description + '</div>' +
            '</div>' +
            '<div class="purchase">' +
            formatPrice(data.price) +
            '<div><button data-item="' + data.name + '">Buy</button></div>' +
            '</div>';
    }

    function populate() {
        for(var name in items) {
            items[name].name = name;
            var el = document.querySelector('#store-screen .items');
            var div = document.createElement('div');
            div.className = 'item';
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
    }

    return {
        populate: populate
    };
});
