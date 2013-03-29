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
            this._scoreEl = document.querySelector('.score span');
            this._lifeEl = document.querySelector('.life span');
            this.weapons = [];
            this.life = 3;

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

            this._lifeEl.textContent = this.life;
            this.sprite = this.sprites['default'];
        },

        update: function(dt) {
            this.sprite = this.sprites['default'];

            // Move with the screen.
            // TODO: Move this magic number to a global somewhere?
            this.pos[0] += 20 * dt;

            if(input.isDown('w') || input.isDown('UP')) {
                this.pos[1] -= 250 * dt;
                this.sprite = this.sprites['up'];
            }

            if(input.isDown('a') || input.isDown('LEFT')) {
                this.pos[0] -= 250 * dt;
            }

            if(input.isDown('s') || input.isDown('DOWN')) {
                this.pos[1] += 250 * dt;
                this.sprite = this.sprites['down'];
            }

            if(input.isDown('d') || input.isDown('RIGHT')) {
                this.pos[0] += 250 * dt;
            }

            if(input.isFiring()) {
                this.shoot();
            }

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
            var scene = this._scene;

            var front = [
                this.pos[0] + this.size[0],
                this.pos[1] + this.size[1] / 2 - sprites.laser.sprite.size[1] / 2
            ];

            var center = [
                this.pos[0] + this.size[0] / 2 - sprites.laser.sprite.size[1] / 2,
                this.pos[1] + this.size[1] / 2
            ];

            if(Date.now() - this.lastShot > 100) {
                scene.addObject(
                    new Laser(this._renderer, vec2.create(front), [1, 0], 1000)
                );

                for(var i=0; i<this.weapons.length; i++) {
                    var w = this.weapons[i];

                    if(w == 'multi') {
                        for(var j=0; j<5; j++) {
                            scene.addObject(
                                new Laser(
                                    this._renderer,
                                    vec2.createFrom(
                                        front[0],
                                        front[1] + Math.random() * 50 - 25
                                    ),
                                    [1, 0],
                                    1000
                                )
                            );
                        }
                    }
                    else if(w == 'side') {
                        scene.addObject(
                            new Laser(
                                this._renderer,
                                vec2.createFrom(center[0],
                                                center[1] - this.sprite.size[1]),
                                [0, -1],
                                1000,
                                sprites.upLaser
                            )
                        );

                        scene.addObject(
                            new Laser(
                                this._renderer,
                                vec2.createFrom(center[0],
                                                center[1] + this.sprite.size[1]),
                                [0, 1],
                                1000,
                                sprites.downLaser
                            )
                        );
                    }
                }

                this.lastShot = Date.now();
            }
        },

        hit: function(obj) {
            this.life--;
            this._lifeEl.textContent = this.life;

            if(this.life <= 0) {
                this.remove();
                this._scene.addObject(new Explosion(this.pos));
                this.gameOver = true;
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
        init: function(renderer, pos, dir, speed, spriteInfo) {
            spriteInfo = spriteInfo || sprites.laser;
            
            this.parent(pos,
                        spriteInfo.bounds,
                        spriteInfo.sprite.clone());
            this._renderer = renderer;
            this.dir = vec2.normalize(dir || [1, 0]);
            this.speed = speed || 300;
        },

        update: function(dt) {
            var speed = this.speed;
            this.pos[0] += this.dir[0] * speed * dt;
            this.pos[1] += this.dir[1] * speed * dt;

            var camX = this._scene.camera.pos[0];
            var minX = camX - this.size[0];
            var maxX = this._renderer.width + camX - this.size[0];

            if (this.pos[0] < minX || this.pos[0] > maxX) {
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

                var diffY = sprites.explosion.sprite.size[1] - this.sprite.size[1];
                var pos = this.pos;
                pos[1] -= diffY / 2;

                this._scene.addObject(new Explosion(pos));
            }
        },

        collide: true
    });

    var EnemyLaser = Laser.extend({
        init: function(renderer, pos, dir, speed) {
            this.parent(renderer, pos, dir, speed);
            this.sprite.flipHorizontal(true);
        },

        onCollide: function(obj) {
            if(obj instanceof Player && !this.isRemoved()) {
                obj.hit(this);
                this.remove();
            }
        },

        collide: true
    });

    var Enemy = SceneObject.extend({
        init: function(renderer, pos, size, sprite, components) {
            this._renderer = renderer;
            this.components = components;
            this.parent(pos, size, sprite);
        },

        update: function(dt) {
            this.parent(dt);

            if(this.components) {
                var c = this.components;
                for(var i=0, l=c.length; i<l; i++) {
                    c[i].call(this);
                }
            }

            // Remove objects after they leave the screen.
            if (this.pos[0] < this._scene.camera.pos[0] - this.size[0]) {
                this.remove();
            }
        },

        onCollide: function(obj) {
            if(obj instanceof Player) {
                obj.hit(this);
                this.remove();
                this._scene.addObject(new Explosion(this.pos));
            }
        },

        points: 0
    });

    var Boss = Enemy.extend({
        points: 300,

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
        }
    });

    var CircleEnemy = Enemy.extend({
        points: 100,

        init: function(renderer, spriteInfo, pos, components, age) {
            this.parent(
                renderer,
                pos,
                spriteInfo.bounds,
                spriteInfo.sprite.clone(),
                components
            );
            this.age = age || 0;
            this.startingPos = [this.pos[0], this.pos[1]];
        },

        update: function(dt) {
            this.parent(dt);
            this.age += dt;

            this.startingPos[0] -= 20*dt;
            this.pos[0] = this.startingPos[0] + Math.sin(this.age * 1.5) * 100;
            this.pos[1] = this.startingPos[1] + Math.cos(this.age * 1.5) * 100;
        }
    });

    var SineEnemy = Enemy.extend({
        points: 100,

        init: function(renderer, spriteInfo, pos, components, age) {
            this.parent(
                renderer,
                pos,
                spriteInfo.bounds,
                spriteInfo.sprite.clone(),
                components
            );
            this.age = age || 0;
            this.startingPos = [this.pos[0], this.pos[1]];
        },

        update: function(dt) {
            this.parent(dt);
            this.age += dt;

            this.pos[0] -= 75*dt;
            this.pos[1] = this.startingPos[1] + Math.sin(this.age * 3) * 50;
        }
    });

    var SurpriseEnemy = Enemy.extend({
        points: 100,

        init: function(renderer, spriteInfo, pos, components, speed, age) {
            this.parent(renderer,
                        pos,
                        spriteInfo.bounds,
                        spriteInfo.sprite.clone(),
                        components);
            this.age = age || 0;
            this.speed = speed || 20;

            if(this.pos[1] < renderer.height / 2) {
                this.dir = 'up';
            }
            else {
                this.dir = 'down';
            }
        },

        update: function(dt) {
            this.sprite.update(dt);
            this.age += dt;

            if(this.dir == 'down') {
                this.pos[1] -= this.speed * dt;
            }
            else {
                this.pos[1] += this.speed * dt;
            }
        }
    });

    var Explosion = SceneObject.extend({
        init: function(pos) {
            this.parent(pos, null,
                        sprites.explosion.sprite.clone().randomize());
        },

        update: function(dt) {
            this.sprite.update(dt);

            if(this.sprite.done) {
                this.remove();
            }
        }
    });

    var Powerup = SceneObject.extend({
        collide: true,

        init: function(renderer, pos, type) {
            this.parent(pos,
                        [16, 16],
                       new Sprite('img/sprites.png',
                                  [0, 128],
                                  [16, 16],
                                  6,
                                  [0, 1, 2, 1, 0]));
            this.type = type;
        },

        onCollide: function(obj) {
            if(obj instanceof Player) {
                obj.weapons.push(this.type);
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
                _this.size[0] = w + img.width,
                _this.size[1] = h;
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
        collide: true,

        init: function(renderer, startX, endX, func) {
            this.parent([startX, 0],
                        [endX - startX, renderer.height]);
            this.func = func;

            var _this = this;
            renderer.onResize(function(w, h) {
                _this.size[1] = h;
            });
        },

        onCollide: function(obj) {
            if(obj instanceof Player) {
                this.func();
            }
        }
    });

    // sprites

    var sprites = {
        fireShip: {
            bounds: [24, 21],
            sprite: new Sprite('img/sprites.png',
                               [32, 192],
                               [24, 21],
                               6,
                               [0, 1],
                               'vertical')
        },
        metalShip: {
            bounds: [24 ,22],
            sprite: new Sprite('img/sprites.png',
                               [0, 0],
                               [24, 22],
                               6,
                               [0, 1, 2, 1])
        },
        saw: {
            bounds: [49, 49],
            sprite: new Sprite('img/sprites.png',
                               [64, 192],
                               [49, 49],
                               24,
                               [0, 1, 2, 3])
        },
        explosion: {
            bounds: [1, 1],
            sprite: new Sprite('img/sprites.png',
                               [0, 64],
                               [39, 39],
                               16,
                               [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                               null,
                               true)
        },
        laser: {
            bounds: [11, 4],
            sprite: new Sprite('img/sprites.png',
                               [0, 32],
                               [11, 4])
        },
        upLaser: {
            bounds: [14, 9],
            sprite: new Sprite('img/sprites.png',
                               [32, 32],
                               [14, 9])
        },
        downLaser: {
            bounds: [14, 9],
            sprite: new Sprite('img/sprites.png',
                               [32, 41],
                               [14, 9])
        }
    };

    return {
        Player: Player,
        Laser: Laser,
        EnemyLaser: EnemyLaser,
        Enemy: Enemy,
        Boss: Boss,
        CircleEnemy: CircleEnemy,
        SineEnemy: SineEnemy,
        SurpriseEnemy: SurpriseEnemy,
        Explosion: Explosion,
        Floor: Floor,
        Trigger: Trigger,
        Powerup: Powerup,
        sprites: sprites
    };
});
