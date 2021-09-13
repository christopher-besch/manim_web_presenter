import "./index.css";

type SlideJson = {
    name: string;
    slide_type: string;
    first_animation: number;
    after_last_animation: number;
};

type PresentationJson = {
    animations: string[];
    slides: SlideJson[];
};

enum SlideType {
    NORMAL,
    LOOP,
    COMPLETE_LOOP
}

function get_slide_type_from_string(str: string): SlideType {
    switch (str) {
        case "normal": return SlideType.NORMAL;
        case "loop": return SlideType.LOOP;
        case "complete_loop": return SlideType.COMPLETE_LOOP;
        default: return SlideType.NORMAL;
    }
}

class AnimationInfo {
    slide: SlideInfo;
    url: string;
    media_buffer: BufferSource | null = null;
    loaded: boolean = false;

    constructor(url: string, slide: SlideInfo) {
        this.slide = slide;
        this.url = url;
    }

    // load animation video using ajax
    load_animation(on_loaded: (self: AnimationInfo) => void, on_failed: (self: AnimationInfo) => void): void {
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

class SlideInfo {
    presentation: Presentation;
    name: string;
    type: SlideType;
    animations: AnimationInfo[] = [];
    // all animations of slide get concatenated -> only one MediaSource required
    media_source: MediaSource = new MediaSource();

    constructor(slide: SlideJson, animations: string[], presentation: Presentation) {
        this.presentation = presentation;
        this.name = slide.name;
        this.type = get_slide_type_from_string(slide.slide_type);

        for (let i = slide.first_animation; i < slide.after_last_animation; ++i)
            this.animations.push(new AnimationInfo(animations[i], this));

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
            console.log("Failed to append buffer to source buffer:");
            console.log(ev.target);
        };
        source_buffer.onabort = (ev: Event) => {
            console.log("Aborted source buffer:");
            console.log(ev.target);
        };

        // initially load first animation to kick start loading process
        this.append_animation_to_source_buffer(source_buffer, this.animations[0]);
    }

    append_animation_to_source_buffer(source_buffer: SourceBuffer, animation: AnimationInfo): void {
        animation.load_animation((self: AnimationInfo) => {
            // success
            if (self.media_buffer == null)
                source_buffer.abort();
            else
                source_buffer.appendBuffer(self.media_buffer);
        }, (self: AnimationInfo) => {
            // failure
            source_buffer.abort();
            console.error(`Failed to load animation "${self.url}"`);
        });
    }

    get_animation(animation: number): AnimationInfo | null {
        if (animation >= 0 && animation < this.animations.length)
            return this.animations[animation];
        return null;
    }

    load_animations(): void {
        for (let i = 0; i < this.animations.length; ++i) {
            this.animations[i].load_animation(
                (self: AnimationInfo) => { },
                (self: AnimationInfo) => {
                    console.error(`Failed to load animation "${self.url}"`);
                });
        }
    }

    unload_animations(): void {
        for (let i = 0; i < this.animations.length; ++i)
            this.animations[i].unload_animation();
    }
}

class Presentation {
    video_element: HTMLVideoElement | null = null;
    slides: SlideInfo[] = [];
    current_slide = -1;
    next_slide = 0;
    previous_slide = -1;
    loaded = false;
    slides_to_auto_load = 5;
    slides_to_keep = 2;

