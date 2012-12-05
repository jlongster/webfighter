define(function(require) {
    require('receiptverifier');
    require('./install-button');
    require('./math');

    var resources = require('./resources');
    var input = require('./input');
    var level = require('./level');

    var Renderer = require('./renderer');
    var Scene = require('./scene');
    var Camera = require('./camera');

    var renderer;
    var scene;

    function init() {
        var camera = new Camera();
        renderer = new Renderer(window.innerWidth / 2.0,
                                window.innerHeight / 2.0);
        scene = new Scene(camera);

        level.init(scene, renderer);

        heartbeat();
    }

    var last;
    function heartbeat() {
        if(!last) {
            last = Date.now();
        }

        var now = Date.now();
        var dt = (now - last) / 1000.0;

        input.init();
        scene.update(dt);
        renderer.render(scene);

        //renderer.debug(scene);

        last = now;
        requestAnimFrame(heartbeat);
    }

    resources.load([
        'img/bosses.png',
        'img/dungeon.png',
        'img/floor.png'
    ]);
    resources.onReady(init);
});
