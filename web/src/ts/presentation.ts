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

    abstract add_slide(slide: SlideJson): void;
    abstract set_video_element(video_element: HTMLVideoElement): void;

    abstract get_current_slide(): number;
    abstract set_current_slide(slide: number): void;

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

