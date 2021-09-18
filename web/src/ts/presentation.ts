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
    video_element: HTMLVideoElement | null = null;
    slides: Slide[] = [];
    current_slide = -1;
    next_slide = 0;
    previous_slide = -1;

    load_slides(on_load: { (self: Presentation): void; }): void {
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
            on_load(this);
        });
    }

    update_video(): void { }

    play_video(): void {
        // if current slide is different from previous slide, change video source to new slide
        if (this.current_slide != this.previous_slide) {
            this.previous_slide = this.current_slide;
            if (this.video_element != null) {
                // revoke object url of video element if it exists
                // this has to be done because the pointer thingy isn't deleted automatically
                if (this.video_element.src.length != 0)
                    URL.revokeObjectURL(this.video_element.src);
                // create new object url of slides media source
                this.video_element.src = this.slides[this.current_slide].get_src_url();
                this.video_element.currentTime = 0;
                let promise = this.video_element.play();
                if (promise !== undefined)
                    promise.then(() => { }, () => { });
            }
        }

        // if current slide didn't change, restart video
        // -> used for loop slides
        else if (this.video_element != null) {
            this.video_element.currentTime = 0;
            let promise = this.video_element.play();
            if (promise !== undefined)
                promise.then(() => { }, () => { });
        }
    }

    abstract add_slide(slide: SlideJson): void;

    set_video_element(video_element: HTMLVideoElement): void {
        this.video_element = video_element;

        // attach an event to when the video has ended and update the video accordingly
        this.video_element.onended = (ev: Event) => {
            let cur_slide = this.slides[this.current_slide];
            switch (cur_slide.type) {
                case SlideType.LOOP: // when current slide is a loop type restart from beginning
                    this.update_video();
                    this.play_video();
                    break;
                case SlideType.COMPLETE_LOOP: // when current slide is complete loop and next slide has changed, go to next one
                    this.current_slide = this.next_slide;
                    this.update_video();
                    this.play_video();
                    break;
            }
        };
    }

    get_current_slide(): number { return this.current_slide; }

    set_current_slide(slide: number): void {
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
            this.play_video();
        }
    }

    play_next_slide(): void {
        this.set_current_slide(this.current_slide + 1);
    }

    play_previous_slide(): void {
        this.set_current_slide(this.current_slide - 1);
    }
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

