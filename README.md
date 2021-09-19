# Manim Web Presenter

[![Linux Build](https://github.com/christopher-besch/manim_web_presenter/actions/workflows/linux.yml/badge.svg?branch=main)](https://github.com/christopher-besch/manim_web_presenter/actions/workflows/linux.yml)
[![License](https://img.shields.io/badge/license-MIT-yellow)](https://github.com/christopher-besch/manim_web_presenter/blob/main/LICENSE)

Web Presentation using Manim

### Installation

- Clone repository: `git clone https://github.com/christopher-besch/manim_web_presenter`
- Install [Manim Community](https://docs.manim.community/en/stable/installation.html)
- Install required python modules: `pip3 install -r requirements.txt`
- Install npm devDependencies: go into `web` directory and run `npm install`

### Compilation

- Go into `web` directory and run `npm run build_debug` or `npm run build_release`

### Use

- Run `manim -ql example.py` in project root (or `python3 -O -m manim -ql example.py` to enable debug mode)
- Start local server in `presentation/Test`: `python3 -m http.server`
