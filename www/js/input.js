
define(function(require) {
    require('./math');

    function p(e) {
        e.preventDefault();
    }

    var pressedKeys = {};
    var specialKeys = {
        32: 'SPACE',
        37: 'LEFT',
        38: 'UP',
        39: 'RIGHT',
        40: 'DOWN'
    };
    var dpadOffset = vec2.createFrom(0, 0);

    window.addEventListener('touchstart', p, true);
    window.addEventListener('touchmove', p, true);

    document.addEventListener('keydown', function(e) {
        setKey(e, true);
    });

    document.addEventListener('keyup', function(e) {
        setKey(e, false);
    });

    function setKey(event, status) {
        var code = event.keyCode;

        if(code in specialKeys) {
            pressedKeys[specialKeys[code]] = status;
        }
        else {
            pressedKeys[String.fromCharCode(code)] = status;
        }
    }

    function isDown(key) {
        return pressedKeys[key.toUpperCase()];
    }

    function init() {
        var dpad = document.getElementsByClassName('dpad')[0];
        var dpadZero = (function(cur) {
            var x = cur.clientWidth / 2;
            var y = cur.clientHeight / 2;
            while(cur.offsetParent) {
                x += cur.offsetLeft;
                y += cur.offsetTop;
                cur = cur.offsetParent;
            }
            return vec2.create([x, y]);
        })(dpad);

        dpad.addEventListener('touchstart', function(e) {
            p(e);
            dpad.style.backgroundColor = '#ccf';
        }, true);

        dpad.addEventListener('touchmove', function dpadMove(e) {
            p(e);
            var touch = e.changedTouches[0];
            var v = vec2.createFrom(touch.clientX, touch.clientY);
            vec2.subtract(v, dpadZero, dpadOffset);
        }, true);

        dpad.addEventListener('touchend', function dpadEnd(e) {
            p(e);
            dpad.style.backgroundColor = '#fcc';
            dpadOffset[0] = dpadOffset[1] = 0;
        }, true);
    }

    return {
        init: init,
        setKey: setKey,
        isDown: isDown,
        dpadOffset: dpadOffset
    };
});