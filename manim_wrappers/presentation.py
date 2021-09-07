import manim
import os
import shutil
import json
from typing import List, Optional, Dict

GLOBAL_OUTPUT_FOLDER = "presentation"


# represent
class Slide:
    def __init__(self, slide_type: str, number: int, name: str, first_animation: int):
        self.slide_type = slide_type,
        self.number = number
        # names are not intended to be unique
        self.name = name
        self.first_animation: int = first_animation
        self.last_animation: int = first_animation

    def empty(self) -> bool:
        return self.first_animation == self.last_animation

    def add_animation(self) -> None:
        self.last_animation += 1

    def get_dict(self) -> Dict:
        return {
            "slide_type": self.slide_type,
            "number": self.number,
            "name": self.name,
            "first_animation": self.first_animation,
            "last_animation": self.last_animation,
        }


# represent entire presentation replacing a single manim scene
class Presentation(manim.Scene):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.slides: List[Slide] = []
        self.last_animation = 0
        self.start_animation = -1

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
        # stores information
        self.intel_file = os.path.join(self.output_folder, f"{slide_name}.json")

        # first slide can't have a loop
        self.next_normal_slide()

    def __del__(self):
        self.__finish_last_slide()
        assert len(self.slides) != 0, "The presentation doesn't contain any animations."

    def __finish_last_slide(self):
        # empty slides are confusing and will be overwritten
        if len(self.slides) != 0 and self.slides[-1].empty:
            self.slides.pop()

    def __next_slide(self, slide_type: str, name: Optional[str]):
        if name is None:
            name = f"Unnamed Slide ({slide_type}) #{len(self.slides)}"
        self.__finish_last_slide()
        self.slides.append(Slide(slide_type,
                                 len(self.slides),
                                 name,
                                 self.last_animation + 1))

    def play(self, *args, **kwargs):
        super().play(*args, **kwargs)
        self.last_animation += 1

    # end last slide and start new (first slide has been created automatically)
    def next_normal_slide(self, name: Optional[str] = None):
        self.__next_slide("normal", name)

    # end last slide and start new loop slide
    def next_loop_slide(self, name: Optional[str] = None):
        self.__next_slide("loop", name)

    # end last slide and start new loop slide
    def next_complete_loop_slide(self, name: Optional[str] = None):
        self.__next_slide("complete_loop", name)

    def render(self, *args, **kwargs):
        # don't delete any intermediate files
        max_files_cached = manim.config.max_files_cached
        # render one more video file
        super().render(*args, **kwargs)
        manim.config.max_files_cached = max_files_cached

        # copy intermediate video files
        files = []
        for src_file in self.renderer.file_writer.partial_movie_files:
            print(src_file)
            assert src_file.endswith(".mp4"), "Only mp4 files are supported; Did you add a wait or play statement to the presentation?"
            dst_file = os.path.join(self.output_folder, os.path.basename(src_file))
            shutil.copyfile(src_file, dst_file)
            files.append(dst_file)

        with open(self.intel_file, "w") as file:
            json.dump({
                "slides": [slide.get_dict for slide in self.slides],
                "files": files
            }, file)
