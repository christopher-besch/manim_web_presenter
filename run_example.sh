#!/bin/bash
set -euo pipefail

SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
cd "$SCRIPTPATH/web/"

echo ".---------------."
echo "| Build website |"
echo "'---------------'"
build_mode="build_release"
build_mode_p="Release"

if [ "$1" == "debug" ]; then
	build_mode="build_debug"
	build_mode_p="Debug"
fi
echo "> Build Mode: $build_mode_p"

npm run "$build_mode"
echo ".----------------------."
echo "|   Finished building  |"
echo "|                      |"
echo "| Rendering with manim |"
echo "'----------------------'"
cd "$SCRIPTPATH"
manim example.py
echo ".-------------------------------."
echo "| Finished rendering with manim |"
echo "|                               |"
echo "|        Starting server        |"
echo "'-------------------------------'"
cd "$SCRIPTPATH/presentation/Test/"
python3 -m http.server