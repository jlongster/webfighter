define(function(require) {
    var SceneObject = require('./sceneobject');

    return SceneObject.extend({
        update: function(dt) {
            // The boss is at 10000
            if(this.pos[0] < 10000) {
                this.pos[0] += 20 * dt;
            }

            document.querySelector('.debug').innerHTML = this.pos[0];
        },

        prerender: function(ctx) {
            ctx.translate(-this.pos[0], -this.pos[1]);
        }
    });
});
