import "../index.css";

import { BufferPresentation } from "./buffer_presenter";
import { FallbackPresentation } from "./fallback_presenter";
import { Presentation } from "./presentation";

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

let prev_key_codes = [
    37, // ArrowLeft
];
let next_key_codes = [
    39, // ArrowRight
];

document.body.onload = () => {
    let video0 = document.getElementById("video0") as HTMLVideoElement;
    let video1 = document.getElementById("video1") as HTMLVideoElement;
    if (video0 == null || video1 == null)
        throw "Cant't find video elements.";
    let presentation = new BufferPresentation(video0, video1, 5, 2);
    // let presentation = new FallbackPresentation(video0, video1);

    // ignore keyboard layout
    document.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.repeat)
            return;
        // todo: keyCode is deprecated
        if (prev_key_codes.includes(e.keyCode))
            presentation.play_previous_slide();
        else if (next_key_codes.includes(e.keyCode))
            presentation.play_next_slide();
    });
}
