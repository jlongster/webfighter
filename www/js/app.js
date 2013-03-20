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
    

    function getElement(id) {
        return document.getElementById(id);
    }

    function gameOver() {
        getElement('game-over').style.display = 'block';
        getElement('game-over-overlay').style.display = 'block';
        getElement('controls').style.display = 'none';
        input.disable();
    }

    function restart() {
        getElement('game-over').style.display = 'none';
        getElement('game-over-overlay').style.display = 'none';
        getElement('controls').style.display = 'block';
        input.enable();
        init(true);
    }

    function togglePause() {
        if(paused) {
            paused = false;
            getElement('pause').textContent = 'Pause';

            last = Date.now();
            requestAnimFrame(heartbeat);
        }
        else {
            paused = true;
            getElement('pause').textContent = 'Unpause';
        }
    }

    function init(onlyLevel) {
        var camera = new Camera();
        renderer = new Renderer();
        scene = new Scene(camera);

        level.init(scene, renderer);

        if(!onlyLevel) {
            input.init();

            getElement('play-again').addEventListener('click', restart);
            getElement('pause').addEventListener('click', togglePause);

            heartbeat();
        }
    }

    var last;
    function heartbeat() {
        if(!last) {
            last = Date.now();
        }

        var now = Date.now();
        var dt = (now - last) / 1000.0;

        scene.update(dt);
        renderer.render(scene);

        //renderer.debug(scene);
        //renderer.debug(scene, 'Trigger');

        if(scene.getObject('player').gameOver) {
            gameOver();
        }

        if(!paused) {
            last = now;
            requestAnimFrame(heartbeat);
        }
    }

    resources.load([
        'img/bosses.png',
        'img/sprites.png',
        'img/background.png',
        'img/background2.png',
        'img/background3.png'
    ]);
    resources.onReady(init);
});
