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

export abstract class Slide {
    protected type: SlideType;
    protected name: string;
    protected slide_id: number;
    protected video: string;

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

    public get_type(): SlideType { return this.type; }
    public get_name(): string { return this.name; }
    public get_id(): number { return this.slide_id; }
    public abstract get_src_url(): string;
}
