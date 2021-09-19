import "../index.css";
import previous_icon from "../icons/navigate_before_black_24dp.svg";
import next_icon from "../icons/navigate_next_black_24dp.svg";
import fullscreen_icon from "../icons/fullscreen_black_24dp.svg";

import { BufferPresentation } from "./buffer_presenter";
import { FallbackPresentation } from "./fallback_presenter";

// open or focus second window, return success status
// function open_popup_video_viewer(): boolean {
//     if (popup_video_viewer == null || popup_video_viewer.closed) {
//         popup_video_viewer = window.open(
//             "/video_viewer.html",
//             "Manim Video Viewer",
//             "resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no,status=no"
//         );
//         return popup_video_viewer != null;
//     } else {
//         popup_video_viewer.focus();
//         return true;
//     }
// }

// let popup_video_viewer: Window | null;

// according to KeyboardEvent.code on: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
let prev_keys = [
    "ArrowLeft",
    "ArrowDown",
    "PageDown",
    "Backspace",
];
let next_keys = [
    "ArrowRight",
    "ArrowUp",
    "PageUp",
    "Enter",
];
let fullscreen_keys = [
    "KeyF",
];

document.body.onload = () => {
    let previous_button = document.getElementById("play-previous-slide") as HTMLButtonElement;
    let next_button = document.getElementById("play-next-slide") as HTMLButtonElement;
    let fullscreen_button = document.getElementById("enter-fullscreen") as HTMLButtonElement;

    // set icons
    previous_button.getElementsByTagName("img")[0].src = previous_icon;
    next_button.getElementsByTagName("img")[0].src = next_icon;
    fullscreen_button.getElementsByTagName("img")[0].src = fullscreen_icon;

    let video0 = document.getElementById("video0") as HTMLVideoElement;
    let video1 = document.getElementById("video1") as HTMLVideoElement;
    let videos_div = document.getElementById("videos-div") as HTMLDivElement;
    if (video0 == null || video1 == null)
        throw "Cant't find video elements.";
    let presentation = new BufferPresentation(video0, video1, videos_div, 5, 2);
    // let presentation = new FallbackPresentation(video0, video1, videos_div);

    // ignore keyboard layout
    document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.repeat)
            return;
        if (prev_keys.includes(e.code))
            presentation.play_previous_slide();
        else if (next_keys.includes(e.code))
            presentation.play_next_slide();
        else if (fullscreen_keys.includes(e.code))
            presentation.toggle_fullscreen();
    });

    previous_button.addEventListener("click", presentation.play_previous_slide.bind(presentation));
    next_button.addEventListener("click", presentation.play_next_slide.bind(presentation));
    fullscreen_button.addEventListener("click", presentation.enter_fullscreen.bind(presentation));
}
