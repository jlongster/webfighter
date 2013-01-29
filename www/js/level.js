define(function(require) {
    var SceneObject = require('./sceneobject');
    var Sprite = require('./sprite');

    var input = require('./input');
    var resources = require('./resources');
    var _scene;
    var _renderer;

    function init(scene, renderer) {
        _scene = scene;
        _renderer = renderer;
        scene.addObject(new Floor(
            renderer,
            new Sprite('img/dungeon.png', [333, 897], [16, 16], 0)
        ));

        var enemy = new Enemy(
            [200, 0],
            [35, 50],
            new Sprite('img/bosses.png',
                       [323, 516],
                       [40, 50],
                       2,
                       [0, 1])
        );
        scene.addObject(enemy);

        enemy = new Enemy(
            [200, 100],
            [35, 50],
            new Sprite('img/bosses.png',
                       [323, 516],
                       [40, 50],
                       2,
                       [0, 1])
        );
        scene.addObject(enemy);

        enemy = new Enemy(
            [200, 200],
            [35, 50],
            new Sprite('img/bosses.png',
                       [323, 516],
                       [40, 50],
                       2,
                       [0, 1])
        );
        scene.addObject(enemy);

        for(var i=0; i<800; i++) {
            enemy = new Enemy(
                [300 + i*30, Math.sin(i/20) * renderer.height],
                [35, 50],
                new Sprite('img/bosses.png',
                           [3, 154],
                           [40, 35],
                           6,
                           [0, 1, 2, 3])
            );
            scene.addObject(enemy);
        }

        var player = new Player(
            [50, 50],
            [18, 18],
            new Sprite('img/bosses.png',
                       [211, 483],
                       [27, 19],
                       3,
                       [0, 1])
        );
        player.collide = true;
        player.id = 'player';
        scene.addObject(player);
    }

    var Player = SceneObject.extend({
        init: function(pos, size, sprite) {
            this.parent(pos, size, sprite);
            this.lastShot = 0;
        },

        update: function(dt) {
            // Move with the screen.
            // TODO: Move this magic number to a global somewhere?
            this.pos[0] += 20 * dt;

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

            if(input.isFiring()) {
                this.shoot();
            }

            // Touch movement.
            this.pos[0] += input.dpadOffset[0] * 30 * dt;
            this.pos[1] += input.dpadOffset[1] * 30 * dt;

            // Bounds-check position.
            var camX = _scene.camera.pos[0];
            var maxX = _renderer.width + camX - this.size[0];
            var maxY = _renderer.height - this.size[1];
            this.pos[0] = bound(this.pos[0], camX, maxX);
            this.pos[1] = bound(this.pos[1], 0, maxY);

            this.parent(dt);
        },

        shoot: function() {
            if(Date.now() - this.lastShot > 100) {
                this._scene.addObject(new Laser(
                    [this.pos[0] + this.size[0],
                     this.pos[1] + this.size[1] / 2]
                ));

                this.lastShot = Date.now();
            }
        }
    });

    var Laser = SceneObject.extend({
        init: function(pos) {
            this.parent(pos, [10, 5]);
            this.collide = true;
        },

        update: function(dt) {
            this.pos[0] += 1000 * dt;
            var camX = _scene.camera.pos[0];
            var maxX = _renderer.width + camX - this.size[0];
            if (this.pos[0] >= maxX) {
                this.remove();
            }
        },

        render: function(ctx) {
            ctx.fillRect(0, 0, 10, 5);
        },

        onCollide: function(obj) {
            if(obj instanceof Enemy) {
                obj.remove();
                this.remove();
            }
        }
    });

    var Enemy = SceneObject.extend({
        update: function(dt) {
            this.parent(dt);
            //this.pos[1] += dt;
        },

        onCollide: function(obj) {
            if(obj instanceof Player) {
                obj.remove();
            }
        }
    });

    var Floor = SceneObject.extend({
        init: function(renderer, sprite) {
            // Add an additional sprite so that we can scroll it
            var size = [renderer.width + sprite.size[0],
                         renderer.height];

            this.parent(null, size, sprite);

            var _this = this;
            renderer.onResize(function(w, h) {
                _this.size[0] = w + sprite.size[0];
                _this.size[1] = h;
            });
        },

        update: function(dt) {
            this.sprite.update(dt);

            // Get the screen position, and if it's scrolled more than
            // the size of the sprite, snap it back to [0, 0]
            var pos = this._scene.getScreenPos(this.pos);
            var sizeX = this.sprite.size[0];
            if(pos[0] < -sizeX) {
                this.pos[0] += -pos[0];
            }
        },

        render: function(ctx) {
            if(!this.pattern) {
                this.pattern = ctx.createPattern(resources.get('img/floor.png'),
                                                'repeat');
            }


            ctx.fillStyle = this.pattern;
            ctx.fillRect(0, 0, this.size[0], this.size[1]);
        }
    });

    return { init: init };
});
