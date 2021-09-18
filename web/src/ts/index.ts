import "../index.css";

import { BufferPresentation } from "./buffer_presenter";
import { Presentation } from "./presentation";

// open or focus second window, return success status
function open_popup_video_viewer(): boolean {
    if (popup_video_viewer == null || popup_video_viewer.closed) {
        popup_video_viewer = window.open(
            "/video_viewer.html",
            "Manim Video Viewer",
            "resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no,status=no"
        );
        return popup_video_viewer != null;
    } else {
        popup_video_viewer.focus();
        return true;
    }
}

let presentation = new BufferPresentation();
let popup_video_viewer: Window | null;

let prev_key_codes = [
    37, // ArrowLeft
];
let next_key_codes = [
    39, // ArrowRight
];

// ignore keyboard layout
document.addEventListener("keydown", (e: KeyboardEvent) => {
    // todo: debug
    if (e.repeat)
        return;
    if (prev_key_codes.includes(e.keyCode))
        presentation.play_previous_slide();
    else if (next_key_codes.includes(e.keyCode))
        presentation.play_next_slide();
});

document.body.onload = () => {
    presentation.load_slides((self: Presentation) => {
        let videoElement = document.querySelector("div.main div.playback video");
        if (videoElement != null)
            self.set_video_element(videoElement as HTMLVideoElement);
        else
            console.error("Failed to find video element")
        self.set_current_slide(0);
    });
}
