
define(function(require) {
    var resources = require('./resources');
    
    function Sprite(url, pos, size, speed, frames, dir, once) {
        this.pos = pos;
        this.size = size;
        this.speed = typeof speed === 'number' ? speed : 0;
        this.frames = frames;
        this._index = 0;
        this.url = url;
        this.dir = dir || 'horizontal';
        this.once = once;
    };

    Sprite.prototype = {
        flipHorizontal: function(val) {
            this.flipHoriz = val;
        },

        setOffset: function(offset) {
            this.offset = offset;
        },

        randomize: function() {
            if(this.speed > 0) {
                this._index += Math.random() * this.frames.length * .2;
            }

            return this;
        },

        clone: function() {
            return new Sprite(this.url,
                              [this.pos[0], this.pos[1]],
                              [this.size[0], this.size[1]],
                              this.speed,
                              this.frames && this.frames.slice(),
                              this.dir,
                              this.once);
        },

        update: function(dt) {
            this._index += this.speed*dt;
        },

        render: function(ctx) {
            var frame;

            if(this.speed > 0) {
                var max = this.frames.length;
                var idx = Math.floor(this._index);
                frame = this.frames[idx % max];

                if(this.once && idx >= max) {
                    this.done = true;
                    return;
                }
            }
            else {
                frame = 0;
            }


            var x = this.pos[0];
            var y = this.pos[1];

            if(this.dir == 'vertical') {
                y += frame * this.size[1];
            }
            else {
                x += frame * this.size[0];
            }

            var dest = this.offset || [0, 0];

            if(this.flipHoriz) {
                ctx.scale(-1, 1);
            }

            ctx.drawImage(resources.get(this.url),
                          x, y,
                          this.size[0], this.size[1],
                          dest[0], dest[1],
                          this.size[0], this.size[1]);
        }
    };

    return Sprite;
});
