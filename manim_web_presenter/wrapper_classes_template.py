# {# this file is to be read by jinja2 #}
import manim
from typing import Optional
from .presentation import RawPresentation


# {% for inheritor in inheritors %}
class {{inheritor.presenter_name}}(manim.{{inheritor.manim_name}}):
    def __init__(self, *args, **kwargs):
        self.raw_presentation = RawPresentation(self, super(), *args, **kwargs)

    def play(self, *args, **kwargs):
        self.raw_presentation.play(*args, **kwargs)

    def next_normal_slide(self, name: Optional[str] = None):
        """
        end last slide and start new(first slide has been created automatically)
        """
        self.raw_presentation.next_slide("normal", name)

    def next_loop_slide(self, name: Optional[str] = None):
        """
        end last slide and start new loop slide
        """
        self.raw_presentation.next_slide("loop", name)

    def next_complete_loop_slide(self, name: Optional[str] = None):
        """
        end last slide and start new loop slide
        loop finishes first before going to next slide
        """
        self.raw_presentation.next_slide("complete_loop", name)

    def tear_down(self, *args, **kwargs):
        self.raw_presentation.tear_down(*args, **kwargs)

    def render(self, *args, **kwargs):
        self.raw_presentation.render(*args, **kwargs)
# {% endfor %}
