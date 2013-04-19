define(function(require) {

    var clickEvent = 'ontouchstart' in window ? 'touchstart' : 'click';

    function ajax() {

    }

    function buy(name) {
        post('/sign-jwt', name, function(res) {
            if(navigator.mozPay) {
                var req = navigator.mozPay([res]);

                console.log(msg.jwt);
                req.onerror = function() {
                    console.log('mozPay error: ' + this.error.name);
                };

                // poll to see when res is done
            }
            else {
                alert('in-app payments unavailable');
            }
        });
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
