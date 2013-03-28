define(function(require) {
    // This is inspired by the gl-maxtrix library[1], which doesn't
    // have 2d vectors
    //
    // [1] https://github.com/toji/gl-matrix

    var ArrayType = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
    var FLOAT_EPSILON = 0.000001;

    var vec2 = {};

    vec2.create = function(vec) {
        var dest = new ArrayType(2);

        if(vec) {
            dest[0] = vec[0];
            dest[1] = vec[1];
        }
        else {
            dest[0] = dest[1] = 0;
        }

        return dest;
    };

    vec2.createFrom = function (x, y) {
        var dest = new ArrayType(2);

        dest[0] = x;
        dest[1] = y;

        return dest;
    };

    vec2.set = function (vec, dest) {
        dest[0] = vec[0];
        dest[1] = vec[1];

        return dest;
    };

    vec2.equal = function (a, b) {
        return a === b || (
            Math.abs(a[0] - b[0]) < FLOAT_EPSILON &&
            Math.abs(a[1] - b[1]) < FLOAT_EPSILON
        );
    };

    vec2.add = function(vec, vec2, dest) {
        if(!dest || vec === dest) {
            vec[0] += vec2[0];
            vec[1] += vec2[1];
            return vec;
        }

        dest[0] = vec[0] + vec2[0];
        dest[1] = vec[1] + vec2[1];
        return dest;
    };

    vec2.subtract = function (vec, vec2, dest) {
        if (!dest || vec === dest) {
            vec[0] -= vec2[0];
            vec[1] -= vec2[1];
            return vec;
        }

        dest[0] = vec[0] - vec2[0];
        dest[1] = vec[1] - vec2[1];
        return dest;
    };

    vec2.multiply = function (vec, vec2, dest) {
        if (!dest || vec === dest) {
            vec[0] *= vec2[0];
            vec[1] *= vec2[1];
            return vec;
        }

        dest[0] = vec[0] * vec2[0];
        dest[1] = vec[1] * vec2[1];
        return dest;
    };

    vec2.scale = function (vec, val, dest) {
        if (!dest || vec === dest) {
            vec[0] *= val;
            vec[1] *= val;
            return vec;
        }

        dest[0] = vec[0] * val;
        dest[1] = vec[1] * val;
        return dest;
    };

    vec2.length = function (vec) {
        var x = vec[0], y = vec[1];
        return Math.sqrt(x * x + y * y);
    };

    vec2.str = function (vec) {
        return '[' + vec[0] + ', ' + vec[1] + ']';
    };

    vec2.normalize = function(vec, dest) {
        if (!dest) { dest = vec; }

        var x = vec[0];
        var y = vec[1];
        var len = Math.sqrt(x * x + y * y);

        if(!len) {
            dest[0] = 0;
            dest[1] = 0;
        }
        else if(len === 1) {
            dest[0] = x;
            dest[1] = y;
            return dest;
        }

        len = 1 / len;
        dest[0] = x * len;
        dest[1] = y * len;
        return dest;
    };

    function bound(i, min, max) {
        return Math.max(Math.min(i, max), min);
    }

    // Make it global because it is used so much
    window.vec2 = vec2;
    window.bound = bound;
});
