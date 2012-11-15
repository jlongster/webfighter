define(function(require) {
    var Obj = require('./object');

    return Obj.extend({
        init: function(pos, size, sprite) {
            this.pos = vec2.create(pos || [0, 0]);
            this.size = vec2.create(size || [50, 50]);
            this.sprite = sprite;
        },

        update: function(dt) {
            if(this.sprite) {
                this.sprite.update(dt);
            }
        },

        render: function(ctx) {
            if(this.sprite) {
                this.sprite.render(ctx, this.pos);
            }
        }
    });
});