import "../index.css";
import previous_icon from "../icons/navigate_before_black_24dp.svg";
import restart_icon from "../icons/rotate_left_black_24dp.svg";
import next_icon from "../icons/navigate_next_black_24dp.svg";
import fullscreen_icon from "../icons/fullscreen_black_24dp.svg";

import { Presentation } from "./presenter/presentation";
import { BufferPresentation } from "./buffer_presenter/buffer_presentation";
import { FallbackPresentation } from "./fallback_presenter/fallback_presentation";

abstract class URLParams {
    private static m_url_search_params = new URLSearchParams(location.search);

    public static load(): void {
        if (this.m_url_search_params.has("cache_batch_size"))
            cache_batch_size = Number(this.m_url_search_params.get("cache_batch_size"));
        if (this.m_url_search_params.has("slides_to_auto_load"))
            slides_to_auto_load = Number(this.m_url_search_params.get("slides_to_auto_load"));
        if (this.m_url_search_params.has("slides_to_keep"))
            slides_to_keep = Number(this.m_url_search_params.get("slides_to_keep"));
        if (this.m_url_search_params.has("use_fallback"))
            use_fallback = this.m_url_search_params.get("use_fallback") === "true";
    }

    private static reload_url_params(): void {
        window.history.replaceState({}, "", `${location.pathname}?${this.m_url_search_params.toString()}`);
        location.reload();
    }

    // update url parameters and relaod page
    public static set(name: string, value: any): void {
        this.m_url_search_params.set(name, value.toString());
        this.reload_url_params();
    }
}

function create_presentation(): void {
    let progress_el = document.getElementById("progress") as HTMLDivElement;
    let bar_el = document.getElementById("progress-bar") as HTMLDivElement;
    let timeline = document.getElementById("timeline") as HTMLTableElement;
    let video0 = document.getElementById("video0") as HTMLVideoElement;
    let video1 = document.getElementById("video1") as HTMLVideoElement;
    let videos_div = document.getElementById("videos-div") as HTMLDivElement;

    if (use_fallback) {
        console.log(`Using FallbackPresentation with a cache batch size of ${cache_batch_size}`);
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
        presentation = new BufferPresentation(
            video0, video1,
            videos_div,
            timeline,
            progress_el,
            bar_el,
            cache_batch_size,
            slides_to_auto_load, slides_to_keep);
    }
}

function attach_media_ui(): void {
    let previous_button = document.getElementById("play-previous-slide") as HTMLButtonElement;
    let restart_button = document.getElementById("play-current-slide") as HTMLButtonElement;
    let next_button = document.getElementById("play-next-slide") as HTMLButtonElement;
    let fullscreen_button = document.getElementById("enter-fullscreen") as HTMLButtonElement;

    // set icons
    previous_button.getElementsByTagName("img")[0].src = previous_icon;
    restart_button.getElementsByTagName("img")[0].src = restart_icon;
    next_button.getElementsByTagName("img")[0].src = next_icon;
    fullscreen_button.getElementsByTagName("img")[0].src = fullscreen_icon;

    // add callbacks
    previous_button.addEventListener("click", presentation.play_previous_slide.bind(presentation));
    restart_button.addEventListener("click", presentation.restart_current_slide.bind(presentation));
    next_button.addEventListener("click", presentation.play_next_slide.bind(presentation));
    fullscreen_button.addEventListener("click", presentation.enter_fullscreen.bind(presentation));
}

// ignore keyboard layout
function attach_keyboard_ui(): void {
    // according to KeyboardEvent.code on: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values
    const prev_keys = [
        "ArrowLeft",
        "ArrowDown",
        "PageDown",
        "Backspace",
    ];
    const next_keys = [
        "ArrowRight",
        "ArrowUp",
        "PageUp",
        "Enter",
        "Space",
    ];
    const fullscreen_keys = [
        "KeyF",
    ];

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
}

function attach_nerdy_ui(): void {
    let cache_button = document.getElementById("cache-button") as HTMLDivElement;
    let fallback_button = document.getElementById("toggle-fallback") as HTMLButtonElement;
    let cache_batch_size_button = document.getElementById("cache-batch-size-button") as HTMLButtonElement;
    let slides_to_auto_load_button = document.getElementById("slides-to-auto-load-button") as HTMLButtonElement;
    let slides_to_keep_button = document.getElementById("slides-to-keep-button") as HTMLButtonElement;

    let cache_batch_size_input = document.getElementById("cache-batch-size-input") as HTMLInputElement;
    let slides_to_auto_load_input = document.getElementById("slides-to-auto-load-input") as HTMLInputElement;
    let slides_to_keep_input = document.getElementById("slides-to-keep-input") as HTMLInputElement;

    // set text
    fallback_button.innerText = use_fallback ? "Disable Fallback Loading" : "Use Fallback Loading";
    cache_batch_size_input.value = cache_batch_size.toString();
    slides_to_auto_load_input.value = slides_to_auto_load.toString();
    slides_to_keep_input.value = slides_to_keep.toString();

    // hide if not used
    if (use_fallback) {
        slides_to_auto_load_input.style.visibility = "hidden";
        slides_to_auto_load_button.style.visibility = "hidden";
        slides_to_keep_input.style.visibility = "hidden";
        slides_to_keep_button.style.visibility = "hidden";
    }

    // add callbacks
    cache_button.addEventListener("click", () => {
        cache_button.style.visibility = "hidden";
        presentation.cache_batch();
    });
    fallback_button.addEventListener("click", () => {
        URLParams.set("use_fallback", (!use_fallback).toString());
    });
    cache_batch_size_button.addEventListener("click", () => {
        let new_value = Number(cache_batch_size_input.value);
        URLParams.set("cache_batch_size", new_value);
    });
    slides_to_auto_load_button.addEventListener("click", () => {
        let new_value = Number(slides_to_auto_load_input.value);
        URLParams.set("slides_to_auto_load", new_value);
    });
    slides_to_keep_button.addEventListener("click", () => {
        let new_value = Number(slides_to_keep_input.value);
        URLParams.set("slides_to_keep", new_value);
    });
}

var cache_batch_size = 5;
var slides_to_auto_load = 5;
var slides_to_keep = 2;
var use_fallback = false;
var presentation: Presentation;

document.body.onload = () => {
    URLParams.load();
    create_presentation();
    attach_media_ui();
    attach_keyboard_ui();
    attach_nerdy_ui();
}
