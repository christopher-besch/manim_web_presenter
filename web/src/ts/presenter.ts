import { get_json, ProgressBar } from "./utils";

import unselected_icon from "../icons/radio_button_unchecked_black_24dp.svg";
import selected_icon from "../icons/radio_button_checked_black_24dp.svg";
import finished_icon from "../icons/check_circle_black_24dp.svg";

import normal_slide_icon from "../icons/vertical_align_bottom_black_24dp.svg";
import skip_slide_icon from "../icons/arrow_downward_black_24dp.svg";
import loop_slide_icon from "../icons/rotate_left_black_24dp.svg";
import complete_loop_slide_icon from "../icons/loop_black_24dp.svg";

export type PresentationJson = {
    slides: SlideJson[];
};

export type SlideJson = {
    slide_type: string;
    name: string;
    slide_id: number;
    first_animation: number;
    after_last_animation: number;
    video: string;
};

export enum SlideType {
    NORMAL,
    LOOP,
    SKIP,
    COMPLETE_LOOP
}

export function get_slide_type_from_string(str: string): SlideType {
    switch (str) {
        case "normal": return SlideType.NORMAL;
        case "loop": return SlideType.LOOP;
        case "skip": return SlideType.SKIP;
        case "complete_loop": return SlideType.COMPLETE_LOOP;
        default: return SlideType.NORMAL;
    }
}

export abstract class Presentation {
    timeline: HTMLTableElement;
    timeline_slides: HTMLImageElement[] = [];

    // using two video elements for smooth transitions
    video0: HTMLVideoElement;
    video1: HTMLVideoElement;
    videos_div: HTMLDivElement;
    // gets flipped when displaying first video
    // -> required for css to be correct
    current_video = 1;

    slides: Slide[] = [];
    current_slide = -1;
    // used for restarting loops
    // <- has to be done to allow complete loops
    previous_slide = -1;
    // used for complete loops
    next_slide = 0;

    cache_batch_size: number;
    progress_bar: ProgressBar;

    constructor(
        video0: HTMLVideoElement,
        video1: HTMLVideoElement,
        videos_div: HTMLDivElement,
        timeline: HTMLTableElement,
        progress_el: HTMLDivElement,
        bar_el: HTMLDivElement,
        cache_batch_size: number) {

        this.video0 = video0;
        this.video1 = video1;
        this.videos_div = videos_div;
        this.timeline = timeline;
        this.cache_batch_size = cache_batch_size;
        this.progress_bar = new ProgressBar(progress_el, bar_el);

        // load_slides
        get_json("index.json", (response, success) => {
            if (!success) {
                console.error(response);
                console.error("Slides could not be loaded");
                return;
            }

            // construct slides from json response
            let presentation_json = response as PresentationJson;
            let slides = presentation_json.slides;
            for (let i = 0; i < slides.length; ++i)
                this.add_slide(slides[i]);
            console.log(`All ${slides.length} slides have been parsed successfully.`)

            this.progress_bar.set_max(slides.length);
            this.load_timeline();
            // start the action
            this.play_slide(0);
        });
    }

    update_video(): void {
        let current_slide_elem = this.slides[this.current_slide];
        // if current slide is different from previous slide, change video source to new slide
        if (this.current_slide != this.previous_slide) {
            // swap videos
            let last_element = this.get_current_video();
            this.current_video = this.current_video == 0 ? 1 : 0;
            let next_element = this.get_current_video();

            // double buffering: setup new video
            next_element.src = current_slide_elem.get_src_url();
            next_element.style.visibility = "visible";

            // set callback for when video has ended
            switch (current_slide_elem.type) {
                case SlideType.SKIP:
                    next_element.onended = (_) => {
                        // immediately go to next slide without user input
                        ++this.current_slide;
                        this.next_slide = this.current_slide;
                        this.update_video();
                    }
                    break;
                case SlideType.LOOP:
                    next_element.onended = (_) => {
                        // restart from beginning
                        this.update_video();
                    }
                    break;
                case SlideType.COMPLETE_LOOP:
                    next_element.onended = (_) => {
                        // when next slide has changed, go to next one
                        // otherwise restart
                        this.current_slide = this.next_slide;
                        this.update_video();
                    }
                    break;
                default:
                    next_element.onended = (_) => { }
                    break;
            }

            console.log(`Playing slide '${current_slide_elem.name}'`)
            // hide old video once new one plays
            next_element.play().then(() => {
                // pause old video to not call onended callback again when that video ends in the background
                last_element.pause();
                last_element.style.visibility = "hidden";
            });

            this.update_timeline()
            this.update_source();

            // everything done -> side has changed
            this.previous_slide = this.current_slide;
        }
        else {
            // if current slide didn't change, restart video
            // -> used for loop slides
            this.get_current_video().currentTime = 0;
            this.get_current_video().play();
        }
    }

