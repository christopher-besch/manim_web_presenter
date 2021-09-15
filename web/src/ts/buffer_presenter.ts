import "../index.css";
import { Presentation, SlideJson, SlideType, get_slide_type_from_string } from "./presentation";


class Animation {
    slide: Slide;
    url: string;
    media_buffer: BufferSource | null = null;
    loaded: boolean = false;

    constructor(url: string, slide: Slide) {
        this.slide = slide;
        this.url = url;
    }

    // load animation video using ajax
    load_animation(
        on_loaded: (self: Animation) => void,
        on_failed: (self: Animation) => void
    ): void {
        if (this.loaded) {
            on_loaded(this);
            return;
        }

        let request = new XMLHttpRequest();
        request.responseType = "arraybuffer";
        request.onload = () => {
            this.media_buffer = request.response;
            this.loaded = true;
            on_loaded(this);
        };
        request.onerror = () => {
            on_failed(this);
        };
        request.open("GET", this.url, true);
        request.send();
    }

    unload_animation(): void {
        this.media_buffer = null;
        this.loaded = false;
    }
}

class Slide {
    presentation: Presentation;
    name: string;
    type: SlideType;
    animations: Animation[] = [];
    // all animations of slide get concatenated -> only one MediaSource required
    media_source: MediaSource = new MediaSource();

    constructor(slide: SlideJson, animations: string[], presentation: Presentation) {
        this.presentation = presentation;
        this.name = slide.name;
        this.type = get_slide_type_from_string(slide.slide_type);

        for (let i = slide.first_animation; i < slide.after_last_animation; ++i)
            this.animations.push(new Animation(animations[i], this));

        this.media_source.onsourceopen = this.on_media_source_open.bind(this);
    }

    on_media_source_open(ev: Event): void {
        let media_source = ev.target as MediaSource;

        // if the slide doesn't have any animations just end it
        if (this.animations.length == 0) {
            media_source.endOfStream();
            return;
        }

        // check if MIME codec is supported
        let mime_codec = "video/mp4; codecs=\"avc1.64002A\"";
        if (!("MediaSource" in window) || !MediaSource.isTypeSupported(mime_codec)) {
            console.error("MediaSource or mime codec not supported");
            media_source.endOfStream();
            return;
        }

        // add source buffer to media source of this slide
        let source_buffer = media_source.addSourceBuffer(mime_codec);
        source_buffer.mode = "sequence";
        let loaded_media_buffers = 0;

        // set callbacks
        source_buffer.onupdateend = (ev: Event) => {
            // all required animations loaded?
            if (++loaded_media_buffers == this.animations.length) {
                media_source.endOfStream();
                return;
            }

            // load next animations
            this.append_animation_to_source_buffer(ev.target as SourceBuffer, this.animations[loaded_media_buffers]);
        };
        source_buffer.onerror = (ev: Event) => {
            console.error("Failed to append buffer to source buffer:");
            console.error(ev.target);
        };
        source_buffer.onabort = (ev: Event) => {
            console.error("Aborted source buffer:");
            console.error(ev.target);
        };

        // initially load first animation to kick start loading process
        this.append_animation_to_source_buffer(source_buffer, this.animations[0]);
    }

    append_animation_to_source_buffer(source_buffer: SourceBuffer, animation: Animation): void {
        animation.load_animation((self: Animation) => {
            // success
            if (self.media_buffer == null)
                source_buffer.abort();
            else
                source_buffer.appendBuffer(self.media_buffer);
        }, (self: Animation) => {
            // failure
            source_buffer.abort();
            console.error(`Failed to load animation "${self.url}"`);
        });
    }

    get_animation(animation: number): Animation | null {
        if (animation >= 0 && animation < this.animations.length)
            return this.animations[animation];
        return null;
    }

    load_animations(): void {
        for (let i = 0; i < this.animations.length; ++i) {
            this.animations[i].load_animation(
                (self: Animation) => { },
                (self: Animation) => {
                    console.error(`Failed to load animation "${self.url}"`);
                });
        }
    }

    unload_animations(): void {
        for (let i = 0; i < this.animations.length; ++i)
            this.animations[i].unload_animation();
    }
}

export class BufferPresentation extends Presentation {
    video_element: HTMLVideoElement | null = null;
    slides: Slide[] = [];
    current_slide = -1;
    // used for complete loop slides
    next_slide = 0;
    previous_slide = -1;
    loaded = false;
    slides_to_auto_load = 5;
    slides_to_keep = 2;

    // update currently playing video according to current_slide
    update_video(): void {
        // load next slides based on this.slides_to_auto_load
        for (let i = 0, len = Math.min(this.slides_to_auto_load, this.slides.length - this.current_slide); i < len; ++i)
            this.slides[this.current_slide + i].load_animations();
        // unload previous slides based on this.slides_to_keep
        for (let i = 0, len = this.current_slide - this.slides_to_keep; i < len; ++i)
            this.slides[i].unload_animations();

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
                this.video_element.src = URL.createObjectURL(slide.media_source);
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

    add_slide(slide: SlideJson, animations: string[]): void {
        this.slides.push(new Slide(slide, animations, this));
    }

    set_video_element(video_element: HTMLVideoElement): void {
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
        }
    }

    play_next_slide(): void {
        this.set_current_slide(this.current_slide + 1);
    }

    play_previous_slide(): void {
        this.set_current_slide(this.current_slide - 1);
    }
}
