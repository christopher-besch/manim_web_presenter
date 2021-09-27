#!/usr/local/bin/python3
import sys
import os
import subprocess
from typing import Tuple
import json


def get_fps(video: str) -> float:
    output = subprocess.check_output(f"ffprobe -of json -select_streams 0 -show_entries stream=r_frame_rate {video}").decode()

    json.loads(output)


def get_resolution(video: str) -> Tuple[int, int]:
    output = subprocess.check_output(f"ffprobe -select_streams v:0 -show_entries stram=width,height -of defautl").decode()


def split_video(video: str) -> bool:
    return os.system(f"ffmpeg -i {video} %04d.jpg -hide_banner") == 0


def combine_images(fps: int) -> bool:
    return os.system(f"ffmpeg -r {fps} -f image2 -s")


def main() -> int:
    return 0


if __name__ == "__main__":
    sys.exit(0 if main() else 1)
