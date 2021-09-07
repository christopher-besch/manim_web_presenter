from manim import *
from manim_wrappers import Presentation


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
