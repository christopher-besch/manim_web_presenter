#!/usr/bin/env python3
import sys
import os
import subprocess
from typing import Tuple
import json


class VideoInfo:
    def __init__(self, fps: float, width: int, height: int):
        self.fps = fps
        self.width = width
        self.height = height


def get_video_info(video: str) -> VideoInfo:
    output_str = subprocess.check_output(["ffprobe", "-of", "json", "-select_streams", "0", "-show_entries", "stream=r_frame_rate,width,height", video], stderr=subprocess.DEVNULL).decode()
    output = json.loads(output_str)["streams"]

    print(output)
    fps_ints = [int(string) for string in output["r_frame_rate"].split("/")]
    fps = fps_ints[0]/fps_ints[1]

    width: int = output["width"]
    height: int = output["height"]
    return VideoInfo(fps, width, height)


def split_video(video: str) -> bool:
    return os.system(f"ffmpeg -i {video} %04d.jpg -hide_banner") == 0


# def combine_images(fps: int) -> bool:
#     return os.system(f"ffmpeg -r {fps} -f image2 -s")


def main() -> int:
    video_info = get_video_info("presentation/Tutorial/1.mp4")
    print(video_info.fps)
    print(video_info.width)
    print(video_info.height)
    return 0


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
