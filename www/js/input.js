
define(function(require) {
    var Obj = require('./object');

    function p(e) {
        e.preventDefault();
    }

    return Obj.extend({
        init: function() {
            this.pressedKeys = {};
            this.specialKeys = {
                37: 'LEFT',
                38: 'UP',
                39: 'RIGHT',
                40: 'DOWN'
            };

            var _this = this;

            window.addEventListener('touchstart', p, true);
            window.addEventListener('touchmove', p, true);

            document.addEventListener('keydown', function(e) {
                _this.setKey.call(_this, e, true);
            });

            document.addEventListener('keyup', function(e) {
                _this.setKey.call(_this, e, false);
            });

            var dpad = document.createElement('div');

            // TODO: Don't do this here.
            dpad.style.backgroundColor = '#fcc';
            dpad.style.borderRadius = '50%';
            dpad.style.bottom = '10px';
            dpad.style.left = '10px'
            dpad.style.height = '60px';
            dpad.style.position = 'absolute';
            dpad.style.width = '60px';
            document.body.appendChild(dpad);

            this.dpadOffset = vec2.create([0, 0]);
            this.dpadZero = (function(cur) {
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
                var v = vec2.create([touch.clientX, touch.clientY]);
                vec2.subtract(v, _this.dpadZero, _this.dpadOffset);
            }, true);

            dpad.addEventListener('touchend', function dpadEnd(e) {
                p(e);
                dpad.style.backgroundColor = '#fcc';
                _this.dpadOffset[0] = _this.dpadOffset[1] = 0;
            }, true);
        },

        setKey: function(event, status) {
            var code = event.keyCode;

            if(code in this.specialKeys) {
                this.pressedKeys[this.specialKeys[code]] = status;
            }
            else {
                this.pressedKeys[String.fromCharCode(code)] = status;
            }
        },

        isDown: function(key) {
            return this.pressedKeys[key.toUpperCase()];
        }
    });
});
