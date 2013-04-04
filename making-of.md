
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