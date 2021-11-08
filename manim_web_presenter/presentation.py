import manim
import os
import shutil
import json
import pathlib
import sys
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


def ffmpeg_concat(index_file: str, out_file: str) -> bool:
    return os.system(f"ffmpeg -loglevel {manim.config.ffmpeg_loglevel.lower()} -y -f concat -i {index_file} -c copy {out_file}") == 0


def ffmpeg_fragment(src_file: str, dst_file: str) -> bool:
    return os.system(f"ffmpeg -loglevel {manim.config.ffmpeg_loglevel.lower()} -y -i {src_file} -movflags frag_keyframe+empty_moov+default_base_moof {dst_file}") == 0


# represent
class Slide:
    def __init__(self, slide_type: str, name: str, slide_id: int, first_animation: int):
        self.slide_type = slide_type
        # names are not intended to be unique
        self.name = name
        self.slide_id = slide_id
        # inclusive
        self.first_animation = first_animation
        # exclusive
        self.after_last_animation = first_animation
        self.video = ""

    def empty(self) -> bool:
        return self.first_animation == self.after_last_animation

    def set_video(self, video: str) -> None:
        self.video = video

    def get_dict(self) -> Dict:
        return {
            "slide_type": self.slide_type,
            "name": self.name,
            "slide_id": self.slide_id,
            "first_animation": self.first_animation,
            "after_last_animation": self.after_last_animation,
            "video": self.video,
        }

    def __repr__(self):
        return f"<Slide '{self.name}' from {self.first_animation} to {self.after_last_animation}, stored in '{self.video}'>"


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

        # keep other presentations
        if not os.path.exists(GLOBAL_OUTPUT_FOLDER):
            os.mkdir(GLOBAL_OUTPUT_FOLDER)

        self.web_folder = os.path.join(FILE_DIR_PATH, "web")

        presentation_name = type(owner).__name__
        if presentation_name == "tmp":
            raise RuntimeError("The Presentation can't be called 'tmp'")

        # update presentation index
        presentation_index_path = os.path.join(GLOBAL_OUTPUT_FOLDER, "presentation_index.json")
        presentation_index: List[str] = []
        if os.path.exists(presentation_index_path):
            with open(presentation_index_path, "r", encoding="utf-8") as file:
                presentation_index = json.load(file)
        if presentation_name not in presentation_index:
            presentation_index.append(presentation_name)
        with open(presentation_index_path, "w", encoding="utf-8") as file:
            json.dump(presentation_index, file)
        shutil.copyfile(os.path.join(self.web_folder, "menu.html"), os.path.join(GLOBAL_OUTPUT_FOLDER, "index.html"))

        self.output_folder = os.path.join(GLOBAL_OUTPUT_FOLDER, presentation_name)
        # contain everything required to play this presentation including video files
        if os.path.exists(self.output_folder):
            shutil.rmtree(self.output_folder)
        os.mkdir(self.output_folder)

        self.tmp_folder = os.path.join(GLOBAL_OUTPUT_FOLDER, "tmp")
        self.recreate_tmp_folder()

        # stores intel about how to present slides
        self.index_file = os.path.join(self.output_folder, "index.json")

        # first slide can be replaced with a loop <- immediately gets deleted when creating a new slide
        self.next_slide("normal", None)

    def recreate_tmp_folder(self) -> None:
        if os.path.exists(self.tmp_folder):
            shutil.rmtree(self.tmp_folder)
        os.mkdir(self.tmp_folder)

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
                                 len(self.slides),
                                 self.next_animation))

    # after slides have been defined but before render to files
    def tear_down(self, *args, **kwargs):
        self.finish_last_slide()
        assert len(self.slides) != 0, "The presentation doesn't contain any animations."
        assert self.slides[-1].slide_type != "skip", "The presentation can't end with a skip slide; there's nothing to skip to."
        self.parent.tear_down(*args, **kwargs)

    # copy animations into tmp folder and concatenate into single file
    def combine_animations(self) -> None:
        src_files = self.owner.renderer.file_writer.partial_movie_files
        for slide in self.slides:
            index_file = os.path.join(self.tmp_folder, "animations.txt")
            # copy and fragment videos -> needed by front end
            with open(index_file, "w", encoding="utf-8") as file:
                for idx, src_file in enumerate(src_files[slide.first_animation:slide.after_last_animation]):
                    dst_filename = f"{idx}.mp4"
                    dst_file = os.path.join(self.tmp_folder, dst_filename)
                    file.write(f"file {dst_filename}\n")
                    shutil.copyfile(src_file, dst_file)
                    # manim.logger.info(f"Converting animation #{idx}...")
                    # if not ffmpeg_fragment(src_file, dst_file):
                    #     raise RuntimeError(f"ffmpeg failed to encode animation #{idx} for slide '{slide.name}'")

            # combine animations
            full_dst_filename = f"{slide.slide_id}.mp4"
            full_dst_file = os.path.join(self.output_folder, full_dst_filename)
            full_tmp_file = os.path.join(self.tmp_folder, "out.mp4")
            
            # windows specific path manipulation
            if sys.platform == 'win32':
                full_dst_filename = full_dst_filename.replace(os.sep, '/')
                full_dst_file = full_dst_file.replace(os.sep, '/')
                full_tmp_file = full_tmp_file.replace(os.sep, '/')
                index_file = index_file.replace(os.sep, '/')
            
            slide.set_video(full_dst_filename)
            manim.logger.info(f"Combining animations for slide '{slide.name}'...")
            if not ffmpeg_concat(index_file, full_tmp_file):
                raise RuntimeError(f"ffmpeg failed to concatenate the animations of slide '{slide.name}'")
            manim.logger.info(f"Fragmenting concatenated animations for slide '{slide.name}'...")
            if not ffmpeg_fragment(full_tmp_file, full_dst_file):
                raise RuntimeError(f"ffmpeg failed to encode concatenated animations of slide '{slide.name}'")

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

        self.combine_animations()
        self.copy_movie_file()

        with open(self.index_file, "w") as file:
            json.dump({
                "slides": [slide.get_dict() for slide in self.slides],
            }, file)

        # copy and configure web site over
        web_files = [
            "index.html",
        ]
        for file in web_files:
            shutil.copyfile(os.path.join(self.web_folder, file), os.path.join(self.output_folder, file))
        write_template(os.path.join(self.web_folder, "fallback.html"), os.path.join(self.output_folder, "fallback.html"), slides=self.slides)


#####################
# custom templating #
#####################
# manim Scene class or class inheriting from Scene
class Inheritor:
    def __init__(self, class_):
        self.manim_name = class_.__name__
        if (not self.manim_name.endswith("Scene")):
            manim.logger.warning(f"Warning: the class '{self.manim_name}' inherits from manim.Scene but doesn't end with 'Scene'; Please open an issue of GitHub. Thank You!")
            self.presenter_name = f"{self.manim_name}_"
        else:
            self.presenter_name = self.manim_name.replace("Scene", "Presentation")


def create_wrappers():
    inheritors = [Inheritor(inheritor) for inheritor in get_inheritors(manim.Scene)]
    write_python_template(os.path.join(FILE_DIR_PATH, "wrapper_classes_template.py"), os.path.join(FILE_DIR_PATH, "wrapper_classes.py"), inheritors=inheritors)
