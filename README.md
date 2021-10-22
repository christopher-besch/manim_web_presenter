# Manim Web Presenter
Web Presentation using Manim

[![Linux Build](https://github.com/christopher-besch/manim_web_presenter/actions/workflows/linux.yml/badge.svg?branch=main)](https://github.com/christopher-besch/manim_web_presenter/actions/workflows/linux.yml)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://github.com/christopher-besch/manim_web_presenter/blob/main/LICENSE)

Present mathematical topics using the usability of [Manim CE](https://www.manim.community) and prevalence of the web.

It produces an entire web page for a single presentation.
You only have to host that web page locally or serve it as a static resource from a web server.
If you're using a server, you have a special advantage:
Your laptop gave up the ghost mere minutes before your presentation?
As long as you have some helpful people around you, there's no problem.
Simply use a different laptop and you're good to go;
you don't have to install any software when all you have to do is open a web page.

## Note:

This web presenter will soon be deprecated in favour of [The Manim Editor](https://github.com/ManimEditorProject/manim_editor).

## [Tutorial](https://christopher-besch.github.io/manim_web_presenter/Tutorial)

The most important aspects of the Manim Web Presenter are explained in the [tutorial](https://christopher-besch.github.io/manim_web_presenter/Tutorial).
You can find the source code in the [example.py](example.py) file.

## Manim Wrapper

The main goal of this project is to be as invisible as possible.
Instead of writing `from manim import *` you write `from manim_web_presenter import *` and nothing happens;
you can still use Manim the way you love it.
But if you want to use the presentation system, there is a wrapper for each scene class.
These are some examples:

| Manim CE Class            | Manim CE Web Presenter Class     |
|:------------------------- |:-------------------------------- |
| Scene                     | Presentation                     |
| VectorScene               | VectorPresentation               |
| LinearTransformationScene | LinearTransformationPresentation |
| MovingCameraScene         | MovingCameraPresentation         |
| ZoomedScene               | ZoomedPresentation               |
| ReconfigurableScene       | ReconfigurablePresentation       |
| SampleSpaceScene          | SampleSpacePresentation          |
| ThreeDScene               | ThreeDPresentation               |
| SpecialThreeDScene        | SpecialThreeDPresentation        |

(The wrappers get created on-the-fly so any recently added types of scenes will automatically receive a wrapper.)

You can create a Presentation just like a Scene, create an inheritor of that class and define your knickknacks in the `constructor` method.
The wrappers are aiming to be a drop-in replacement for the scene classes, but there unfortunately are a few rules you have to be aware of:
-   Always call the underlying methods when overwriting any method other than `constructor`.
    For example do this:
    ```py
    class Test(Presentation):
        def __init__(self):
            # do what you can't leave undone
            super().__init__()
    ```
    instead of this:
    ```py
    class Test(Presentation):
        def __init__(self):
            # do what you can't leave undone
    ```
-   Every normal slide should end with a `self.wait()` call.
    Otherwise the last frame might not look the way you expect it to.
    In addition to that the No-Script fallback will work a lot better this way.
-   Every slide must contain at least one animation.
    Thus image output instead of movie output is not allowed.

## Output Folder Structure

The normal Manim output stays untouched.
A new folder `presentaion` will be created, which provides shelter for one folder for each Presentation you've defined.
These folders contain:
-   the entire movie file,
-   all of the videos for each slide,
-   the main website file inlined into a single HTML file and
-   the No-Script fallback HTML file in case the web presenter isn't working on your ancient browser.

## Slides

Each presentation is divided into slides.
You define them using:
```py
self.next_normal_slide("optional human readable name of the slide (doesn't have to be unique)")
```

All animations between two of those calls belong to a single slide.
For convenience a normal slide will automatically be created in the beginning of any presentation.
So you can immediately start getting your work done.
If you don't want the first slide to be a normal slide, you can simply overwrite it by defining a new slide in the beginning.
Any empty slides (without any animations) will be deleted.

### Types of Slides

To get a better understanding of the different types of slides and their use cases, you should take a look at the [tutorial](https://christopher-besch.github.io/manim_web_presenter/Tutorial).

These are all of the currently provided types of slides:

| Name                | method call                        | function                                                                       |
|:------------------- |:---------------------------------- |:------------------------------------------------------------------------------ |
| Normal Slide        | `self.next_normal_slide("name")`   | start, end, wait for continuation by user                                      |
| Skip Slide          | `self.next_skip_slide("name")`     | start, end, immediately continue to next slide                                 |
| Loop Slide          | `self.next_loop_slide("name")`     | start, end, restart, immediately continue to next slide when continued by user |
| Complete Loop Slide | `self.next_complete_slide("name")` | start, end, restart, finish animation first when user continues                |

Skip slides are mainly used to give loops a beginning that isn't repeated.
They can also be used to split up longer animations to be able to jump to specific parts using the timeline.

## Caching

Every Browser has an internal cache that can be used to...cache web objects.
This isn't going to do anything for you, if you're already hosting the web page from your local PC.
But it might significantly improve your presenting experience from a remote server; especially if you have to use the Fallback Loader.
What objects to cache is up to your browser but nowadays—with exploding disk and memory sizes—browsers generally prefer caching over not-caching.
When you click the `Cache Videos` button, all videos of that presentation get requested, giving the browser a chance of caching them.
Performing this action before presenting is **recommended procedure**.

# Redundancy

There are two contingency plans in case something goes wrong.
This project tries its best for these to be unnecessary but you never know what environment it may have to run in.

There are two redundant ways of playing the videos.
You can switch between them using a button in the web interface.

| Buffer Loader | Fallback Loader |
|:------------- |:--------------- |
| The Buffer Loader buffers multiple videos in advance in memory so that lags are minimized. The amount of future and past videos to be buffered can be set in the web interface. | In case the Buffer Loader fails, you can use the fallback loader instead. It is a lot less complex; if anything fails, this is the second thing you should try, after **reloading the page**. |

## No-Script Fallback

If the entire front end fails or can't be used because your browser blocks JavaScript, you can still use the No-Script Fallback.
It isn't any better than a simple video player but if times are dire, this is better than nothing.

# Terminal Commands

### Installation

-    Clone repository: `git clone https://github.com/christopher-besch/manim_web_presenter`
-    Install [Manim Community](https://docs.manim.community/en/stable/installation.html)
-    Install required python modules: `pip3 install -r requirements.txt`
-    Install npm devDependencies: go into `web` directory and run `npm install`

### Compilation

-    Go into `web` directory and run `npm run build_debug` or `npm run build_release`

### Use

-    Run `manim -qh example.py` in project root
-    Start local server in `presentation/presentation_name`: `python3 -m http.server`
