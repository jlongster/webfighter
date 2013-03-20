define(function(require) {
    var SceneObject = require('./sceneobject');
    var Sprite = require('./sprite');

    var input = require('./input');
    var resources = require('./resources');

    var Player = SceneObject.extend({
        init: function(renderer, pos) {
            this.parent(pos, [27, 19]);
            this._renderer = renderer;
            this.lastShot = 0;
            this.score = 0;
            // TODO: There has to be a better way to do this.
            this._scoreEl = document.getElementsByClassName('score')[0];

            this.sprites = {
                'default': new Sprite('img/sprites.png',
                                      [0, 192 + 23 * 2],
                                      [27, 23]),
                'up': new Sprite('img/sprites.png',
                                 [0, 192],
                                 [27, 23]),
                'down': new Sprite('img/sprites.png',
                                 [0, 192 + 23 * 4],
                                 [27, 23])
            };

            this.sprite = this.sprites['default'];
        },

        update: function(dt) {
            this.sprite = this.sprites['default'];

            // Move with the screen.
            // TODO: Move this magic number to a global somewhere?
            this.pos[0] += 20 * dt;

            if(input.isDown('w')) {
                this.pos[1] -= 250 * dt;
                this.sprite = this.sprites['up'];
            }

            if(input.isDown('a')) {
                this.pos[0] -= 250 * dt;
            }

            if(input.isDown('s')) {
                this.pos[1] += 250 * dt;
                this.sprite = this.sprites['down'];
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
                var laser = new Laser(
                    this._renderer
                );
                laser.pos = [this.pos[0] + this.size[0],
                             this.pos[1] + this.size[1] / 2 - laser.size[1] / 2];
                this._scene.addObject(laser);

                if(this.superWeapon) {
                    for(var i=0; i<5; i++) {
                        var laser = new Laser(
                            this._renderer
                        );
                        laser.pos = [this.pos[0] + this.size[0],
                                     this.pos[1] + this.size[1] / 2 + Math.random() * 50 - 25];
                        this._scene.addObject(laser);
                    }
                }

                this.lastShot = Date.now();
            }
        },

        hit: function(obj) {
            // TODO: Decrement life, shield, etc.
            this.remove();
            this.gameOver = true;
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
            this.parent(pos,
                        [11, 4],
                        new Sprite('img/sprites.png',
                                   [0, 32],
                                   [11, 4]));
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
        init: function(renderer, pos) {
            this.parent(renderer, pos);
            this.sprite.flipHorizontal(true);
        },

        update: function(dt) {
            this.pos[0] -= 300 * dt;
            if (this.pos[0] < this._scene.camera.pos[0] - this.size[0]) {
                this.remove();
            }
        },

        onCollide: function(obj) {
            if(obj instanceof Player) {
                obj.hit(this);
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
                obj.hit(this);
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
        init: function(renderer, pos, movementType, age) {
            this.parent(
                renderer,
                pos,
                [36, 36],
                new Sprite('img/sprites.png',
                           [0, 64],
                           [32, 45],
                           6,
                           [0, 1, 2, 3, 2, 1])
            );
            this.lastShot = 0;
            this.age = age || 0;
            this.startingPos = [this.pos[0], this.pos[1]];
            this.movementType = movementType || 'sine';
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
            this.age += dt;

            if(Math.random() < 0.005) {
                //this.shoot();
            }

            if(this.movementType == 'circle') {
                this.startingPos[0] -= 20*dt;
                this.pos[0] = this.startingPos[0] + Math.sin(this.age * 1.5) * 100;
                this.pos[1] = this.startingPos[1] + Math.cos(this.age * 1.5) * 100;
            }
            else {
                this.pos[0] -= 75*dt;
                this.pos[1] = this.startingPos[1] + Math.sin(this.age * 3) * 50;
            }
        },

        points: 100
    });

    var Powerup = SceneObject.extend({
        init: function(renderer, pos) {
            this.parent(pos,
                        [16, 16],
                       new Sprite('img/sprites.png',
                                  [0, 128],
                                  [16, 16],
                                  6,
                                  [0, 1, 2, 1, 0]));
        },

        onCollide: function(obj) {
            if(obj instanceof Player) {
                obj.superWeapon = true;
                this.remove();
            }
        }
    });

    var Floor = SceneObject.extend({
        init: function(renderer, imgName) {
            this.imgName = imgName;
            var img = resources.get(this.imgName);

            // Add an additional sprite so that we can scroll it
            var size = [renderer.width + img.width,
                        renderer.height];

            this.parent(null, size);
    
            var _this = this;
            renderer.onResize(function(w, h) {
                // _this.size[0] = w + sprite.size[0];
                // _this.size[1] = h;
            });
        },

        update: function(dt) {
            var img = resources.get(this.imgName);

            if(this.imgName == 'img/background2.png') {
                this.pos[0] -= 15*dt;
            }
            else if(this.imgName == 'img/background3.png') {
                this.pos[0] -= 30*dt;
            }

            // Get the screen position, and if it's scrolled more than
            // the size of the sprite, snap it back to [0, 0]
            var pos = this._scene.getScreenPos(this.pos);
            var sizeX = this.size[0];
            if(pos[0] < -img.width) {
                this.pos[0] += -pos[0];
            }
        },

        render: function(ctx) {
            if(!this.pattern) {
                this.pattern = ctx.createPattern(resources.get(this.imgName),
                                                'repeat');
            }


            ctx.fillStyle = this.pattern;
            ctx.fillRect(0, 0, this.size[0], this.size[1]);
        }
    });

    var Trigger = SceneObject.extend("Trigger", { 
        init: function(distance, width, height, func) {
            this.parent([distance, 0],
                        [width, height]);
            this.func = func;
        },

        onCollide: function(obj) {
            if(obj instanceof Player) {
                this.func();
            }
        }
    });

    return {
        Player: Player,
        Laser: Laser,
        EnemyLaser: EnemyLaser,
        Enemy: Enemy,
        Boss: Boss,
        Mook: Mook,
        Floor: Floor,
        Trigger: Trigger,
        Powerup: Powerup
    };
});
