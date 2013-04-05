
# Making Webfighter

[Webfighter](http://jlongster.github.com/webfighter/) is a game inspired by R-Type and Tyrian. In fact, it uses [Tyrian's graphics](http://www.lostgarden.com/2007/04/free-game-graphics-tyrian-ships-and.html) which have been released for free. The game is a side-scrolling shooter where you hunt down an alien bug and destroy it.

It works on desktop and mobile, with much thought put into the mobile experience. This article describes how webfighter works, and explains many things learned about creating games for mobile.

![](https://raw.github.com/jlongster/webfighter/master/docs/screenshot.png)

## Basics

Let's start with the basic architecture. This may surprise you, but webfighter does not use a game engine. I believe that there are already several examples of existing game engines out there, and this is a chance to show instead what it's like to work with only web APIs.

The result is, of course, a few files that are basically a minimal game engine. The code that makes up the core components is very small, and hackable, however. During this process I was inspired to write a [detailed blog post](http://jlongster.com/Making-Sprite-based-Games-with-Canvas) about this very process of making games with minimal code, so feel free to dive into that as well. The post focuses on sprite animations, but another post is coming describing scene managers and renderers.

There are 3 main components: scene, renderer, and sprite. The `Scene` object implements the ability to add and remove objects to the scene, update them every frame, and check collisions. The `Renderer` object implements the ability to render every object in the scene and manages the viewport. The `Sprite` object manages images and animating them. There are more components, but these make up the most important parts of the system.

## Art

Let's take a step back and think about art. Games are complex enough technically, who has time to sit down and develop a bunch of awesome art for it? Maybe you have an artist friend who will help out. If you do, awesome!

If you don't have any artist friends willing to help out, I would highly encourage you to use existing art released for free. You can look around [HasGraphics](http://hasgraphics.com/) for a graphics set that you like. As mentioned previously, webfighter reuses the [Tyrian graphics](http://www.lostgarden.com/2007/04/free-game-graphics-tyrian-ships-and.html) for some awesome ship and enemy art.

## High-Level Overview

Let's start with [app.js](https://github.com/jlongster/webfighter/blob/master/www/js/app.js). This is the first file loaded. We are using [RequireJS](http://requirejs.org/) for javascript modules, and the first part simple requires all of the necessary components.

Next you'll find several functions which trigger certain game states, like `gaveOver` and `gameWon`. The most important functions are `init`, which creates the scene and adds everything to it, and `hearbeat`, which uses [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/DOM/window.requestAnimationFrame) to update and render the scene at around 60fps, or whatever is appropriate for the user.

### Levels & Enemies

The file [`units.js`](https://github.com/jlongster/webfighter/blob/master/www/js/units.js) defines every single entity in the game. An entity is an object with a `render` and `update` method. Technically the system implements this as the [`SceneObject`](https://github.com/jlongster/webfighter/blob/master/www/js/sceneobject.js) type, and has a few additional methods like `remove`.

The file [`sprite.js`](https://github.com/jlongster/webfighter/blob/master/www/js/sprite.js) defines an object which handles animations. The game works with one big sprite sheet, with references to individual sprites inside of it, and animates by rotating through several frames in the sheet. The `Sprite` class handles all of the gritty details of this. If you want more information about this, read [my blog post](https://github.com/jlongster/webfighter/blob/master/www/js/level.js).

[`level.js`](https://github.com/jlongster/webfighter/blob/master/www/js/level.js) pulls it all together and adds everything to the scene. It uses an entity type called `Trigger` which triggers when to add certain enemies to scene, and adds the background and other structural components of the game.

### The Renderer and Scene Manager

There are two core components which drive the whole game: the renderer and the scene manager. The renderer, defined in [`renderer.js`](https://github.com/jlongster/webfighter/blob/master/www/js/renderer.js), takes a scene and renders all the objects in it. It also handles changes in the window size and optimizes the viewport. The scene manager, defined in [`scene.js`](https://github.com/jlongster/webfighter/blob/master/www/js/scene.js) allows you to add/remove objects to a scene, and handles collision detection.

Both of these objects are relatively simple, around 115 lines of code on average, and are a simple example of how to create games with relatively little code.

Back in `init` in app.js, we [create a scene and renderer](https://github.com/jlongster/webfighter/blob/master/www/js/app.js#L106). The main game loop, `heartbeat`, updates the scene with `scene.update(dt)` and renders with with `renderer.render(scene)`. This happens continuously, creating the fluid gameplay experience.

### Input and Resources

The last two pieces are input and resource management. The input library, defined in [`input.js`](https://github.com/jlongster/webfighter/blob/master/www/js/input.js), is a state-based manager that provides simple functions like `isDown` to check to key presses. Since we already have a game loop, it's simpler to check for key presses when the scene is updating rather than using the native events.

The resource library in [`resources.js`](https://github.com/jlongster/webfighter/blob/master/www/js/resources.js) provides a handy API for loading images and firing off events when all the images are loaded. You can see how we use it [at the bottom of `app.js`](https://github.com/jlongster/webfighter/blob/master/www/js/app.js#L162).

## Mobile Considerations

Hello