    load_timeline(): void {
        for (let slide of this.slides) {
            // one row, three cells per slide
            let row = document.createElement("tr");
            this.timeline.appendChild(row);
            row.onclick = () => {
                this.play_slide(slide.slide_id, true);
            };

            // selector
            let cell1 = document.createElement("td");
            row.appendChild(cell1);
            let selector = document.createElement("img");
            cell1.appendChild(selector);
            selector.src = unselected_icon;
            selector.width = 30;
            selector.height = 30;
            this.timeline_slides.push(selector);

            // slide type
            let cell2 = document.createElement("td");
            row.appendChild(cell2);
            let slide_icon = document.createElement("img");
            cell2.appendChild(slide_icon);
            switch (slide.type) {
                case SlideType.NORMAL:
                    slide_icon.src = normal_slide_icon;
                    break;
                case SlideType.SKIP:
                    slide_icon.src = skip_slide_icon;
                    break;
                case SlideType.LOOP:
                    slide_icon.src = loop_slide_icon;
                    break;
                case SlideType.COMPLETE_LOOP:
                    slide_icon.src = complete_loop_slide_icon;
                    break;
            }
            selector.width = 30;
            selector.height = 30;

            // button
            let cell3 = document.createElement("td");
            row.appendChild(cell3);
            let button = document.createElement("button");
            cell2.appendChild(button);
            button.innerText = slide.name;
        }
    }

    update_timeline(): void {
        // remove old indicator
        if (this.previous_slide != -1) {
            this.timeline_slides[this.previous_slide].src = finished_icon;
        }
        // add new indicator
        this.timeline_slides[this.current_slide].src = selected_icon;
    }


    play_next_slide(): void {
        this.play_slide(this.current_slide + 1);
    }

    restart_current_slide(): void {
        this.play_slide(this.current_slide, true);
    }

    play_previous_slide(): void {
        // don't finish complete loops when going back
        this.play_slide(this.current_slide - 1, true);
    }

    play_slide(slide: number, skip_complete_loop = false): void {
        if (slide < 0 || slide >= this.slides.length) {
            console.error(`Trying to switch to invalid slide number #${slide}`)
            return;
        } else
            console.log(`Switching to slide '${this.slides[slide].name} '`)

        if (this.current_slide != -1 && this.slides[this.current_slide].type == SlideType.COMPLETE_LOOP && !skip_complete_loop) {
            // if current slide is complete loop, wait until slide finishes
            this.next_slide = slide;
        } else {
            // instantly switch the video
            this.next_slide = slide;
            this.current_slide = slide;
            this.update_video();
        }
    }

    get_current_slide(): number { return this.current_slide; }

    get_current_video(): HTMLVideoElement {
        if (this.current_video == 0)
            return this.video0;
        else
            return this.video1;
    }

    // recursive; downloads everything after offset in batches
    cache_batch(offset: number = 0): void {
        this.progress_bar.show();
        let done = false;
        let finished = offset;
        // cache one whole batch
        for (let i = offset, len = Math.min(offset + this.cache_batch_size, this.slides.length); i < len; ++i)
            this.slides[i].cache(() => {
                // when this slide has been cached
                this.progress_bar.update(finished);
                ++finished;
                // all finished
                if (finished == this.slides.length) {
                    console.log(`Batch caching complete with offset ${offset}`)
                    console.log("Caching complete");
                    this.progress_bar.hide();
                    done = true;
                }
                // start next batch
                else if (finished == offset + this.cache_batch_size) {
                    console.log(`Batch caching complete with offset ${offset}`)
                    this.cache_batch(finished);
                }
            });
    }

    // todo: test on other browsers
    enter_fullscreen(): void {
        if (this.videos_div.requestFullscreen)
            this.videos_div.requestFullscreen();
        // // safari
        // else if (this.videos_div.webkitRequestFullscreen)
        //     this.videos_div.webkitRequestFullscreen();
        // // ie11
        // else if (this.videos_div.msRequestFullscreen)
        //     this.videos_div.msRequestFullscreen();
    }

    exit_fullscreen(): void {
        if (document.exitFullscreen)
            document.exitFullscreen();
        // // safari
        // else if (document.webkitExitFullscreen)
        //     document.webkitExitFullscreen();
        // // ie11
        // else if (document.msExitFullscreen)
        //     document.msExitFullscreen();
    }

    fullscreen_status(): boolean {
        // return document.fullscreenElement != null ||
        //     document.webkitFullscreenElement != null ||
        //     document.mozFullScreenElement != null;
        return document.fullscreenElement != null;
    }

    toggle_fullscreen(): void {
        if (this.fullscreen_status())
            this.exit_fullscreen();
        else
            this.enter_fullscreen();
    }

    abstract add_slide(slide: SlideJson): void;

    // called after slide changed
    // to be overwritten if required
    update_source(): void { }
};

export abstract class Slide {
    type: SlideType;
    name: string;
    slide_id: number;
    video: string;

    constructor(slide: SlideJson) {
        this.type = get_slide_type_from_string(slide.slide_type);
        this.name = slide.name;
        this.slide_id = slide.slide_id;
        this.video = slide.video;
    }

    cache(on_cached: () => void): void {
        let request = new XMLHttpRequest();
        // request.onload = on_cached;
        request.onload = () => {
            console.log(`Cached slide '${this.name}'`)
            on_cached();
        };
        request.onerror = () => {
            console.error(`Slide '${this.name}' failed to be cached`);
        };
        request.open("GET", this.video, true);
        request.send();
    }

    abstract get_src_url(): string;
}
