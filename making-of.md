
# Making Webfighter

[Webfighter](http://jlongster.github.com/webfighter/) is a game inspired by R-Type and Tyrian. In fact, it uses [Tyrian's graphics](http://www.lostgarden.com/2007/04/free-game-graphics-tyrian-ships-and.html) which have been released for free. The game is a side-scrolling shooter where you hunt down an alien bug and destroy it.

It works on desktop and mobile, with much thought put into the mobile experience. This article describes how webfighter works, and explains many things learned about creating games for mobile.

## Basics

Let's start with the basic architecture. This may surprise you, but webfighter does not use a game engine. I believe that there are already several examples of existing game engines out there, and this is a chance to show instead what it's like to work with only web APIs.

The result is, of course, a few files that are basically a minimal game engine. The code that makes up the core components is very small, and hackable, however. During this process I was inspired to write a [detailed blog post](http://jlongster.com/Making-Sprite-based-Games-with-Canvas) about this very process of making games with minimal code, so feel free to dive into that as well. The post focuses on sprite animations, but another post is coming describing scene managers and renderers.

There are 3 main components: scene, renderer, and sprite. The `Scene` object implements the ability to add and remove objects to the scene, update them every frame, and check collisions. The `Renderer` object implements the ability to render every object in the scene and manages the viewport. The `Sprite` object manages images and animating them. There are more components, but these make up the most important parts of the system.

## Art

Let's take a step back and think about art. Games are complex enough technically, who has time to sit down and develop a bunch of awesome art for it? Maybe you have an artist friend who will help out. If you do, awesome!

If you don't have any artist friends willing to help out, I would highly encourage you to use existing art released for free. You can look around [HasGraphics](http://hasgraphics.com/) for a graphics set that you like. As mentioned previously, webfighter reuses the [Tyrian graphics](http://www.lostgarden.com/2007/04/free-game-graphics-tyrian-ships-and.html) for some awesome ship and enemy art.

## High-Level Overview

Let's start with [app.js](https://github.com/jlongster/webfighter/blob/master/www/js/app.js). This is the first file loaded. We are using [RequireJS](http://requirejs.org/) for javascript modules, and the first part simple requires all of the necessary components.

Next, you will find several functions which alter the state of the game, such as `gameOver` and `gameWon`. These stop the game and display a message to the user. Other functions like `togglePause` and `restart` have obvious purposes.

Near the end is the [`init`](https://github.com/jlongster/webfighter/blob/master/www/js/app.js#L105) function which constructs the game and starts it. This creates a camera, renderer, and scene object, and adds everything to the scene, as well adding event handlers to the UI if this is the first run.

Lastly, the [`heartbeat`](https://github.com/jlongster/webfighter/blob/master/www/js/app.js#L135) function is what pumps life into our game every frame. It tells the scene to update, the renderer to render the scene, and checks to see if the game is over. An important note is that it uses [`requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/DOM/window.requestAnimationFrame) to [call itself](https://github.com/jlongster/webfighter/blob/master/www/js/app.js#L158) at around 60fps, or whatever is appropriate for the user's setup.

## Levels & Enemies

The file [`units.js`](https://github.com/jlongster/webfighter/blob/master/www/js/units.js) defines every single entity in the game. An entity is an object with a `render` and `update` method. Technically the system implements this as the [`SceneObject`](https://github.com/jlongster/webfighter/blob/master/www/js/sceneobject.js) type, and has a few additional methods like `remove`.

Entities are the meat of the game. They all have a position (`pos`) and a size (`size`). You can define new behavior by overriding the `update` method and implementing some kind of crazy movement, and you can implement special rendering by overriding `render`. The default rendering behavior is to render the sprite attached to the entity.

The `Sprite` class represents an image with animation. It handles a bunch of annoying details like looking up a sprite in a single large image (called a sprite map), and figuring out which frame to show for animation. It has several options, like only playing the animation once, and specifying exactly which images in a sprite map compose the animation.

The file [`level.js`](https://github.com/jlongster/webfighter/blob/master/www/js/level.js) adds all the entities to the scene. There is a special entity type [`Trigger`](https://github.com/jlongster/webfighter/blob/master/www/js/units.js#L615) which simply fires off an event when the player collides with it, so a bunch of triggers are added to scene. These triggers check every frame and add different kinds of enemies to the scene.

Triggers are the only thing that exist outside of your viewport. When a trigger adds an enemy to the scene, it adds it right outside the right of the screen. When the enemy moves outside of the left of the screen, it is removed. Lasers and other entities are also automatically removed when they are outside the field of vision. This keeps the total number of entites down and performance up.

![](https://raw.github.com/jlongster/webfighter/master/docs/screenshot.png)