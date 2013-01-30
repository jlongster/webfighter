define(function(require) {
    var SceneObject = require('./sceneobject');
    var Sprite = require('./sprite');

    var input = require('./input');
    var resources = require('./resources');

    var Player = SceneObject.extend({
        init: function(renderer, pos) {
            this.parent(
                pos,
                [18, 18],
                new Sprite('img/bosses.png',
                           [211, 483],
                           [27, 19],
                           3,
                           [0, 1])
            );
            this._renderer = renderer;
            this.lastShot = 0;
            this.score = 0;
            // TODO: There has to be a better way to do this.
            this._scoreEl = document.getElementsByClassName('score')[0];
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
            var camX = this._scene.camera.pos[0];
            var maxX = this._renderer.width + camX - this.size[0];
            var maxY = this._renderer.height - this.size[1];
            this.pos[0] = bound(this.pos[0], camX, maxX);
            this.pos[1] = bound(this.pos[1], 0, maxY);

            this._scoreEl.textContent = this.score;
            this.parent(dt);
        },

        shoot: function() {
            if(Date.now() - this.lastShot > 100) {
                this._scene.addObject(new Laser(
                    this._renderer,
                    [this.pos[0] + this.size[0],
                     this.pos[1] + this.size[1] / 2]
                ));

                this.lastShot = Date.now();
            }
        },

        incrementScore: function(pts) {
            this.score += pts;
            if (this.score < 0) {
                this.score = 0;
            }
        },

        collide: true,
        id: 'player'
    });

    var Laser = SceneObject.extend({
        init: function(renderer, pos) {
            this.parent(pos, [10, 5]);
            this._renderer = renderer;
        },

        update: function(dt) {
            this.pos[0] += 1000 * dt;
            var camX = this._scene.camera.pos[0];
            var maxX = this._renderer.width + camX - this.size[0];
            if (this.pos[0] >= maxX) {
                this.remove();
            }
        },

        render: function(ctx) {
            ctx.fillRect(0, 0, 10, 5);
        },

        onCollide: function(obj) {
            if(obj instanceof Enemy) {
                var player = this._scene.getObject('player');
                if (player) {
                    player.incrementScore(obj.points);
                }
                obj.remove();
                this.remove();
            }
        },

        collide: true
    });

    var EnemyLaser = Laser.extend({
        update: function(dt) {
            this.pos[0] -= 300 * dt;
            if (this.pos[0] < this._scene.camera.pos[0] - this.size[0]) {
                this.remove();
            }
        },

        onCollide: function(obj) {
            if(obj instanceof Player) {
                obj.remove();
                this.remove();
            }
        },

        collide: true
    });

    var Enemy = SceneObject.extend({
        init: function(renderer, pos, size, sprite) {
            this._renderer = renderer;
            this.parent(pos, size, sprite);
        },

        update: function(dt) {
            this.parent(dt);
            // Remove objects after they leave the screen.
            if (this.pos[0] < this._scene.camera.pos[0] - this.size[0]) {
                this.remove();
            }
        },

        onCollide: function(obj) {
            if(obj instanceof Player) {
                obj.remove();
                this.remove();
            }
        },

        points: 0
    });

    var Boss = Enemy.extend({
        init: function(renderer, pos) {
            this.parent(
                renderer,
                pos,
                [35, 50],
                new Sprite('img/bosses.png',
                           [323, 516],
                           [40, 50],
                           2,
                           [0, 1])
            );
            this._startY = pos[1];
            this._age = 0;
        },

        update: function(dt) {
            this.parent(dt);
            this._age += dt;
            var dY = Math.sin(this._age * 2) * 30;
            this.pos[1] = this._startY + dY;
        },

        points: 300
    });

    var Mook = Enemy.extend({
        init: function(renderer, pos) {
            this.parent(
                renderer,
                pos,
                [35, 50],
                new Sprite('img/bosses.png',
                           [3, 154],
                           [40, 35],
                           6,
                           [0, 1, 2, 3])
            );
            this.lastShot = 0;
        },

        shoot: function() {
            if((Date.now() - this.lastShot > 500) &&
               (this.pos[0] < this._renderer.width + this._scene.camera.pos[0])) {
                this._scene.addObject(new EnemyLaser(
                    this._renderer,
                    [this.pos[0] - 10, /* EnemyLaser.size[0] */
                     this.pos[1] + this.size[1] / 2]
                ));
            }
        },

        update: function(dt) {
            this.parent(dt);
            if(Math.random() < 0.005) {
                this.shoot();
            }
        },

        points: 100
    });

    var Floor = SceneObject.extend({
        init: function(renderer) {
            // Add an additional sprite so that we can scroll it
            var size = [renderer.width + 16,
                         renderer.height];

            this.parent(
                null,
                size,
                new Sprite('img/dungeon.png', [333, 897], [16, 16], 0));

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

    return {
        Player: Player,
        Laser: Laser,
        Enemy: Enemy,
        Boss: Boss,
        Mook: Mook,
        Floor: Floor
    };
});
