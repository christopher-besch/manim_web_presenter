from manim_web_presenter import *


class Tutorial(Presentation):
    def construct(self):
        #########
        # title #
        #########
        banner = ManimBanner()
        self.play(banner.create())
        self.play(banner.expand())
        self.wait()
        self.play(Unwrite(banner))

        title = Text("Manim CE Web Presenter", font_size=60).shift(2*UP)
        title_ul = Underline(title)
        self.play(Write(title), run_time=0.5)
        text = VGroup(
            Text("Press any of the usual \"next slide\"-keys"),
            Text("like RightArrow or PageUp"),
            Text("to go to the next slide."),
            Text("You can also use the > button above."),
        ).arrange(DOWN).shift(DOWN)
        self.play(Write(text), Write(title_ul), run_time=0.5)
        self.wait()

        ################
        # normal slide #
        ################
        self.next_normal_slide()
        self.remove(title, title_ul, text)

        dot = Dot([-4, -2, 0]).scale(3)
        text = VGroup(
            Text("There are four different types of slides."),
            MarkupText("This is the first type, a <b>normal slide</b>."),
            Text("The animation plays and patiently waits"),
            Text("for the speaker to finally"),
            Text("get their point across."),
        ).arrange(DOWN).shift(UP)
        self.play(FadeIn(dot), Write(text), run_time=0.5)
        self.play(dot.animate.shift(8*RIGHT), run_time=2)
        self.wait()

        ################
        # back in time #
        ################
        self.next_normal_slide()
        self.remove(text)

        text = VGroup(
            Text("You can go back in time as well. Try it!"),
            Text("Don't expect any smooth"),
            Text("transitions though."),
            Text("If you want to start from the beginning,"),
            Text("reload the page."),
        ).arrange(DOWN).shift(UP)
        self.play(Write(text), run_time=0.5)
        self.play(dot.animate.shift(4*LEFT))
        self.wait()

        ##############
        # fullscreen #
        ##############
        self.next_normal_slide()
        self.remove(text)

        text = VGroup(
            Text("Your eyes hurt from the tiny video?"),
            Text("Stop whining!"),
            Text("Or press F to enter fullscreen."),
        ).arrange(DOWN)
        self.play(FadeOut(dot), Write(text), run_time=0.5)
        self.wait()

        ####################
        # loop slide intro #
        ####################
        self.next_normal_slide()
        self.remove(text)

        text = VGroup(
            Text("Let's do something different now."),
            Text("What follows is an animation from the"),
            Text("Manim CE Gallery"),
            Text("that I ruthlessly copied :)"),
        ).arrange(DOWN)
        self.play(Write(text), run_time=0.5)
        self.wait()

        ##############
        # loop slide #
        ##############
        self.next_loop_slide()
        self.remove(text)

        text = VGroup(
            Text("This is the second type,"),
            MarkupText("a <b>loop slide</b>."),
        ).arrange(DOWN).shift(2*UP)
        self.play(Write(text), run_time=0.5)

        circle = Circle(arc_center=[0, -2, 0], radius=1, color=YELLOW)
        dot = Dot([0, -2, 0])
        self.add(dot)

        line = Line([3, -2, 0], [5, -2, 0])
        self.add(line)

        self.play(GrowFromCenter(circle))
        self.play(dot.animate.shift(RIGHT))
        self.play(MoveAlongPath(dot, circle), run_time=2, rate_func=linear)

        ####################
        # skip slide intro #
        ####################
        self.next_normal_slide()
        self.remove(text, dot, line, circle)

        text = VGroup(
            Text("If you payed close attention,"),
            Text("you might have noticed that"),
            Text("the animation is...fucked."),
            Text("It just cuts at the end."),
            Text("Smooth transitions look different!"),
            Text("Let me show you how it's done."),
        ).arrange(DOWN)
        self.play(Write(text))
        self.wait()

        ##############
        # skip slide #
        ##############
        self.next_skip_slide()
        self.remove(text)

        text = VGroup(
            MarkupText("This is a <b>skip slide</b>"),
            Text("It functions just like a normal slide"),
            Text("with the difference that it immediately"),
            Text("continues with the next slide"),
            Text("once it's finished."),
        ).arrange(DOWN).shift(1.5*UP)

        self.play(Write(text))

        dot.move_to([0, -2, 0])
        self.add(line)
        self.play(GrowFromCenter(circle))
        self.play(dot.animate.shift(RIGHT))

        self.next_loop_slide()
        self.play(MoveAlongPath(dot, circle), run_time=2, rate_func=linear)

        #########################
        # animation fucked again#
        #########################
        self.next_normal_slide()
        self.remove(text)

        text = VGroup(
            Text("Let's finish the animation."),
            Text("Here we encounter another problem:"),
            Text("The loop immediately cuts when"),
            Text("progressing to the next slide. You didn't"),
            Text("see it? Go back in time and try again."),
        ).arrange(DOWN).shift(1.5*UP)

        self.play(Write(text), Rotating(dot, about_point=[2, -2, 0]), run_time=1.5)
        self.wait()

        #######################
        # complete loop intro #
        #######################
        self.next_normal_slide()
        self.remove(text, dot, circle, line)

        text = VGroup(
            Text("This is where"),
            MarkupText("<b>complete loop slides</b> come in."),
            Text("They are just like loop slides."),
            Text("But when the speaker continues to"),
            Text("the next slide, the complete loop"),
            Text("slide finishes before continuing."),
            Text("Third time's the charm:"),
        ).arrange(DOWN)
        self.play(Write(text))
        self.wait()

        #######################
        # complete loop slide #
        #######################
        self.next_skip_slide()
        self.remove(text)

        text = VGroup(
            Text("When you go to the next slide,"),
            Text("the animation finishes first."),
            Text("Enjoy some smooth transitions"),
        ).arrange(DOWN).shift(2*UP)

        dot.move_to([0, -2, 0])
        self.add(line)
        self.play(Write(text), GrowFromCenter(circle))
        self.play(dot.animate.shift(RIGHT))

        self.next_complete_loop_slide()
        self.play(MoveAlongPath(dot, circle), run_time=2, rate_func=linear)

        self.next_normal_slide()
        self.play(Rotating(dot, about_point=[2, -2, 0]), run_time=1.5)
        self.wait()

        self.next_normal_slide()
        self.remove(text, dot, circle, line)
        self.wait()

        # https://ia600803.us.archive.org/29/items/MacArthur_Foundation_100andChange_dQw4w9WgXcQ/Rick_Astley_-_Never_Gonna_Give_You_Up_dQw4w9WgXcQ.mp4


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
