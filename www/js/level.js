define(function(require) {
    var SceneObject = require('./sceneobject');
    var Sprite = require('./sprite');

    var input = require('./input');
    var resources = require('./resources');

    function init(scene, renderer) {
        scene.addObject(new Floor(
            renderer,
            new Sprite('img/dungeon.png', [333, 897], [16, 16], 0)
        ));

        var enemy = new Enemy(
            [400, 100],
            [50, 50],
            new Sprite('img/bosses.png',
                       [323, 516],
                       [40, 50],
                       2,
                       [0, 1])
        );
        scene.addObject(enemy);

        var player = new Player(
            [50, 50],
            [50, 50],
            new Sprite('img/bosses.png',
                       [211, 483],
                       [27, 19],
                       3,
                       [0, 1])
        );
        player.id = 'player';
        scene.addObject(player);
    }

    var Player = SceneObject.extend({
        update: function(dt) {
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

            // Touch movement.
            this.pos[0] += input.dpadOffset[0] * 30 * dt;
            this.pos[1] += input.dpadOffset[1] * 30 * dt;

            // TODO: Bounds check position.

            this.parent(dt);
        }
    });

    var Enemy = SceneObject.extend({
        update: function(dt) {
            this.parent(dt);
            //this.pos[1] += dt;
        },

        onCollide: function(obj) {
            obj.remove();
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