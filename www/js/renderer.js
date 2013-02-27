var requestAnimFrame = (function(){
    return window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(callback){
            window.setTimeout(callback, 1000 / 60);
        };
})();

define(function(require) {
    var Obj = require('./object');

    function optimalSize(aspect) {
        var targetWidth = window.innerHeight * aspect;

        if(targetWidth < window.innerWidth) {
            return [targetWidth, window.innerHeight];
        }
        else {
            return [window.innerWidth, (1 / aspect) * window.innerWidth];
        }
    }
    
    return Obj.extend({
        init: function(aspect) {
            var canvas = document.getElementById('canvas');
            var size = optimalSize(aspect);

            this.width = canvas.width = size[0];
            this.height = canvas.height = size[1];
            this.ctx = canvas.getContext('2d');
            this.canvas = canvas;
            this.resizeFuncs = [];

            this.width = 100;
            this.height = (1 / aspect) * this.width;

            var _this = this;
            window.onresize = function() {
                var size = optimalSize(aspect);

                _this.canvas.width = size[0];
                _this.canvas.height = size[1];
                _this.fireResize();
            };
        },

        onResize: function(func) {
            this.resizeFuncs.push(func);
        },

        fireResize: function() {
            for(var i=0, l=this.resizeFuncs.length; i<l; i++) {
                this.resizeFuncs[i](this.width, this.height);
            }
        },

        render: function(scene) {
            if(!scene.camera) {
                console.log('WARNING! No camera in the scene, so nothing ' +
                            'will be displayed.');
                return;
            }

            var ctx = this.ctx;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, this.width, this.height);

            scene.camera.prerender(ctx);

            var objs = scene.objects;
            for(var i=0, l=objs.length; i<l; i++) {
                var obj = objs[i];

                ctx.save();
                ctx.translate(obj.pos[0], obj.pos[1]);
                ctx.fillStyle = 'pink';

                obj.render(ctx);

                ctx.restore();
            }
        },

        debug: function(scene, type) {
            if(!scene.camera) {
                console.log('WARNING! No camera in the scene, so nothing ' +
                            'will be displayed.');
                return;
            }

            var ctx = this.ctx;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.strokeStyle = 'red';

            scene.camera.prerender(ctx);

            var objs = scene.objects;
            for(var i=0, l=objs.length; i<l; i++) {
                var obj = objs[i];

                if(type) {
                    if(type == obj.typename) {
                        ctx.strokeRect(obj.pos[0], obj.pos[1],
                                       obj.size[0], obj.size[1]);
                    }
                }
                else {
                    ctx.strokeRect(obj.pos[0], obj.pos[1],
                                   obj.size[0], obj.size[1]);
                }
            }
        }
    });
});