from manim_web_presenter import *


class Test(Presentation):
    def construct(self):
        square = Square()
        self.add(square)
        self.wait()

        self.next_normal_slide("Test")
        self.remove(square)
        self.wait()
        self.next_loop_slide("I like Cheese")
        circle = Circle()
        circle.set_fill(PINK, opacity=0.5)
        square = Square()
        square.rotate(PI/4)
        self.play(Create(square))
        self.play(Transform(square, circle))
        self.next_complete_loop_slide()
        self.play(FadeOut(square))
        self.next_normal_slide("Test2")


class LongTest(Presentation):
    def construct(self):
        circle = Circle(radius=3, color=BLUE)
        dot = Dot()

        self.next_normal_slide()
        self.play(GrowFromCenter(circle))

        self.next_loop_slide()
        self.play(MoveAlongPath(dot, circle), run_time=2, rate_func=linear)

        self.next_normal_slide()
        self.play(dot.animate.move_to(ORIGIN))

        self.play(dot.animate.move_to(RIGHT*3))

        self.next_complete_loop_slide()
        self.play(MoveAlongPath(dot, circle), run_time=2, rate_func=linear)

        self.play(dot.animate.move_to(ORIGIN))

        self.next_normal_slide()
        self.play(GrowFromCenter(circle))

        self.next_loop_slide()
        self.play(MoveAlongPath(dot, circle), run_time=2, rate_func=linear)

        self.next_normal_slide()
        self.play(dot.animate.move_to(ORIGIN))

        self.play(dot.animate.move_to(RIGHT*3))

        self.next_complete_loop_slide()
        self.play(MoveAlongPath(dot, circle), run_time=2, rate_func=linear)

        self.play(dot.animate.move_to(ORIGIN))

        self.next_normal_slide()
        self.play(GrowFromCenter(circle))

        self.next_loop_slide()
        self.play(MoveAlongPath(dot, circle), run_time=2, rate_func=linear)

        self.next_normal_slide()
        self.play(dot.animate.move_to(ORIGIN))

        self.play(dot.animate.move_to(RIGHT*3))

        self.next_complete_loop_slide()
        self.play(MoveAlongPath(dot, circle), run_time=2, rate_func=linear)

        self.play(dot.animate.move_to(ORIGIN))

        self.next_normal_slide()
        self.play(GrowFromCenter(circle))

        self.next_loop_slide()
        self.play(MoveAlongPath(dot, circle), run_time=2, rate_func=linear)

        self.next_normal_slide()
        self.play(dot.animate.move_to(ORIGIN))

        self.play(dot.animate.move_to(RIGHT*3))

        self.next_complete_loop_slide()
        self.play(MoveAlongPath(dot, circle), run_time=2, rate_func=linear)

        self.play(dot.animate.move_to(ORIGIN))

        self.next_normal_slide()
        self.play(GrowFromCenter(circle))

        self.next_loop_slide()
        self.play(MoveAlongPath(dot, circle), run_time=2, rate_func=linear)

        self.next_normal_slide()
        self.play(dot.animate.move_to(ORIGIN))

        self.play(dot.animate.move_to(RIGHT*3))

        self.next_complete_loop_slide()
        self.play(MoveAlongPath(dot, circle), run_time=2, rate_func=linear)

        self.play(dot.animate.move_to(ORIGIN))


# from https://docs.manim.community/en/stable/examples.html?highlight=gallery
class MovingZoomedSceneAround(ZoomedPresentation):
    # contributed by TheoremofBeethoven, www.youtube.com/c/TheoremofBeethoven
    def __init__(self, *args, **kwargs):
        # make sure to use the correct functions
        # don't hand self over <- self is instance of inheriting class
        super().__init__(
            *args,
            zoom_factor=0.3,
            zoomed_display_height=1,
            zoomed_display_width=6,
            image_frame_stroke_width=20,
            zoomed_camera_config={
                "default_frame_stroke_width": 3,
            },
            **kwargs
        )

    def construct(self):
        dot = Dot().shift(UL * 2)
        image = ImageMobject(np.uint8([[0, 100, 30, 200],
                                       [255, 0, 5, 33]]))
        image.height = 7
        frame_text = Text("Frame", color=PURPLE, font_size=67)
        zoomed_camera_text = Text("Zoomed camera", color=RED, font_size=67)

        self.add(image, dot)
        zoomed_camera = self.zoomed_camera
        zoomed_display = self.zoomed_display
        frame = zoomed_camera.frame
        zoomed_display_frame = zoomed_display.display_frame

        frame.move_to(dot)
        frame.set_color(PURPLE)
        zoomed_display_frame.set_color(RED)
        zoomed_display.shift(DOWN)

        zd_rect = BackgroundRectangle(zoomed_display, fill_opacity=0, buff=MED_SMALL_BUFF)
        self.add_foreground_mobject(zd_rect)

        unfold_camera = UpdateFromFunc(zd_rect, lambda rect: rect.replace(zoomed_display))

        frame_text.next_to(frame, DOWN)

        self.play(Create(frame), FadeIn(frame_text, shift=UP))
        self.activate_zooming()
        self.next_normal_slide()

        self.play(self.get_zoomed_display_pop_out_animation(), unfold_camera)
        zoomed_camera_text.next_to(zoomed_display_frame, DOWN)
        self.play(FadeIn(zoomed_camera_text, shift=UP))
        # Scale in        x   y  z
        scale_factor = [0.5, 1.5, 0]
        self.play(
            frame.animate.scale(scale_factor),
            zoomed_display.animate.scale(scale_factor),
            FadeOut(zoomed_camera_text),
            FadeOut(frame_text)
        )
        self.next_normal_slide()
        self.wait()
        self.play(ScaleInPlace(zoomed_display, 2))
        self.next_normal_slide()
        self.wait()
        self.play(frame.animate.shift(2.5 * DOWN))
        self.next_normal_slide()
        self.wait()
        self.play(self.get_zoomed_display_pop_out_animation(), unfold_camera, rate_func=lambda t: smooth(1 - t))
        self.play(Uncreate(zoomed_display_frame), FadeOut(frame))
        self.wait()
