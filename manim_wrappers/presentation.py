import manim
import os
import shutil
import json
from typing import List, Optional, Dict

GLOBAL_OUTPUT_FOLDER = "presentation"


# represent
class Slide:
    def __init__(self, slide_type: str, name: str, first_animation: int):
        self.slide_type = slide_type
        # names are not intended to be unique
        self.name = name
        # inclusive
        self.first_animation = first_animation
        # exclusive
        self.after_last_animation = first_animation

    def empty(self) -> bool:
        return self.first_animation == self.after_last_animation

    def get_dict(self) -> Dict:
        return {
            "slide_type": self.slide_type,
            "name": self.name,
            "first_animation": self.first_animation,
            "after_last_animation": self.after_last_animation,
        }

    def __repr__(self):
        return f"<Slide '{self.name}' from {self.first_animation} to {self.after_last_animation}>"


# represent entire presentation replacing a single manim scene
class Presentation(manim.Scene):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.slides: List[Slide] = []
        self.next_animation = 0

        # create or clear global output folder
        if os.path.exists(GLOBAL_OUTPUT_FOLDER):
            shutil.rmtree(GLOBAL_OUTPUT_FOLDER)
        os.mkdir(GLOBAL_OUTPUT_FOLDER)

        slide_name = type(self).__name__
        self.output_folder = os.path.join(GLOBAL_OUTPUT_FOLDER, slide_name)
        # create output folder for specific presentation
        # contain everything required to play this presentation including video files
        if not os.path.exists(self.output_folder):
            os.mkdir(self.output_folder)
        # stores intel about how to present slides
        self.intel_file = os.path.join(self.output_folder, f"{slide_name}.json")

        # first slide can be replaced with a loop
        self.next_normal_slide()

    def play(self, *args, **kwargs):
        super().play(*args, **kwargs)
        # exclusive -> store index of not yet defined animation
        self.next_animation += 1
        self.slides[-1].after_last_animation = self.next_animation

    def __finish_last_slide(self):
        # empty slides are confusing and will be overwritten
        if len(self.slides) != 0 and self.slides[-1].empty():
            self.slides.pop()

    def __next_slide(self, slide_type: str, name: Optional[str]):
        if name is None:
            name = f"Slide ({slide_type}) #{len(self.slides)}"
        self.__finish_last_slide()
        self.slides.append(Slide(slide_type,
                                 name,
                                 self.next_animation))

    # end last slide and start new (first slide has been created automatically)
    def next_normal_slide(self, name: Optional[str] = None):
        self.__next_slide("normal", name)

    # end last slide and start new loop slide
    def next_loop_slide(self, name: Optional[str] = None):
        self.__next_slide("loop", name)

    # end last slide and start new loop slide
    # loop finishes first before going to next slide
    def next_complete_loop_slide(self, name: Optional[str] = None):
        self.__next_slide("complete_loop", name)

    # after slides have been defined but before render to files
    def tear_down(self, *args, **kwargs):
        self.__finish_last_slide()
        assert len(self.slides) != 0, "The presentation doesn't contain any animations."
        super().tear_down(*args, **kwargs)

    def render(self, *args, **kwargs):
        # don't delete any intermediate files
        max_files_cached = manim.config.max_files_cached
        # render one more video file
        super().render(*args, **kwargs)
        manim.config.max_files_cached = max_files_cached

        # copy intermediate video files
        animations = []
        for src_file in self.renderer.file_writer.partial_movie_files:
            assert src_file.endswith(".mp4"), "Only mp4 files are supported. Did you add a 'wait' or 'play' statement to the presentation?"
            dst_file = os.path.join(self.output_folder, os.path.basename(src_file))
            shutil.copyfile(src_file, dst_file)
            animations.append(dst_file)

        with open(self.intel_file, "w") as file:
            json.dump({
                "slides": [slide.get_dict() for slide in self.slides],
                "animations": animations
            }, file)
