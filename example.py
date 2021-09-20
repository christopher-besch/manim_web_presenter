from manim_web_presenter import *


class MovingGroupToTarget(Presentation):
    def construct(self):
        group = VGroup(
            Dot(LEFT),
            Dot(ORIGIN),
            Dot(RIGHT, color=RED),
            Dot(2*RIGHT).scale(1.4)
        )
        target = Dot([4, 3, 0], color=YELLOW)
        self.add(group, target)
        self.next_skip_slide()
        self.play(group.animate.shift(target.get_center() - group[2].get_center()))
        self.next_complete_loop_slide()
        self.play(group.animate.shift(LEFT))
        self.play(group.animate.shift(2*RIGHT))
        self.play(group.animate.shift(LEFT))
        self.next_normal_slide()
        self.play(FadeOut(group, target))
