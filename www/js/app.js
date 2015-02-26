define(function(require) {
    require('./math');

    var util = require('./util');
    var clickEvent = util.clickEvent;
    var getElement = util.getElement;
    var getElements = util.getElements;

    var store = require('./store');
    var resources = require('./resources');
    var input = require('./input');
    var level = require('./level');

    var Renderer = require('./renderer');
    var Scene = require('./scene');
    var Camera = require('./camera');
    var Player = require('./units').Player;

    var renderer, scene, paused = true;

    function fullscreen() {
        var d = document;
        var b = d.body;
        var isFullscreen = (d.fullscreenElement ||
                            d.mozFullScreenElement ||
                            d.webkitFullscreenElement);

        if(!isFullscreen) {
            if(b.requestFullScreen) {
                b.requestFullScreen();
            }
            else if(b.mozRequestFullScreen) {
                b.mozRequestFullScreen();
            }
            else if(b.webkitRequestFullScreen()) {
                b.webkitRequestFullScreen();
            }
        }
        else {
            if(d.cancelFullScreen) {
                d.cancelFullScreen();
            }
            else if(d.mozCancelFullScreen) {
                d.mozCancelFullScreen();
            }
            else if(d.webkitCancelFullScreen) {
                d.webkitCancelFullScreen();
            }
        }
    }

    function gameOver() {
        getElement('game-over').style.display = 'block';
        getElement('game-over-overlay').style.display = 'block';
        getElements('#game-over .message')[0].textContent = 'GAME OVER!';
        getElements('#appbar .button').forEach(function(el) {
            el.style.display = 'none';
        });

        input.disable();
    }

    function gameWon() {
        gameOver();
        getElements('#game-over .message')[0].textContent = 'ENEMY DEFEATED!';
    }

    function restart() {
        getElement('game-over').style.display = 'none';
        getElement('game-over-overlay').style.display = 'none';
        getElements('.button').forEach(function(el) {
            el.style.display = 'block';
        });
        getElement('continue').style.display = 'none';

        input.enable();

        // create the scene objects

        var camera = new Camera([0, 0]);
        scene = new Scene(camera);
        renderer.reset();

        level.init(scene, renderer);

        // create the player

        var ship = 'playerShip1';
        if(store.isSelected('Carrot Ship', 'ships')) {
            ship = 'playerShip2';
        }
        else if(store.isSelected('Blaster', 'ships')) {
            ship = 'playerShip3';
        }
        else if(store.isSelected('Duel Fighter', 'ships')) {
            ship = 'playerShip4';
        }

        var player = new Player(renderer, [50, 50], ship);
        scene.addObject(player);

        if(store.isSelected('Reverse Plasma', 'weapons')) {
            player.weapons.push('plasma');
        }

        if(store.isSelected('Flying Hotdog', 'weapons')) {
            player.weapons.push('hotdog');
        }

        // reset the time and start the game if it's not already
        // running

        lastTime = Date.now();
        if(paused) {
            paused = false;
            requestAnimFrame(heartbeat);
        }
    }

    function gameScreen() {
        getElement('start-screen').style.display = 'none';
        getElement('appbar').style.display = 'block';
        getElement('controls').style.display = 'block';

        restart();
    }

    function mainScreen() {
        getElement('start-screen').style.display = 'block';
        getElement('appbar').style.display = 'none';
        getElement('controls').style.display = 'none';
        getElement('store-screen').style.display = 'none';
        getElement('game-over').style.display = 'none';
        getElement('game-over-overlay').style.display = 'none';

        paused = true;
    }

    function scoreScreen() {
        getElement('store-screen').style.display = 'block';
        getElement('start-screen').style.display = 'none';
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

    function init() {
        if(screen.mozLockOrientation) {
            screen.mozLockOrientation('landscape-primary');

            // document.addEventListener('visibilitychange', function() {
            //     if(document.visibilityState == 'visible') {
            //         screen.mozLockOrientation('landscape-primary');
            //     }
            // });

            document.addEventListener('mozfullscreenchange', function() {
                if(document.mozFullScreenEnabled) {
                    screen.mozLockOrientation('landscape-primary');
                }
            });
        }

        renderer = new Renderer();

        input.init();
        input.disable();

        // start screen

        getElement('play').addEventListener(clickEvent, function() {
            gameScreen();
        });

        getElement('store').addEventListener(clickEvent, function() {
            scoreScreen();
        });

        // store screen

        getElements('#store-screen button.back').forEach(function(el) {
            el.addEventListener(clickEvent, mainScreen);
        });

        store.init();

        // in-game

        getElement('play-again').addEventListener(clickEvent, restart);
        getElement('back-title').addEventListener(clickEvent, function() {
            if(!paused) {
                togglePause();
            }

            mainScreen();
        });
        getElement('pause').addEventListener(clickEvent, togglePause);
        getElement('continue').addEventListener(clickEvent, togglePause);
        getElement('restart').addEventListener(clickEvent, restart);

        document.addEventListener('keyup', function(e) {
            if(String.fromCharCode(e.keyCode) == 'P') {
                togglePause();
            }
        });

        // must use the click event for fullscreen access (just a
        // bug for now)
        getElement('fullscreen').addEventListener('click', fullscreen);
    }

    var lastTime;
    function heartbeat() {
        if(paused) {
            return;
        }

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
        else if(scene.getObject('player').gameWon) {
            gameWon();
        }

        lastTime = now;
        requestAnimFrame(heartbeat);
    }

    resources.load([
        'img/sprites.png',
        'img/background.png',
        'img/background2.png',
        'img/background3.png'
    ]);
    resources.onReady(init);

    return {
        start: heartbeat
    };
});
