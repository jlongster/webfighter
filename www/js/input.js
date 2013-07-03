
define(function(require) {
    require('./math');

    function preventDefault(e) {
        e.preventDefault();
    }

    var disabled = false;
    var pressedKeys = {};
    var specialKeys = {
        32: 'SPACE',
        37: 'LEFT',
        38: 'UP',
        39: 'RIGHT',
        40: 'DOWN'
    };

    var pressedButtons = {
        'FIRE': false
    };

    window.addEventListener('touchmove', preventDefault, true);

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
        if(disabled) {
            return false;
        }
        return pressedKeys[key.toUpperCase()];
    }

    function isFiring() {
        if(disabled) {
            return false;
        }
        return isDown('SPACE');
    }

    function disable() {
        disabled = true;
    }

    function enable() {
        disabled = false;
    }

    var startPos;
    function dpadStart(e) {
        e.preventDefault();
        var touch = e.changedTouches[0];
        startPos = [touch.clientX, touch.clientY];

        dpad.style.backgroundColor = '#ccf';
    }

    function dpadMove(e) {
        e.preventDefault();
        var touch = e.changedTouches[0];
        var pos = [touch.clientX, touch.clientY];

        // normalize the keys
        pressedKeys['LEFT'] = false;
        pressedKeys['UP'] = false;
        pressedKeys['RIGHT'] = false;
        pressedKeys['DOWN'] = false;

        var offset = vec2.create();
        vec2.subtract(pos, startPos, offset);
        vec2.normalize(offset);
        var axis = [0, 1];

        // find angle of offset vector, and translate it into
        // space that we expect
        var angle = ((Math.atan2(offset[1], offset[0])) / Math.PI) * 180;
        angle = -angle;
        if(angle < 0) {
            angle = 360 - Math.abs(angle);
        }

        if(angle > 290 || angle < 70) {
            pressedKeys['RIGHT'] = true;
        }

        if(angle > 20 && angle < 160) {
            pressedKeys['UP'] = true;
        }

        if(angle > 110 && angle < 250) {
            pressedKeys['LEFT'] = true;
        }

        if(angle > 200 && angle < 340) {
            pressedKeys['DOWN'] = true;
        }
    }

    function dpadEnd() {
        pressedKeys['LEFT'] = false;
        pressedKeys['UP'] = false;
        pressedKeys['RIGHT'] = false;
        pressedKeys['DOWN'] = false;

        dpad.style.backgroundColor = '#fcc';
    }

    function init() {
        // Initialize the Fire button.
        var fire = document.getElementsByClassName('fire')[0];

        function fireStart(e) {
            e.preventDefault();
            pressedKeys['SPACE'] = true;
            //fire.style.backgroundColor = '#ccf';
        }

        function fireCancel(e) {
            e.preventDefault();
            pressedKeys['SPACE'] = false;
            //fire.style.backgroundColor = '#fcc';
        }

        fire.addEventListener('touchstart', fireStart, false);
        fire.addEventListener('touchend', fireCancel, false);
        fire.addEventListener('touchleave', fireCancel, false);
        fire.addEventListener('touchcancel', fireCancel, false);

        // Initialize the dpad control
        var dpad = document.querySelector('.dpad');
        dpad.addEventListener('touchstart', dpadStart, true);
        dpad.addEventListener('touchmove', dpadMove, true);
        dpad.addEventListener('touchend', dpadEnd, true);
    }

    return {
        init: init,
        setKey: setKey,
        isDown: isDown,
        isFiring: isFiring,
        disable: disable,
        enable: enable
    };
});
