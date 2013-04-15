define(function(require) {

    //var server = 'ws:' + window.location.href.substring(window.location.protocol.length);
    var server = 'ws://localhost:4000';
    var socket = new WebSocket(server);

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

    function buy() {
        socket.send(JSON.stringify({
            name: 'sign-jwt'
        }));
    }

    return {
        buy: buy
    };
});
