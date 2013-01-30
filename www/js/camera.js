define(function(require) {
    var SceneObject = require('./sceneobject');

    return SceneObject.extend({
        update: function(dt) {
            this.pos[0] += 20 * dt;
        },

        prerender: function(ctx) {
            ctx.translate(-this.pos[0], -this.pos[1]);
        }
    });
});
