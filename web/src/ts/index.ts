import "../index.css";
import previous_icon from "../icons/navigate_before_black_24dp.svg";
import restart_icon from "../icons/rotate_left_black_24dp.svg";
import next_icon from "../icons/navigate_next_black_24dp.svg";
import fullscreen_icon from "../icons/fullscreen_black_24dp.svg";

import { Presentation } from "./presenter";
import { BufferPresentation } from "./buffer_presenter";
import { FallbackPresentation } from "./fallback_presenter";

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
    "Space",
];
let fullscreen_keys = [
    "KeyF",
];

document.body.onload = () => {
    let url_params = new URLSearchParams(location.search);
    let cache_batch_size = 5;
    let slides_to_auto_load = 5;
    let slides_to_keep = 2;
    let use_fallback = false;

    if (url_params.has("cache_batch_size"))
        cache_batch_size = Number(url_params.get("cache_batch_size"));
    if (url_params.has("slides_to_auto_load"))
        slides_to_auto_load = Number(url_params.get("slides_to_auto_load"));
    if (url_params.has("slides_to_keep"))
        slides_to_keep = Number(url_params.get("slides_to_keep"));
    if (url_params.has("use_fallback"))
        use_fallback = url_params.get("use_fallback") === "true";

    let progress_el = document.getElementById("progress") as HTMLDivElement;
    let bar_el = document.getElementById("progress-bar") as HTMLDivElement;
    let cache_button = document.getElementById("cache-button") as HTMLDivElement;

    let previous_button = document.getElementById("play-previous-slide") as HTMLButtonElement;
    let restart_button = document.getElementById("play-current-slide") as HTMLButtonElement;
    let next_button = document.getElementById("play-next-slide") as HTMLButtonElement;
    let fullscreen_button = document.getElementById("enter-fullscreen") as HTMLButtonElement;
    let fallback_button = document.getElementById("toggle-fallback") as HTMLButtonElement;
    let cache_batch_size_input = document.getElementById("cache-batch-size-input") as HTMLInputElement;
    let cache_batch_size_button = document.getElementById("cache-batch-size-button") as HTMLButtonElement;
    let slides_to_auto_load_input = document.getElementById("slides-to-auto-load-input") as HTMLInputElement;
    let slides_to_auto_load_button = document.getElementById("slides-to-auto-load-button") as HTMLButtonElement;
    let slides_to_keep_input = document.getElementById("slides-to-keep-input") as HTMLInputElement;
    let slides_to_keep_button = document.getElementById("slides-to-keep-button") as HTMLButtonElement;

    let timeline = document.getElementById("timeline") as HTMLTableElement;
    let video0 = document.getElementById("video0") as HTMLVideoElement;
    let video1 = document.getElementById("video1") as HTMLVideoElement;
    let videos_div = document.getElementById("videos-div") as HTMLDivElement;
    if (video0 == null || video1 == null)
        throw "Cant't find video elements.";

    let presentation: Presentation;
    if (use_fallback) {
        console.log(`Using FallbackPresentation with a cache batch size of ${cache_batch_size}`);
        slides_to_auto_load_input.style.visibility = "hidden";
        slides_to_auto_load_button.style.visibility = "hidden";
        slides_to_keep_input.style.visibility = "hidden";
        slides_to_keep_button.style.visibility = "hidden";

        presentation = new FallbackPresentation(
            video0, video1,
            videos_div,
            timeline,
            progress_el,
            bar_el,
            cache_batch_size);
    }
    else {
        console.log(`Using BufferPresentation with ${slides_to_auto_load} slides to auto load, ${slides_to_keep} slides to keep and a cache batch size of ${cache_batch_size}`);
        slides_to_auto_load_input.style.visibility = "visible";
        slides_to_auto_load_button.style.visibility = "visible";
        slides_to_keep_input.style.visibility = "visible";
        slides_to_keep_button.style.visibility = "visible";

        presentation = new BufferPresentation(
            video0, video1,
            videos_div,
            timeline,
            progress_el,
            bar_el,
            cache_batch_size,
            slides_to_auto_load, slides_to_keep);
    }

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

    cache_button.addEventListener("click", () => {
        cache_button.style.visibility = "hidden";
        presentation.cache_batch();
    });

    // set icons
    previous_button.getElementsByTagName("img")[0].src = previous_icon;
    restart_button.getElementsByTagName("img")[0].src = restart_icon;
    next_button.getElementsByTagName("img")[0].src = next_icon;
    fullscreen_button.getElementsByTagName("img")[0].src = fullscreen_icon;
    // and text
    fallback_button.innerText = use_fallback ? "Disable Fallback Loading" : "Use Fallback Loading";
    cache_batch_size_input.value = cache_batch_size.toString();
    slides_to_auto_load_input.value = slides_to_auto_load.toString();
    slides_to_keep_input.value = slides_to_keep.toString();

    previous_button.addEventListener("click", presentation.play_previous_slide.bind(presentation));
    restart_button.addEventListener("click", presentation.restart_current_slide.bind(presentation));
    next_button.addEventListener("click", presentation.play_next_slide.bind(presentation));
    fullscreen_button.addEventListener("click", presentation.enter_fullscreen.bind(presentation));
    fallback_button.addEventListener("click", () => {
        url_params.set("use_fallback", (!use_fallback).toString());
        // todo: put in function
        window.history.replaceState({}, "", `${location.pathname}?${url_params.toString()}`);
        location.reload();
    });
    cache_batch_size_button.addEventListener("click", () => {
        let new_value = Number(cache_batch_size_input.value);
        url_params.set("cache_batch_size", new_value.toString());
        // todo: put in function
        window.history.replaceState({}, "", `${location.pathname}?${url_params.toString()}`);
        location.reload();
    });
    slides_to_auto_load_button.addEventListener("click", () => {
        let new_value = Number(slides_to_auto_load_input.value);
        url_params.set("slides_to_auto_load", new_value.toString());
        // todo: put in function
        window.history.replaceState({}, "", `${location.pathname}?${url_params.toString()}`);
        location.reload();
    });
    slides_to_keep_button.addEventListener("click", () => {
        let new_value = Number(slides_to_keep_input.value);
        url_params.set("slides_to_keep", new_value.toString());
        // todo: put in function
        window.history.replaceState({}, "", `${location.pathname}?${url_params.toString()}`);
        location.reload();
    });
}
