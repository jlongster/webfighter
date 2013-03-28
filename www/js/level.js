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
        scene.addObject(new units.Trigger(renderer, 0, 500, function() {
            var r = Math.random();

            if(r < .01) {
                addBlade(scene, renderer);
            }
        }));

        scene.addObject(new units.Trigger(renderer, 500, 1200, function() {
            var r = Math.random();
            var func = null;

            if(r < .01) {
                func = addSwarm;
            }
            else if(r < .02) {
                func = addBlade;
            }

            if(func) {
                func(scene, renderer);
            }
        }));

        scene.addObject(new units.Powerup(renderer, [925, renderer.height / 1.5]));
    }

    function addSwarm(scene, renderer) {
        var h = renderer.height;

        for(var i=0; i<6; i++) {
            var y = Math.random() * 50;
            scene.addObject(
                new units.Mook(renderer,
                               [getOffscreenX(scene, renderer),
                                h * .3 + Math.random() * h * .3 ],
                               i/5)
            );
        }
    }

    function addBlade(scene, renderer) {
        scene.addObject(new units.Sine(renderer,
                                       [getOffscreenX(scene, renderer),
                                        Math.random() * renderer.height]));
    }

    return { init: init };
});
