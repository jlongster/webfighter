
define(function(require) {
    var Obj = require('./object');

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

            document.addEventListener('keydown', function(e) {
                _this.setKey.call(_this, e, true);
            });

            document.addEventListener('keyup', function(e) {
                _this.setKey.call(_this, e, false);
            });
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