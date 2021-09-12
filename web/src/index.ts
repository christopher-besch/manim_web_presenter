import "./index.css";

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
    media_buffer: BufferSource | null;
    media_buffer_loaded: boolean;

    constructor(url: string, slide: SlideInfo) {
        this.slide = slide;
        this.url = url;
        this.media_buffer = null;
        this.media_buffer_loaded = false;
    }

    load_animation(on_loaded: (self: AnimationInfo) => void, on_failed: (self: AnimationInfo) => void): void {
        if (this.media_buffer_loaded) {
            on_loaded(this);
            return;
        }

        let request = new XMLHttpRequest();
        request.responseType = "arraybuffer";
        request.onload = () => {
            this.media_buffer = request.response;
            this.media_buffer_loaded = true;
            on_loaded(this);
        };
        request.onerror = () => {
            on_failed(this);
        };
        request.open("GET", this.url, true);
        // Send a GET request for an array buffer response.
        request.send();
    }

    unload_animation(): void {
        this.media_buffer = null;
        this.media_buffer_loaded = false;
    }
}

class SlideInfo {
    slides: Slides;
    name: string;
    type: SlideType;
    animations: AnimationInfo[];
    media_source: MediaSource;

    constructor(json_object: any, animations_array: any, slides: Slides) {
        this.slides = slides;
        this.name = json_object.name;
        this.type = get_slide_type_from_string(json_object.slide_type);
        this.animations = [];
        this.media_source = new MediaSource();

        for (let i: number = json_object.first_animation; i < json_object.after_last_animation; ++i)
            this.animations.push(new AnimationInfo(animations_array[i], this));

        this.media_source.onsourceopen = (_) => {
            // Check if the MIME codec is supported.
            let mime_codec = "video/mp4; codecs=\"avc1.64002A\"";
            if (!("MediaSource" in window) || !MediaSource.isTypeSupported(mime_codec)) {
                console.error("MediaSource or mime codec not supported");
                this.media_source.endOfStream();
                return;
            }

            let source_buffers: SourceBuffer[] = [];
            let loaded_source_buffers: number = 0;

            // Add a source buffer to the media source for every animation of this slide.
            for (let i: number = 0, len: number = this.animations.length; i < len; ++i) {
                let source_buffer = this.media_source.addSourceBuffer(mime_codec);
                source_buffer.onupdate = (_) => {
                    if (++loaded_source_buffers == source_buffers.length)
                        this.media_source.endOfStream();
                };
                source_buffer.onerror = (ev: Event) => {
                    console.log("Failed to append buffer to source buffer:");
                    console.log(ev.target);
                };
                source_buffer.onabort = (ev: Event) => {
                    console.log("Aborted source buffer:");
                    console.log(ev.target);
                };
                source_buffers.push(source_buffer);
            }

            // Load every animation and append the media buffer of the animation to the respective source buffer.
            for (let i: number = 0, len: number = this.animations.length; i < len; ++i) {
                this.animations[i].load_animation((self: AnimationInfo) => {
                    if (self.media_buffer == null) {
                        source_buffers[i].abort();
                    } else {
                        source_buffers[i].appendBuffer(self.media_buffer);
                    }
                }, (self: AnimationInfo) => {
                    source_buffers[i].abort();
                    console.error("Failed to load animation \"" + self.url + "\"");
                });
            }
        };
    }

    get_animation(animation: number): AnimationInfo | null {
        if (animation >= 0 && animation < this.animations.length)
            return this.animations[animation];
        return null;
    }

    load_animations(): void {
        for (let i: number = 0, len: number = this.animations.length; i < len; ++i)
            this.animations[i].load_animation(() => { }, () => { console.error("Failed to load animation \"" + this.animations[i].url + "\""); });
    }

    unload_animations(): void {
        for (let i: number = 0, len: number = this.animations.length; i < len; ++i)
            this.animations[i].unload_animation();
    }
}

class Slides {
    video_element: HTMLVideoElement | null;
    slides: SlideInfo[];
    current_slide: number;
    next_slide: number;
    previous_slide: number;
    loaded: boolean;

    constructor() {
        this.video_element = null;
        this.slides = [];
        this.current_slide = -1;
        this.next_slide = 0;
        this.previous_slide = 0;
        this.loaded = false;
    }

