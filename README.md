# Manim Web Presenter

[![Linux Build](https://github.com/christopher-besch/manim_web_presenter/actions/workflows/linux.yml/badge.svg?branch=main)](https://github.com/christopher-besch/manim_web_presenter/actions/workflows/linux.yml)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://github.com/christopher-besch/manim_web_presenter/blob/main/LICENSE)

Web Presentation using Manim

## [Tutorial](https://christopher-besch.github.io/manim_web_presenter/Tutorial)

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

(The wrappers get created on-the-fly so any new types of scenes will automatically receive a wrapper.)

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
-   Every slide must contain at least one animation.
    Thus image output instead of movie output is not allowed.

## Output Folder Structure

The normal Manim output stays untouched.
A new folder `presentaion` will be created which provides shelter for one folder for each Presentation you've defined.
These folders contain:
-   the entire movie file,
-   all of the videos for each slide,
-   the main website file inlined into a single HTML file and
-   a fallback HTML file in case the web presenter isn't working on your ancient browser.

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

To get a better understanding of the different types of slides and their use cases, you should take a look at the [Tutorial](https://christopher-besch.github.io/manim_web_presenter/Tutorial).

These are all of the currently provided types of slides:

| Name                | method call                        | function                                                                       |
|:------------------- |:---------------------------------- |:------------------------------------------------------------------------------ |
| Normal Slide        | `self.next_normal_slide("name")`   | start, end, wait for continuation by user                                      |
| Skip Slide          | `self.next_skip_slide("name")`     | start, end, immediately continue to next slide                                 |
| Loop Slide          | `self.next_loop_slide("name")`     | start, end, restart, immediately continue to next slide when continued by user |
| Complete Loop Slide | `self.next_complete_slide("name")` | start, end, restart, finish animation first when user continues                |

## Installation

-    Clone repository: `git clone https://github.com/christopher-besch/manim_web_presenter`
-    Install [Manim Community](https://docs.manim.community/en/stable/installation.html)
-    Install required python modules: `pip3 install -r requirements.txt`
-    Install npm devDependencies: go into `web` directory and run `npm install`

### Compilation

-    Go into `web` directory and run `npm run build_debug` or `npm run build_release`

### Use

-    Run `manim -ql example.py` in project root (or `python3 -O -m manim -ql example.py` to enable debug mode)
-    Start local server in `presentation/Test`: `python3 -m http.server`
