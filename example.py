from manim import *
from manim_wrappers import Presentation


class Test(Presentation):
    def construct(self):
        square = Square()
        self.add(square)
        self.wait()
