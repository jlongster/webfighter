define(function(require) {
    var Obj = require('./object');

    return Obj.extend({
        init: function(pos, scale, sprite) {
            this.pos = vec2.create(pos || [0, 0]);
            this.size = vec2.create(scale || [1, 1]);
            this.sprite = sprite;
        },

        update: function(dt) {
            if(this.sprite) {
                this.sprite.update(dt);
            }
        },

        render: function(ctx) {
            if(this.sprite) {
                this.sprite.render(ctx);
            }
        },

        remove: function() {
            if(this._scene) {
                this._scene.removeObject(this);
            }
        }
    });
});