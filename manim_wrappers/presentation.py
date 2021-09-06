import manim
import os
import shutil
import json
from typing import List, Optional

GLOBAL_OUTPUT_FOLDER = "presentation"


# represent
class Slide:
    def __init__(self, slide_type: str, number: int, name: str, first_animation: int):
        self.slide_type = slide_type,
        self.number = number
        self.name = name
        self.first_animation: int = first_animation
        self.last_animation: int = -1

    def get_dict(self):
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

        # create global output folder
        if not os.path.exists(GLOBAL_OUTPUT_FOLDER):
            os.mkdir(GLOBAL_OUTPUT_FOLDER)

        slide_name = type(self).__name__
        self.output_folder = os.path.join(GLOBAL_OUTPUT_FOLDER, slide_name)
        # create output folder for specific presentation
        # contain everything required to play this presentation including video files
        if not os.path.exists(self.output_folder):
            os.mkdir(self.output_folder)
        # stores information
        self.intel_file = os.path.join(self.output_folder, f"slide_name.json")

    def play(self, *args, **kwargs):
        super().play(*args, **kwargs)
        self.last_animation += 1

    # todo: auto-create first slide
    # end last slide and start new (first slide has been created automatically)
    def next_slide(self, name: Optional[str] = None):
        if name is None:
            name = f"Unnamed Slide {len(self.slides)+1}"
        self.slides.append(Slide("normal",
                                 len(self.slides),
                                 name,
                                 self.last_animation + 1))

    def next_loop_slide(self, name: Optional[str] = None):
        if name is None:
            name = f"Unnamed Loop Slide {len(self.slides)+1}"
        self.slides.append(Slide("loop",
                                 len(self.slides),
                                 name,
                                 self.last_animation + 1))

    def render(self, *args, **kwargs):
        # don't delete any intermediate files
        max_files_cached = manim.config.max_files_cached
        # render one more video file
        super().render(*args, **kwargs)
        manim.config.max_files_cached = max_files_cached

        files = []
        for src_file in self.renderer.file_writer.partial_movie_files:
            assert not src_file.endswith(".mp4"), "Only mp4 files are supported"
            dst_file = os.path.join(self.output_folder, os.path.basename(src_file))
            shutil.copyfile(src_file, dst_file)
            files.append(dst_file)

        with open(self.intel_file, "w") as file:
            json.dump({
                "slides": self.slides,
                "files": files
            }, file)
