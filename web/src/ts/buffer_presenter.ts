import "../index.css";
import { SlideJson, Presentation, Slide } from "./presentation";

class BufferSlide extends Slide {
    media_source: MediaSource = new MediaSource();
    media_buffer: BufferSource | null = null;

    constructor(slide: SlideJson) {
        super(slide);
        // when setting url to video element
        this.media_source.onsourceopen = (_) => {
            // check if MIME codec is supported
            let mime_codec = 'video/mp4; codecs="avc1.64002A"';
            if (!("MediaSource" in window) || !MediaSource.isTypeSupported(mime_codec)) {
                console.error("MediaSource or mime codec not supported");
                this.media_source.endOfStream();
                return;
            }

            // add source buffer to media source of this slide
            let source_buffer = this.media_source.addSourceBuffer(mime_codec);

            // set callbacks
            source_buffer.onupdateend = (_) => {
                this.media_source.endOfStream();
            };
            source_buffer.onerror = (_) => {
                console.error("Failed to append buffer to source buffer:");
                console.error(this.media_source);
            };
            source_buffer.onabort = (_) => {
                console.error("Aborted source buffer:");
                console.error(this.media_source);
            };

            this.load(() => {
                if (this.media_buffer == null) {
                    source_buffer.abort();
                    return;
                }
                // success
                source_buffer.appendBuffer(this.media_buffer);
            }, () => {
                // failure
                source_buffer.abort();
            });
        }
    }

    load(
        on_loaded: (() => void) | null = null,
        on_failed: (() => void) | null = null
    ): void {
        if (this.media_buffer !== null) {
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

    override get_src_url(): string {
        return URL.createObjectURL(this.media_source);
    }
}

export class BufferPresentation extends Presentation {
    // when both 0, only current slide will be buffered
    slides_to_auto_load;
    slides_to_keep;

    constructor(slides_to_auto_load: number, slides_to_keep: number) {
        super();
        this.slides_to_auto_load = slides_to_auto_load;
        this.slides_to_keep = slides_to_keep;
    }

    // update currently playing video according to current_slide
    override update_video(): void {
        // load next slides
        for (let i = this.current_slide + 1, len = Math.min(this.current_slide + this.slides_to_auto_load + 1, this.slides.length); i < len; ++i)
            (this.slides[i] as BufferSlide).load();
        // unload previous slides
        for (let i = 0, len = this.current_slide - this.slides_to_keep; i < len; ++i)
            (this.slides[i] as BufferSlide).unload();

        this.play_video();
    }

    override add_slide(slide: SlideJson): void {
        this.slides.push(new BufferSlide(slide));
    }
}
