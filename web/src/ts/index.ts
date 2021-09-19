import "../index.css";

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

let prev_keys = [
    "ArrowLeft",
];
let next_keys = [
    "ArrowRight",
];
let fullscreen_keys = [
    "f"
];

document.body.onload = () => {
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
        if (prev_keys.includes(e.key))
            presentation.play_previous_slide();
        else if (next_keys.includes(e.key))
            presentation.play_next_slide();
        else if (fullscreen_keys.includes(e.key))
            presentation.toggle_fullscreen();
    });
}
