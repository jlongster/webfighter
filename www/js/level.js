define(function(require) {
    var units = require('./units');
    

    function init(scene, renderer) {
        var h = renderer.height;

        scene.addObject(new units.Floor(renderer));
        level1(scene, renderer);

        scene.addObject(new units.Trigger(200, renderer.height, function() {
            for(var i=0; i<10; i++) {
                scene.addObject(
                    new units.Mook(renderer, [400 + Math.random() * 50,
                                              (Math.random() * 2 - 1 ) * h/2])
                );
            }
        }));

        var player = new units.Player(renderer, [50, 50]);
        scene.addObject(player);
    }

    function level1(scene, renderer) {
        scene.addObject(new units.Boss(renderer, [500, 20]));
        scene.addObject(new units.Boss(renderer, [500, 100]));
        scene.addObject(new units.Boss(renderer, [500, 200]));
    }

    return { init: init };
});
