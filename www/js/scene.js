define(function(require) {
    var Obj = require('./object');

    function collides(x, y, r, b, x2, y2, r2, b2) {
        return !(r <= x2 || x > r2 ||
                 b <= y2 || y > b2);
    }

    return Obj.extend({
        init: function(camera) {
            this.objects = [];
            this.objectsById = {};
            this.camera = camera;
            this.addedObjects = [];
        },

        addObject: function(obj) {
            this.addedObjects.push(obj);
        },

        getObject: function(id) {
            return this.objectsById[id];
        },

        removeObject: function(obj) {
            obj._sceneRemove = true;
        },

        getScreenPos: function(pos) {
            var res = vec2.create();
            vec2.subtract(pos, this.camera.pos, res);
            return res;
        },

        update: function(dt) {
            this.camera.update(dt);

            // TODO: might be able to optimize this and not create a
            // new array each time
            var nextObjects = [];

            var objs = this.objects;
            for(var i=0, l=objs.length; i<l; i++) {
                objs[i].update(dt);

                if(!objs[i]._sceneRemove) {
                    nextObjects.push(objs[i]);
                }
            }

            this.objects = nextObjects;

            var added = this.addedObjects;
            for(var i=0, l=added.length; i<l; i++) {
                var obj = added[i];

                this.objects.push(obj);
                obj._scene = this;

                if(obj.id) {
                    this.objectsById[obj.id] = obj;
                }
            }

            this.addedObjects = [];
            this.checkCollisions();
        },

        checkCollisions: function() {
            var objs = this.objects;
            for(var i=0, l=objs.length; i<l; i++) {
                if(objs[i] && objs[i].collide) {
                    this.checkObjCollisions(objs[i]);
                }
            }
        },

        checkObjCollisions: function(obj) {
            var objs = this.objects;
            for(var i=0, l=objs.length; i<l; i++) {
                var pos = obj.pos;
                var size = obj.size;

                if(objs[i] && objs[i] != obj) {
                    var obj2 = objs[i];
                    var pos2 = obj2.pos;
                    var size2 = obj2.size;

                    if(collides(pos[0], pos[1],
                                pos[0] + size[0], pos[1] + size[1],
                                pos2[0], pos2[1],
                                pos2[0] + size2[0], pos2[1] + size2[1])) {
                        if(obj.onCollide) {
                            obj.onCollide(obj2);
                        }

                        if(obj2.onCollide) {
                            obj2.onCollide(obj);
                        }
                    }
                }
            }
        }
    });
});
