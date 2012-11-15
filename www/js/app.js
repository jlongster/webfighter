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
    require('receiptverifier');
    require('./install-button');
    require('./math');

    var resources = require('./resources');
    var Sprite = require('./sprite');
    var Entity = require('./entity');
    var Input = require('./input');

    var width = window.innerWidth;
    var height = window.innerHeight;
    var canvas, ctx;

    var objects = [];
    var input = new Input();

    var Player = Entity.extend({
        update: function(dt) {
            if(input.isDown('w')) {
                this.pos[1] -= 250 * dt;
            }

            if(input.isDown('a')) {
                this.pos[0] -= 250 * dt;
            }

            if(input.isDown('s')) {
                this.pos[1] += 250 * dt;
            }

            if(input.isDown('d')) {
                this.pos[0] += 250 * dt;
            }

            this.parent(dt);
        }
    });

    function init() {
        canvas = document.getElementById('canvas');
        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext('2d');

        objects.push(new Player(
            [0, 0],
            [50, 50],
            new Sprite('../img/bosses.png',
                       vec2.create([0, 0]),
                       vec2.create([50, 50]))
        ));
        
        resources.onReady(heartbeat);
    }

    function update(dt) {
        for(var i=0, l=objects.length; i<l; i++) {
            if(objects[i].update) {
                objects[i].update(dt);
            }
        }
    }

    function render() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        for(var i=0, l=objects.length; i<l; i++) {
            if(objects[i].render) {
                objects[i].render(ctx);
            }
        }
    }

    var last;
    function heartbeat() {
        if(!last) {
            last = Date.now();
        }

        var now = Date.now();
        var dt = (now - last) / 1000.0;
        
        update(dt);
        render();
        requestAnimFrame(heartbeat);

        last = now;
    }

    init();
});
