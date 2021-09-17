import "../index.css";
import { SlideJson, Presentation, Slide, SlideType } from "./presentation";

class BufferSlide extends Slide {
    media_source: MediaSource = new MediaSource();
    media_buffer: BufferSource | null = null;

    constructor(slide: SlideJson) {
        super(slide);
        this.media_source.onsourceopen = this.on_media_source_open.bind(this);
    }

    on_media_source_open(ev: Event): void {
        // check if MIME codec is supported
        let mime_codec = 'video/mp4; codecs="avc1.64002A"';
        if (!("MediaSource" in window) || !MediaSource.isTypeSupported(mime_codec)) {
            console.error("MediaSource or mime codec not supported");
            this.media_source.endOfStream();
            return;
        }

        // add source buffer to media source of this slide
        let source_buffer = this.media_source.addSourceBuffer(mime_codec);
        // source_buffer.mode = "sequence";

        // set callbacks
        source_buffer.onupdateend = (ev: Event) => {
            console.log(`ending slide '${this.name}'`)
            this.media_source.endOfStream();
        };
        source_buffer.onerror = (ev: Event) => {
            console.error("Failed to append buffer to source buffer:");
            console.error(this.media_source);
        };
        source_buffer.onabort = (ev: Event) => {
            console.error("Aborted source buffer:");
            console.error(this.media_source);
        };

        this.load(() => {
            // success
            if (this.media_buffer == null)
                source_buffer.abort();
            else
                source_buffer.appendBuffer(this.media_buffer);
        }, () => {
            // failure
            source_buffer.abort();
        });
    }

    get_media_source(): MediaSource {
        return this.media_source;
    }

    load(
        on_loaded: (() => void) | null = null,
        on_failed: (() => void) | null = null
    ): void {
        if (this.media_buffer != null) {
            console.error("Trying to load already loaded slide.");
            if (on_loaded !== null)
                on_loaded();
            return;
        }

        let request = new XMLHttpRequest();
        request.responseType = "arraybuffer";
        request.onload = () => {
            this.media_buffer = request.response;
            console.log(`Slide '${this.name}' successfully loaded`);
            if (on_loaded !== null)
                on_loaded();
        };
        request.onerror = () => {
            console.error(`Slide '${this.name}' failed to load`);
            if (on_failed !== null)
                on_failed();
        };
        request.open("GET", this.video, true);
        request.send();
    }

    unload(): void {
        this.media_buffer = null;
    }
}

export class BufferPresentation extends Presentation {
    video_element: HTMLVideoElement | null = null;
    slides: BufferSlide[] = [];
    // used for complete loop slides
    loaded = false;
    slides_to_auto_load = 5;
    slides_to_keep = 2;

    // update currently playing video according to current_slide
    update_video(): void {
        // load next slides based on this.slides_to_auto_load
        for (let i = 0, len = Math.min(this.slides_to_auto_load, this.slides.length - this.current_slide); i < len; ++i)
            this.slides[this.current_slide + i].load();
        // unload previous slides based on this.slides_to_keep
        for (let i = 0, len = this.current_slide - this.slides_to_keep; i < len; ++i)
            this.slides[i].unload();

        // if current slide is non existent, set video element to empty video
        if (this.current_slide < 0 || this.current_slide >= this.slides.length) {
            if (this.video_element != null) {
                if (this.video_element.src.length != 0)
                    URL.revokeObjectURL(this.video_element.src);
                this.video_element.src = "";
                this.video_element.currentTime = 0;
                let promise = this.video_element.play();
                // todo: fill with functionality or remove
                if (promise !== undefined)
                    promise.then(() => { }, () => { });
            }
        }

        // if current slide is different from previous slide, change video source to new slide
        else if (this.current_slide != this.previous_slide) {
            this.previous_slide = this.current_slide;
            let slide = this.slides[this.current_slide];
            if (this.video_element != null) {
                // revoke object url of video element if it exists
                // this has to be done because the pointer thingy isn't deleted automatically
                if (this.video_element.src.length != 0)
                    URL.revokeObjectURL(this.video_element.src);
                // create new object url of slides media source
                this.video_element.src = URL.createObjectURL(slide.get_media_source());
                this.video_element.currentTime = 0;
                let promise = this.video_element.play();
                // todo: fill with functionality or remove
                if (promise !== undefined)
                    promise.then(() => { }, () => { });
            }
        }

        // if current slide didn't change, restart video
        // -> used for loop slides
        else if (this.video_element != null) {
            this.video_element.currentTime = 0;
            let promise = this.video_element.play();
            // todo: fill with functionality or remove
            if (promise !== undefined)
                promise.then(() => { }, () => { });
        }
    }

    override add_slide(slide: SlideJson): void {
        this.slides.push(new BufferSlide(slide));
    }

    override set_video_element(video_element: HTMLVideoElement): void {
        this.video_element = video_element;

        // attach an event to when the video has ended and update the video accordingly
        this.video_element.onended = (ev: Event) => {
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
        };
    }

    override get_current_slide(): number { return this.current_slide; }

    override set_current_slide(slide: number): void {
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
}
