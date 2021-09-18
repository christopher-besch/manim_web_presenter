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
    COMPLETE_LOOP
}

export function get_slide_type_from_string(str: string): SlideType {
    switch (str) {
        case "normal": return SlideType.NORMAL;
        case "loop": return SlideType.LOOP;
        case "complete_loop": return SlideType.COMPLETE_LOOP;
        default: return SlideType.NORMAL;
    }
}

export abstract class Presentation {
    // using two video elements for smooth transitions
    video0: HTMLVideoElement;
    video1: HTMLVideoElement;
    current_video = 0;

    slides: Slide[] = [];
    current_slide = -1;
    next_slide = 0;
    previous_slide = -1;

    constructor(video0: HTMLVideoElement, video1: HTMLVideoElement) {
        this.video0 = video0;
        this.video1 = video1;

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

            // set callback for when video has ended
            let onended = (_: Event) => {
                let cur_slide = this.slides[this.current_slide];
                switch (cur_slide.type) {
                    case SlideType.LOOP: // when current slide is a loop type restart from beginning
                        this.update_video();
                        break;
                    case SlideType.COMPLETE_LOOP: // when current slide is complete loop and next slide has changed, go to next one
                        this.current_slide = this.next_slide;
                        this.update_video();
                        break;
                }
            }

            this.video0.onended = onended;
            this.video1.onended = onended;

            // start the action
            this.play_slide(0);
        });
    }

    update_video(): void {
        this.update_source();
        // if current slide is different from previous slide, change video source to new slide
        if (this.current_slide != this.previous_slide) {
            // swap videos
            this.previous_slide = this.current_slide;
            let last_element = this.get_current_video();
            this.current_video = this.current_video == 0 ? 1 : 0;
            let next_element = this.get_current_video();

            // setup new vidoe
            next_element.src = this.slides[this.current_slide].get_src_url();
            next_element.style.visibility = "visible";
            // hide old video once new one plays
            next_element.play().then(() => {
                last_element.style.visibility = "hidden";
            });
        }
        else {
            // if current slide didn't change, restart video
            // -> used for loop slides
            this.get_current_video().currentTime = 0;
            this.get_current_video().play();
        }
    }

    play_next_slide(): void {
        this.play_slide(this.current_slide + 1);
    }

    play_previous_slide(): void {
        this.play_slide(this.current_slide - 1);
    }

    play_slide(slide: number): void {
        if (slide < 0 || slide >= this.slides.length) {
            console.error(`Trying to switch to invalid slide #${slide}`)
            return;
        } else
            console.log(`Switching to slide #${slide}`)

        if (this.current_slide >= 0 && this.slides[this.current_slide].type == SlideType.COMPLETE_LOOP) {
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

    abstract add_slide(slide: SlideJson): void;

    // called in very beginning of play_video()
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

    abstract get_src_url(): string;
}

// download file and parse json
function get_json(url: string, callback: { (response: any, success: boolean): void; }): void {
    let request = new XMLHttpRequest();
    request.onreadystatechange = () => {
        // when a response has been received
        if (request.readyState == 4) {
            try {
                callback(JSON.parse(request.responseText), request.status == 200);
            } catch (error) {
                callback(error, false);
            }
        }
    };
    request.open("GET", url, true);
    request.send();
}