    update_video(): void {
        // Load the next 5 slides.
        for (let i: number = 0, len: number = Math.min(5, this.slides.length - this.current_slide); i < len; ++i)
            this.slides[this.current_slide + i].load_animations();
        // Unload the previous slides until there are 2 behind in case the user wants to go back to a previous slide without waiting.
        for (let i: number = 0, len: number = this.current_slide - 2; i < len; ++i)
            this.slides[i].unload_animations();

        if (this.current_slide < 0 || this.current_slide >= this.slides.length) {
            // If the current slide is non existant just set the video element to an empty video.
            if (this.video_element != null) {
                if (this.video_element.src.length != 0)
                    URL.revokeObjectURL(this.video_element.src);
                this.video_element.src = "";
                this.video_element.currentTime = 0;
                this.video_element.play();
            }
        } else if (this.current_slide != this.previous_slide) {
            // If the current slide is different from the previous slide we have to change the video source to the new slide.
            this.previous_slide = this.current_slide;
            let slide = this.slides[this.current_slide];
            if (this.video_element != null) {
                // Revoke the Object URL of the video element if it exists.
                // This has to be done because the pointer thingy isn't deleted automatically.
                if (this.video_element.src.length != 0)
                    URL.revokeObjectURL(this.video_element.src);
                // Create a new Object URL of the slides media source.
                this.video_element.src = URL.createObjectURL(slide.media_source);
                this.video_element.currentTime = 0;
                let promise = this.video_element.play();
                if (promise !== undefined) {
                    // If the video couldn't play just log the error message for debugging purposes.
                    promise.catch((error) => {
                        console.error(error);
                    });
                }
            }
        } else if (this.video_element != null) {
            // If the current slide didn't change we only want to restart the video from the start.
            this.video_element.currentTime = 0;
            let promise = this.video_element.play();
            if (promise !== undefined) {
                promise.catch((error) => {
                    console.error(error);
                });
            }
        }
    }

    set_video_element(video_element: HTMLVideoElement): void {
        this.video_element = video_element;

        // Attach an event to when the video has ended and update the video accordingly.
        this.video_element.onended = (ev: Event) => {
            let cur_slide = this.slides[this.current_slide];
            switch (cur_slide.type) {
                case SlideType.LOOP: // When the current slide is a loop type we just restart from the beginning.
                    this.update_video();
                    break;
                case SlideType.COMPLETE_LOOP: // When the current slide is a complete loop type and the next slide has changed, we go to that one from here.
                    if (this.next_slide != this.current_slide) {
                        this.current_slide = this.next_slide;
                    }
                    this.update_video();
                    break;
            }
        };
    }

    load_slides(on_loaded: (self: Slides) => void, on_failed: (self: Slides) => void): void {
        get_json("index.json", (response, success) => {
            if (!success) {
                console.error(response);
                on_failed(this);
                return;
            }

            // Construct slide infos from the json response
            let animations_array = response.animations;
            let slides_array = response.slides;
            for (let i: number = 0, len: number = slides_array.length; i < len; ++i)
                this.slides.push(new SlideInfo(slides_array[i], animations_array, this));

            // Once loading and constructing the infos is done inform others that it's done
            this.loaded = true;
            on_loaded(this);
        });
    }

    play_slide(slide: number): void {
        if (this.current_slide >= 0) {
            let cur_slide = this.slides[this.current_slide];
            // If the current slide is a complete loop type, we want to wait until the slide finishes playing.
            if (cur_slide.type == SlideType.COMPLETE_LOOP) {
                this.next_slide = slide;
            } else { // Else we will just switch the video instantly.
                this.next_slide = this.current_slide = slide;
                this.update_video();
            }
        } else { // Else we will just switch the video instantly.
            this.next_slide = this.current_slide = slide;
            this.update_video();
        }
    }
}

let slides: Slides = new Slides();

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
    slides.load_slides((self: Slides) => {
        let videoElement = document.querySelector("div.main div.playback video");
        if (videoElement != null)
            self.set_video_element(videoElement as HTMLVideoElement);
        self.play_slide(0);
    }, (self: Slides) => {
        console.error("Slides could not be loaded");
    });
}
