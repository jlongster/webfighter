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

        scene.addObject(new units.Trigger(0, 2000, renderer.height, function() {
            var r = Math.random();

            if(r < .01) {
                for(var i=0; i<10; i++) {
                    var y = Math.random() * 50;
                    scene.addObject(
                        new units.Mook(renderer,
                                       [getOffscreenX(scene, renderer),
                                        h * .3 + Math.random() * h * .3 ],
                                       'circle',
                                       i/5)
                    );
                }
            }
            else if(r < .02) {
                scene.addObject(new units.Mook(renderer,
                                               [getOffscreenX(scene, renderer),
                                                Math.random() * h]));
            }
        }));

        scene.addObject(new units.Powerup(renderer, [175, h / 2]));
    }

    return { init: init };
});
