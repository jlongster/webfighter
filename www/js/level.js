define(function(require) {
    var units = require('./units');    

    function getOffscreenX(scene, renderer) {
        return scene.camera.pos[0] + renderer.width;
    }

    function init(scene, renderer) {
        scene.addObject(new units.Floor(renderer, 'img/background.png'));
        scene.addObject(new units.Floor(renderer, 'img/background2.png'));
        scene.addObject(new units.Floor(renderer, 'img/background3.png'));
        level1(scene, renderer);

        var player = new units.Player(renderer, [50, 50]);
        scene.addObject(player);
    }

    function level1(scene, renderer) {
        var h = renderer.height;

        scene.addObject(new units.Trigger(0, 500, renderer.height, function() {
            if(Math.random() < .02) {
                scene.addObject(
                    new units.Mook(renderer, [getOffscreenX(scene, renderer) + Math.random() * 50,
                                              Math.random() * h])
                );
            }
        }));
    }

    return { init: init };
});
