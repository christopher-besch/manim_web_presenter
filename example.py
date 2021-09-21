from manim_web_presenter import *


class Gallery(Presentation):
    def construct(self):
        text = VGroup(
            Text("Manim CE Web Presenter", font_size=48),
            Text("As you can see,\n"),
        ).arrange(DOWN)
        self.play(Write(text))

        self.next_normal_slide()


class BraceAnnotation(Presentation):
    def construct(self):
        group = VGroup(
            Dot(LEFT),
            Dot(ORIGIN),
            Dot(RIGHT, color=RED),
            Dot(2*RIGHT).scale(1.4)
        )
        target = Dot([4, 3, 0], color=YELLOW)
        self.add(group, target)
        self.wait()
        self.next_skip_slide()
        self.play(group.animate.shift(target.get_center() - group[2].get_center()))
        self.next_complete_loop_slide()
        self.play(group.animate.shift(LEFT))
        self.play(group.animate.shift(2*RIGHT))
        self.play(group.animate.shift(LEFT))
        self.next_normal_slide()
        self.play(FadeOut(group, target))
        scale_tracker = ValueTracker(0.5)

        dot = Dot([-6, -2, 0])

        def update_dot():
            return Dot(dot.get_center() + scale_tracker.get_value() * np.array([4, 2, 0]))
        dot2 = always_redraw(update_dot)

        def update_line():
            return Line(dot.get_center(), dot2.get_center()).set_color(ORANGE)
        line = always_redraw(update_line)

        def update_b1():
            return Brace(line)
        b1 = always_redraw(update_b1)

        def update_b1text():
            return b1.get_tex(r"\text{scale} s =", "{:.2f}".format(scale_tracker.get_value()))
        b1text = always_redraw(update_b1text)

        def update_b2():
            return Brace(line, direction=line.copy().rotate(PI / 2).get_unit_vector())
        b2 = always_redraw(update_b2)

        def update_b2text():
            return b2.get_tex(r"x-x_0")
        b2text = always_redraw(update_b2text)
        self.play(FadeIn(line, dot, dot2, b1, b2, b1text, b2text))
        self.wait()
        self.next_normal_slide()
        self.play(scale_tracker.animate.set_value(1), run_time=3, rate_func=rate_functions.ease_in_out_sine)
        self.next_normal_slide()
        self.play(scale_tracker.animate.set_value(2), run_time=3, rate_func=rate_functions.ease_in_out_sine)
        self.next_normal_slide()
        self.play(scale_tracker.animate.set_value(2.5), run_time=3, rate_func=rate_functions.ease_in_out_sine)
        self.next_normal_slide()
        self.play(scale_tracker.animate.set_value(1), run_time=3, rate_func=rate_functions.ease_in_out_sine)
        self.wait()
        self.play(FadeOut(line, dot, dot2, b1, b2, b1text, b2text))
        self.wait()


class Test(Presentation):
    def construct(self):
        s = Square()
        self.add(s)
        self.wait()
