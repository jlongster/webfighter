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

    return Obj.extend({
        init: function() {
            var canvas = document.getElementById('canvas');
            var sizeWrapper = document.getElementById('size-wrapper');

            this.ctx = canvas.getContext('2d');
            this.canvas = canvas;
            this.sizeWrapper = sizeWrapper;
            this.resizeFuncs = [];

            // ignore this for now, it's too hard
            // this.optimizeSize(canvas, sizeWrapper);

            // var _this = this;
            // window.onresize = function() {
            //     _this.optimizeSize(canvas, sizeWrapper);
            // };

            //window.onresize();
        },

        optimizeSize: function(canvas, wrapper) {
            // Optimized for mobile
            if(window.innerWidth <= 600 && window.innerHeight <= 600) {
                var barHeight = document.getElementById('appbar').clientHeight;
                canvas.style.marginTop = barHeight + 'px';

                this.width = canvas.width = window.innerWidth;
                this.height = canvas.height = window.innerHeight - barHeight;

                wrapper.style.width = window.innerWidth + 'px';
                wrapper.style.height = window.innerHeight + 'px';

                document.body.className = 'small';
            }
            else {
                var zoomFactor = Math.min(Math.floor(window.innerWidth / 480) || 1,
                                          Math.floor(window.innerHeight / 320) || 1);

                wrapper.style.width = (480 * zoomFactor) + 'px';
                wrapper.style.height = (320 * zoomFactor) + 'px';

                var barHeight = document.getElementById('appbar').clientHeight;
                canvas.style.marginTop = barHeight + 'px';

                this.width = canvas.width = 480;
                this.height = canvas.height = 320 - (barHeight / zoomFactor);

                if(zoomFactor == 1) {
                    document.body.className = 'small';
                }
                else {
                    document.body.className = '';
                }
            }

            this.fireResize();
        },

        reset: function() {
            this.resizeFuncs = [];
            // this.optimizeSize(this.canvas, this.sizeWrapper);

            var barHeight = document.getElementById('appbar').clientHeight;
            this.width = canvas.width = window.innerWidth;
            this.height = canvas.height = window.innerHeight - barHeight;
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
