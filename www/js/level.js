define(function(require) {
    var units = require('./units');
    var sprites = units.sprites;

    function getOffscreenX(scene, renderer) {
        return scene.camera.pos[0] + renderer.width;
    }

    function getDifficulty(scene) {
        var player = scene.getObject('player');
        var x = player.pos[0];

        return Math.floor(x / 10000);
    }

    function init(scene, renderer) {
        scene.addObject(new units.Floor(renderer, 'img/background.png'));
        scene.addObject(new units.Floor(renderer, 'img/background2.png'));
        scene.addObject(new units.Floor(renderer, 'img/background3.png'));
        level1(scene, renderer);

        var player = new units.Player(renderer, [50, 50]);
        scene.addObject(player);
    }

    function newPosition(scene, renderer, minY, maxY) {
        var h = renderer.height;
        minY = minY || 0;
        maxY = maxY || 1;

        return [getOffscreenX(scene, renderer),
                h * minY + Math.random() * h * (maxY - minY)];
    }

    function level1(scene, renderer) {
        scene.addObject(new units.Trigger(renderer, 0, 500, function() {
            var r = Math.random();

            if(r < .01) {
                scene.addObject(
                    new units.SineEnemy(renderer,
                                        sprites.fireShip,
                                        newPosition(scene, renderer),
                                        [forwardShoot(1.5)])
                );
            }
        }));

        scene.addObject(new units.Trigger(renderer, 500, 1200, function() {
            var r = Math.random();
            var h = renderer.height;
            var player = scene.getObject('player');

            if(r < .03) {
                scene.addObject(
                    new units.SineEnemy(renderer,
                                        sprites.saw,
                                        newPosition(scene, renderer))
                );
            }
            else if(r < .05) {
                scene.addObject(
                    new units.SineEnemy(renderer,
                                        sprites.fireShip,
                                        newPosition(scene, renderer))
                );
            }
        }));

        scene.addObject(new units.Trigger(renderer, 1000, 1700, function() {
            var r = Math.random();

            if(r < .01) {
                addSwarm(renderer, scene, 6);
            }
        }));

        scene.addObject(new units.Trigger(renderer, 1300, 1900, function() {
            var r = Math.random();

            if(r < .05) {
                scene.addObject(
                    new units.SurpriseEnemy(
                        renderer,
                        sprites.saw,
                        [getOffscreenX(scene, renderer) - Math.random() * renderer.width,
                         Math.random() < .5 ? -sprites.saw.sprite.size[1] : renderer.height]
                    )
                );
            }
        }));

        scene.addObject(new units.Powerup(renderer,
                                          [1100, renderer.height * .3],
                                          'multi'));

        scene.addObject(new units.Powerup(renderer,
                                          [1600, renderer.height * .6],
                                         'side'));

        scene.addObject(new units.Trigger(renderer, 1950, 2000, function() {
            if(!scene.getObject('boss')) {
                addBoss(renderer, scene);
                this.remove();
            }
        }));
    }

    function addSwarm(renderer, scene, count) {
        for(var i=0; i<count; i++) {
            var y = Math.random() * 50;
            scene.addObject(
                new units.CircleEnemy(renderer,
                                      sprites.metalShip,
                                      newPosition(scene, renderer, .3, .7),
                                      [forwardShoot(4)],
                                      i/5)
            );
        }
    }

    function addBoss(renderer, scene) {
        scene.addObject(
            new units.Boss(renderer, [2250, 100])
        );

        scene.addObject(
            new units.BossWeakness(renderer,
                                   [2250, 250],
                                   function() {
                                       return [-100, Math.random() * -100];
                                   })
        );

        scene.addObject(
            new units.BossWeakness(renderer,
                                   [2250, 50],
                                   function() {
                                       return [-100, Math.random() * 100];
                                   })
        );
    }

    // components

    function forwardShoot(speed) {
        return function() {
            if(this.lastShot === undefined) {
                this.lastShot = (Date.now() -
                                 speed * 1000 +
                                 Math.floor(Math.random() * 2000));
                return;
            }

            var now = Date.now();

            if(now - this.lastShot > speed * 1000) {
                this._scene.addObject(new units.EnemyLaser(
                    this._renderer,
                    [this.pos[0],
                     this.pos[1] + this.size[1] / 2],
                    [-1, 0],
                    300
                ));

                this.lastShot = now;
            }
        };
    }

    return { init: init };
});
