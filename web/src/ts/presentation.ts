
export type PresentationJson = {
    animations: string[];
    slides: SlideJson[];
};

export type SlideJson = {
    name: string;
    slide_type: string;
    first_animation: number;
    after_last_animation: number;
};

export enum SlideType {
    NORMAL,
    LOOP,
    COMPLETE_LOOP
}

export abstract class Presentation {
    load_slides(onload: { (self: Presentation): void; }): void {
        get_json("index.json", (response, success) => {
            if (!success) {
                console.error(response);
                console.error("Slides could not be loaded");
                return;
            }

            // construct slides from json response
            let presentation_json = response as PresentationJson;
            let animations = presentation_json.animations;
            let slides = presentation_json.slides;
            for (let i = 0; i < slides.length; ++i)
                this.add_slide(slides[i], animations);
            console.log(`All ${slides.length} slides have been loaded successfully.`)
            onload(this);
        });
    }

    abstract add_slide(slide: SlideJson, animations: string[]): void;
    abstract set_video_element(video_element: HTMLVideoElement): void;

    abstract get_current_slide(): number;
    abstract set_current_slide(slide: number): void;

    abstract play_next_slide(): void;
    abstract play_previous_slide(): void;
};

export function get_slide_type_from_string(str: string): SlideType {
    switch (str) {
        case "normal": return SlideType.NORMAL;
        case "loop": return SlideType.LOOP;
        case "complete_loop": return SlideType.COMPLETE_LOOP;
        default: return SlideType.NORMAL;
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


