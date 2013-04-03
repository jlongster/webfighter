define(function(require) {
    var SceneObject = require('./sceneobject');

    return SceneObject.extend({
        update: function(dt) {
            // The boss is at 1950
            if(this.pos[0] < 1950) {
                this.pos[0] += 20 * dt;
            }
        },

        prerender: function(ctx) {
            ctx.translate(-this.pos[0], -this.pos[1]);
        }
    });
});
