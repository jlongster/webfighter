define(function(require) {
    var units = require('./units');

    function init(scene, renderer) {
        scene.addObject(new units.Floor(renderer));

        var enemy = new units.Boss(renderer, [200, 0]);
        scene.addObject(enemy);

        enemy = new units.Boss(renderer, [200, 100]);
        scene.addObject(enemy);

        enemy = new units.Boss(renderer, [200, 200]);
        scene.addObject(enemy);

        var zero = renderer.height / 2;
        var amplitude = zero - 25;
        for(var i=0; i<800; i++) {
            enemy = new units.Mook(
                renderer,
                [300 + i*30, zero - Math.sin(i/10) * amplitude]);
            scene.addObject(enemy);
        }

        var player = new units.Player(renderer, [50, 50]);
        scene.addObject(player);
    }

    return { init: init };
});
