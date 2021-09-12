#!/bin/bash
set -euo pipefail

SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
cd "$SCRIPTPATH/web/"

build_mode="build_release"

if [ "$1" == "debug" ]; then
	build_mode="build_debug"
fi

npm run "$build_mode"
cd "$SCRIPTPATH"
manim example.py
cd "$SCRIPTPATH/presentation/Test/"
python3 -m http.server