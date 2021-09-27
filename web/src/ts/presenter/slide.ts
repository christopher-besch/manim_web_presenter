export type SlideJson = {
    slide_type: string;
    name: string;
    slide_id: number;
    first_animation: number;
    after_last_animation: number;
    video: string;
};

export type ExportSlideJson = {
    slide_type: string;
    name: string;
    slide_id: number;
    video: string;
    time_stamp: number;
};

export enum SlideType {
    NORMAL,
    LOOP,
    SKIP,
    COMPLETE_LOOP
}

export function get_slide_type(str: string): SlideType {
    switch (str) {
        case "normal": return SlideType.NORMAL;
        case "loop": return SlideType.LOOP;
        case "skip": return SlideType.SKIP;
        case "complete_loop": return SlideType.COMPLETE_LOOP;
        default:
            console.error(`Unsupported slide type '${str}'`);
            return SlideType.NORMAL;
    }
}

export function get_slide_type_str(input: SlideType): string {
    switch (input) {
        case SlideType.NORMAL: return "normal";
        case SlideType.LOOP: return "loop";
        case SlideType.SKIP: return "skip";
        case SlideType.COMPLETE_LOOP: return "complete_loop";
        default:
            console.error(`Unsupported slide type '${input}'`);
            return "normal";
    }
}

export abstract class Slide {
    protected type: SlideType;
    protected name: string;
    protected slide_id: number;
    protected video: string;

    protected time_stamp = -1;

    public constructor(slide: SlideJson) {
        this.type = get_slide_type(slide.slide_type);
        this.name = slide.name;
        this.slide_id = slide.slide_id;
        this.video = slide.video;
    }

    public cache(on_cached: () => void): void {
        let request = new XMLHttpRequest();
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

    public export(): ExportSlideJson {
        return {
            slide_type: get_slide_type_str(this.type),
            name: this.name,
            slide_id: this.slide_id,
            video: this.video,
            time_stamp: this.time_stamp,
        };
    }

    public get_type(): SlideType { return this.type; }
    public get_name(): string { return this.name; }
    public get_id(): number { return this.slide_id; }
    public get_time_stamp(): number { return this.time_stamp; }
    public abstract get_src_url(): string;

    public set_time_stamp(time_stamp: number): void { this.time_stamp = time_stamp; }
}