    update_video(): void {
        // load next slides based on this.slides_to_auto_load
        for (let i = 0, len = Math.min(this.slides_to_auto_load, this.slides.length - this.current_slide); i < len; ++i)
            this.slides[this.current_slide + i].load_animations();
        // unload previous slides based on this.slides_to_keep
        for (let i = 0, len = this.current_slide - this.slides_to_keep; i < len; ++i)
            this.slides[i].unload_animations();

        if (this.current_slide < 0 || this.current_slide >= this.slides.length) {
            // if current slide is non existant, set video element to empty video
            if (this.video_element != null) {
                if (this.video_element.src.length != 0)
                    URL.revokeObjectURL(this.video_element.src);
                this.video_element.src = "";
                this.video_element.currentTime = 0;
                let promise = this.video_element.play();
                if (promise !== undefined)
                    promise.then(() => { }, () => { });
            }
        } else if (this.current_slide != this.previous_slide) {
            // if current slide is different from previous slide, change video source to new slide
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
                if (promise !== undefined)
                    promise.then(() => { }, () => { });
            }
        } else if (this.video_element != null) {
            // if current slide didn't change, restart video
            this.video_element.currentTime = 0;
            let promise = this.video_element.play();
            if (promise !== undefined)
                promise.then(() => { }, () => { });
        }
    }

    set_video_element(video_element: HTMLVideoElement): void {
        this.video_element = video_element;

        // attach an event to when the video has ended and update the video accordingly
        this.video_element.onended = (ev: Event) => {
            let cur_slide = this.slides[this.current_slide];
            switch (cur_slide.type) {
                case SlideType.LOOP: // when the current slide is a loop type we just restart from the beginning
                    this.update_video();
                    break;
                case SlideType.COMPLETE_LOOP: // when the current slide is a complete loop type and the next slide has changed, we go to that one from here
                    this.current_slide = this.next_slide;
                    this.update_video();
                    break;
            }
        };
    }

    load_slides(on_loaded: (self: Presentation) => void, on_failed: (self: Presentation) => void): void {
        get_json("index.json", (response, success) => {
            if (!success) {
                console.error(response);
                on_failed(this);
                return;
            }

            // construct slide infos from the json response
            let presentation = response as PresentationJson;
            let animations = presentation.animations;
            let slides = presentation.slides;
            for (let i = 0; i < slides.length; ++i)
                this.slides.push(new SlideInfo(slides[i], animations, this));

            // once loading and constructing the infos is done inform others that it's done
            this.loaded = true;
            on_loaded(this);
        });
    }

    play_slide(slide: number): void {
        slide = Math.max(Math.min(slide, this.slides.length), 0);

        if (this.current_slide >= 0 && this.slides[this.current_slide].type == SlideType.COMPLETE_LOOP) {
            // if the current slide is a complete loop type, we want to wait until the slide finishes playing
            this.next_slide = slide;
        } else { // else we will just switch the video instantly
            this.next_slide = this.current_slide = slide;
            this.update_video();
        }
    }

    play_next_slide(): void {
        this.play_slide(this.current_slide + 1);
    }

    play_previous_slide(): void {
        this.play_slide(this.current_slide - 1);
    }
}

let slides: Presentation = new Presentation();

let popup_video_viewer: Window | null;

// download file and parse json
function get_json(url: string, callback: { (response: any, success: boolean): void; }): void {
    let request = new XMLHttpRequest();
    // set callback
    request.onreadystatechange = () => {
        // when a response has been received
        if (request.readyState == 4) {
            try {
                // 200 is success
                callback(JSON.parse(request.responseText), request.status == 200);
            } catch (error) {
                callback(error, false);
            }
        }
    };
    request.open("GET", url, true);
    request.send();
}

// open popup video viewer window
function open_popup_video_viewer(): boolean {
    // if the popup video viewer window is not opened, then open a new popup window
    if (popup_video_viewer == null || popup_video_viewer.closed) {
        popup_video_viewer = window.open("/video_viewer.html", "Manim Video Viewer", "resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no,status=no");
        return popup_video_viewer != null;
    } else {
        popup_video_viewer.focus();
        return true;
    }
}

document.body.onload = () => {
    slides.load_slides((self: Presentation) => {
        let videoElement = document.querySelector("div.main div.playback video");
        if (videoElement != null)
            self.set_video_element(videoElement as HTMLVideoElement);
        self.play_slide(0);
    }, (self: Presentation) => {
        console.error("Slides could not be loaded");
    });
}
