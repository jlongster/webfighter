define(function(require) {
    var resources = require('./resources');
    var Obj = require('./Object');

    return Obj.extend({
        init: function(url, pos, size, speed, frames) {
            this.pos = pos;
            this.size = size;
            this.speed = speed || 6;
            this.frames = frames;
            this._index = 0;
            this.url = url;
            this.scale = vec2.create([1, 1]);

            resources.load(url);
        },

        update: function(dt) {
            this._index += this.speed*dt;
        },

        setScale: function(scale) {
            this.scale = scale;
        },

        flipHorizontal: function(val) {
            this.flipHoriz = val;
        },

        getNumFrames: function() {
            if(this.speed === 0) {
                return 1;
            }
            else if(this.frames) {
                return this.frames.length;
            }
            else {
                return Math.floor(resources.get(this.url).width / this.size[0]);
            }
        },
        
        render: function(ctx, target, clip) {
            var frame;
            var max = this.getNumFrames();
            clip = clip || this.size;

            if(this.frames) {
                frame = this.frames[Math.floor(this._index) % max];
            }
            else {
                frame = Math.floor(this._index % max);
            }

            ctx.save();
            
            if(this.flipHoriz) {
                ctx.translate(target[0] + this.size[0] * this.scale[0], target[1]);
                ctx.scale(-this.scale[0], this.scale[1]);
            }
            else {
                ctx.translate(target[0], target[1]);
                ctx.scale(this.scale[0], this.scale[1]);
            }

            ctx.drawImage(resources.get(this.url),
                          this.pos[0] + frame * this.size[0],
                          this.pos[1],
                          Math.min(this.size[0], clip[0]),
                          Math.min(this.size[1], clip[1]),
                          0, 0,
                          Math.min(this.size[0], clip[0]),
                          Math.min(this.size[1], clip[1]));
            ctx.restore();
        }
    });
});