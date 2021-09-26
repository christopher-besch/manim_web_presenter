import { Presentation } from "../presenter/presentation";
import { SlideJson } from "../presenter/slide";
import { BufferSlide } from "./buffer_slide";

export class BufferPresentation extends Presentation {
    // when both 0, only current slide will be buffered
    private slides_to_auto_load;
    private slides_to_keep;

    public constructor(
        video0: HTMLVideoElement,
        video1: HTMLVideoElement,
        videos_div: HTMLDivElement,
        timeline: HTMLTableElement,
        progress_el: HTMLDivElement,
        bar_el: HTMLDivElement,
        cache_batch_size: number,

        slides_to_auto_load: number,
        slides_to_keep: number) {

        super(video0, video1, videos_div, timeline, progress_el, bar_el, cache_batch_size);
        this.slides_to_auto_load = slides_to_auto_load;
        this.slides_to_keep = slides_to_keep;
    }

    // update currently playing video according to current_slide
    protected override update_source(): void {
        // load next slides
        for (let i = this.current_slide + 1, len = Math.min(this.current_slide + this.slides_to_auto_load + 1, this.slides.length); i < len; ++i)
            (this.slides[i] as BufferSlide).load();
        // unload previous slides
        for (let i = 0, len = this.current_slide - this.slides_to_keep; i < len; ++i)
            (this.slides[i] as BufferSlide).unload();
    }

    protected override add_slide(slide: SlideJson): void {
        this.slides.push(new BufferSlide(slide));
    }
}
