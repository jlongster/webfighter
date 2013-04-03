define(function(require) {
    require('receiptverifier');
    require('./install-button');
    require('./math');

    var resources = require('./resources');
    var input = require('./input');
    var level = require('./level');

    var Renderer = require('./renderer');
    var Scene = require('./scene');
    var Camera = require('./camera');

    var renderer, scene, paused = false;
    var clickEvent = 'ontouchstart' in window ? 'touchstart' : 'click';

    function getElement(id) {
        return document.getElementById(id);
    }

    function getElementC(class_) {
        return Array.prototype.slice.call(
            document.querySelectorAll('.' + class_)
        );
    }

    function gameOver() {
        getElement('game-over').style.display = 'block';
        getElement('game-over-overlay').style.display = 'block';

        getElementC('button').forEach(function(el) {
            el.style.display = 'none';
        });

        input.disable();
    }

    function restart() {
        getElement('game-over').style.display = 'none';
        getElement('game-over-overlay').style.display = 'none';
        getElementC('button').forEach(function(el) {
            el.style.display = 'block';
        });
        getElement('continue').style.display = 'none';

        if(paused) {
            togglePause();
        }

        input.enable();
        init(true);
    }

    function togglePause() {
        if(paused) {
            paused = false;
            getElement('continue').style.display = 'none';
            getElement('pause').style.display = 'block';

            lastTime = Date.now();
            requestAnimFrame(heartbeat);
        }
        else {
            paused = true;
            getElement('pause').style.display = 'none';
            getElement('continue').style.display = 'block';
        }
    }

    function init(onlyLevel) {
        var camera = new Camera([1900, 0]);
        renderer = new Renderer();
        scene = new Scene(camera);

        level.init(scene, renderer);

        if(!onlyLevel) {
            input.init();

            getElement('play-again').addEventListener(clickEvent, restart);
            getElement('pause').addEventListener(clickEvent, togglePause);
            getElement('continue').addEventListener(clickEvent, togglePause);
            getElement('restart').addEventListener(clickEvent, restart);

            heartbeat();
        }
    }

    var lastTime;
    function heartbeat() {
        if(!lastTime) {
            lastTime = Date.now();
        }

        var now = Date.now();
        var dt = (now - lastTime) / 1000.0;

        scene.update(dt);
        renderer.render(scene);

        //renderer.debug(scene);
        //renderer.debug(scene, 'Trigger');

        if(scene.getObject('player').gameOver) {
            gameOver();
        }

        if(!paused) {
            lastTime = now;
            requestAnimFrame(heartbeat);
        }
    }

    resources.load([
        'img/sprites.png',
        'img/background.png',
        'img/background2.png',
        'img/background3.png'
    ]);
    resources.onReady(init);
});
