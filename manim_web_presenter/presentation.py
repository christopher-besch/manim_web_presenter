import manim
import os
import shutil
import json
import pathlib
from jinja2 import Template, StrictUndefined
from typing import List, Optional, Dict

FILE_DIR_PATH = pathlib.Path(__file__).parent.resolve()
GLOBAL_OUTPUT_FOLDER = "presentation"


# copy file with jinja2 templating
def write_template(in_file: str, out_file: str, **kwargs):
    with open(in_file, "r", encoding="utf-8") as file:
        template = Template(file.read(), undefined=StrictUndefined)
    out = template.render(**kwargs)
    with open(out_file, "w", encoding="utf-8") as file:
        file.write(out)


# intended for writing templated python files
def write_python_template(in_file: str, out_file: str, **kwargs):
    with open(in_file, "r", encoding="utf-8") as file:
        template = Template(file.read(), undefined=StrictUndefined)
    out = template.render(**kwargs)
    with open(out_file, "w", encoding="utf-8") as file:
        file.write("# This file has been automatically created with jinja2, any edits in this file will be overwritten!\n")
        file.write(out)


def get_inheritors(class_):
    subclasses = {class_}
    q = [class_]
    while q:
        parent = q.pop()
        for child in parent.__subclasses__():
            if child not in subclasses:
                subclasses.add(child)
                q.append(child)
    return subclasses


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


# contain all presentation functionality
# required to beat inheritance hell
# if you have a better idea of how to do this, please open an issue on github
class RawPresentation:
    def __init__(self, owner, parent, *args, **kwargs):
        self.owner = owner
        self.parent = parent
        parent.__init__(*args, **kwargs)

        self.slides: List[Slide] = []
        self.next_animation = 0

        if __debug__:
            # keep old files in debug
            if not os.path.exists(GLOBAL_OUTPUT_FOLDER):
                os.mkdir(GLOBAL_OUTPUT_FOLDER)
            print("debug")
        else:
            # normally delete recreate folder
            if os.path.exists(GLOBAL_OUTPUT_FOLDER):
                shutil.rmtree(GLOBAL_OUTPUT_FOLDER)
            os.mkdir(GLOBAL_OUTPUT_FOLDER)
            print("release")

        slide_name = type(owner).__name__
        self.output_folder = os.path.join(GLOBAL_OUTPUT_FOLDER, slide_name)
        # contain everything required to play this presentation including video files
        if not os.path.exists(self.output_folder):
            os.mkdir(self.output_folder)
        # stores intel about how to present slides
        self.index_file = os.path.join(self.output_folder, "index.json")

        # first slide can be replaced with a loop <- immediately gets deleted when creating a new slide
        self.next_slide("normal", None)

    def play(self, *args, **kwargs):
        self.parent.play(*args, **kwargs)
        # exclusive -> store index of not yet defined animation
        self.next_animation += 1
        self.slides[-1].after_last_animation = self.next_animation

    def finish_last_slide(self):
        # empty slides are confusing and will be overwritten
        if len(self.slides) != 0 and self.slides[-1].empty():
            self.slides.pop()

    def next_slide(self, slide_type: str, name: Optional[str]):
        if name is None:
            name = f"Slide ({slide_type}) #{len(self.slides)}"
        self.finish_last_slide()
        self.slides.append(Slide(slide_type,
                                 name,
                                 self.next_animation))

    # after slides have been defined but before render to files
    def tear_down(self, *args, **kwargs):
        self.finish_last_slide()
        assert len(self.slides) != 0, "The presentation doesn't contain any animations."
        self.parent.tear_down(*args, **kwargs)

    # copy intermediate video files
    def copy_animations(self) -> List[str]:
        animations = []
        # let's tinker with the very fabric of manim's reality
        for idx, src_file in enumerate(self.owner.renderer.file_writer.partial_movie_files):
            assert src_file.endswith(".mp4"), "Only mp4 files are supported. Did you add a 'wait' or 'play' statement to the presentation?"
            dst_file = os.path.join(self.output_folder, os.path.basename(src_file))
            print(f"Converting animation #{idx}...")
            if os.system(f"ffmpeg -v 0 -y -i {src_file} -movflags frag_keyframe+empty_moov+default_base_moof {dst_file}") != 0:
                raise RuntimeError("ffmpeg failed to encode animation #{idx}")
            animations.append(os.path.basename(dst_file))
        return animations

    def copy_movie_file(self):
        movie_file = self.owner.renderer.file_writer.movie_file_path
        assert movie_file.endswith(".mp4"), "Only mp4 files are supported. Did you add a 'wait' or 'play' statement to the presentation?"
        dst_file = os.path.join(self.output_folder, "movie.mp4")
        shutil.copyfile(movie_file, dst_file)

    # executed single time once scene has been defined
    def render(self, *args, **kwargs):
        # don't delete any intermediate files
        max_files_cached = manim.config.max_files_cached
        self.parent.render(*args, **kwargs)
        manim.config.max_files_cached = max_files_cached

        animations = self.copy_animations()
        self.copy_movie_file()

        with open(self.index_file, "w") as file:
            json.dump({
                "animations": animations,
                "slides": [slide.get_dict() for slide in self.slides],
            }, file)

        # copy and configure web site over
        web_folder = os.path.join(FILE_DIR_PATH, "web")
        web_files = [
            "index.html",
            "video_viewer.html"
        ]
        for file in web_files:
            shutil.copyfile(os.path.join(web_folder, file), os.path.join(self.output_folder, file))
        write_template(os.path.join(web_folder, "fallback.html"), os.path.join(self.output_folder, "fallback.html"), animations=animations, slides=self.slides)


#####################
# custom templating #
#####################
# manim Scene class or class inheriting from Scene
class Inheritor:
    def __init__(self, class_):
        self.manim_name = class_.__name__
        if (not self.manim_name.endswith("Scene")):
            print(f"Warning: the class '{self.manim_name}' inherits from manim.Scene but doesn't end with 'Scene'; Please open an issue of GitHub. Thank You!")
            self.presenter_name = f"{self.manim_name}_"
        else:
            self.presenter_name = self.manim_name.replace("Scene", "Presentation")


def create_wrappers():
    inheritors = [Inheritor(inheritor) for inheritor in get_inheritors(manim.Scene)]
    write_python_template(os.path.join(FILE_DIR_PATH, "wrapper_classes_template.py"), os.path.join(FILE_DIR_PATH, "wrapper_classes.py"), inheritors=inheritors)
