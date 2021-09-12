import "./index.css";

class MultiDelegate<T, A extends any[]> {
  delegates: ((this: T, ...args: A) => void)[];

  constructor() { this.delegates = []; }

  add_delegate(delegate: ((this: T, ...args: A) => void)): void {
    this.delegates.push(delegate);
  }

  invoke(thisArg: T, ...args: A): void {
    for (let i: number = 0, len: number = this.delegates.length; i < len; ++i)
      this.delegates[i].call(thisArg, ...args);
  }
}

enum SlideType {
  NORMAL,
  LOOP,
  COMPLETE_LOOP
}

function get_slide_type_from_string(str: string): SlideType {
  switch (str) {
  case "normal":
    return SlideType.NORMAL;
  case "loop":
    return SlideType.LOOP;
  case "complete_loop":
    return SlideType.COMPLETE_LOOP;
  default:
    return SlideType.NORMAL;
  }
}

class AnimationInfo {
  slide: SlideInfo;
  url: string;
  media_buffer: BufferSource|null;
  media_buffer_loaded: boolean;

  constructor(url: string, slide: SlideInfo) {
    this.slide = slide;
    this.url = url;
    this.media_buffer = null;
    this.media_buffer_loaded = false;
  }

  load_animation(on_loaded: (self: AnimationInfo) => void,
                 on_failed: (self: AnimationInfo) => void): void {
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
    request.onerror = () => { on_failed(this); };
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

    for (let i: number = json_object.first_animation;
         i < json_object.after_last_animation; ++i)
      this.animations.push(new AnimationInfo(animations_array[i], this));

    this.media_source.onsourceended = (ev) => {
      console.log("MediaSource ended");
      console.log(ev);
    };

    this.media_source.onsourceopen = (_) => {
      let mime_codec = "video/mp4; codecs=\"avc1.64002A\"";
      if (!("MediaSource" in window) ||
          !MediaSource.isTypeSupported(mime_codec)) {
        console.error("MediaSource or mime codec not supported");
        this.media_source.endOfStream();
        return;
      }

      let source_buffers: SourceBuffer[] = [];
      let loaded_source_buffers: number = 0;

      console.log(this.media_source);

      for (let i: number = 0, len: number = this.animations.length; i < len;
           ++i) {
        source_buffers.push(this.media_source.addSourceBuffer(mime_codec));
        source_buffers[i].onupdateend = (_) => {
          console.log(this.media_source);
          console.log(loaded_source_buffers);
           if (++loaded_source_buffers == source_buffers.length)
            this.media_source.endOfStream();
          console.log(loaded_source_buffers);
        };
      }

      console.log(source_buffers);
      console.log(this.media_source);

      for (let i: number = 0, len: number = this.animations.length; i < len;
           ++i) {
        this.animations[i].load_animation(
            (self: AnimationInfo) => {
              if (self.media_buffer == null) {
                console.log("Aborted media source");
                source_buffers[i].abort();
              } else {
                console.log("Appended media buffer");
                source_buffers[i].appendBuffer(self.media_buffer);
              }
            },
            (self: AnimationInfo) => {
              source_buffers[i].abort();
              console.error("Failed to load animation \"" + self.url + "\"");
            });
      }
    };
  }

  get_animation(animation: number): AnimationInfo|null {
    if (animation >= 0 && animation < this.animations.length)
      return this.animations[animation];
    return null;
  }

  load_animations(): void {
    for (let i: number = 0, len: number = this.animations.length; i < len; ++i)
      this.animations[i].load_animation(() => {}, () => {
        console.error("Failed to load animation \"" + this.animations[i].url +
                      "\"");
      });
  }

  unload_animations(): void {
    for (let i: number = 0, len: number = this.animations.length; i < len; ++i)
      this.animations[i].unload_animation();
  }
}

class Slides {
  video_element: HTMLVideoElement|null;
  slides: SlideInfo[];
  current_slide: number;
  next_slide: number;
  loaded: boolean;
  on_load_info: MultiDelegate<Slides, []>;
  on_animation_done: MultiDelegate<Slides, []>;
  on_slide_done: MultiDelegate<Slides, []>;

  constructor() {
    this.video_element = null;
    this.slides = [];
    this.current_slide = -1;
    this.next_slide = 0;
    this.loaded = false;
    this.on_load_info = new MultiDelegate<Slides, []>();
    this.on_animation_done = new MultiDelegate<Slides, []>();
    this.on_slide_done = new MultiDelegate<Slides, []>();
  }

  update_video(): void {
    // Load the next 5 slides.
    for (let i: number = 0, len: number = Math.min(5, this.slides.length -
                                                          this.current_slide);
         i < len; ++i)
      this.slides[this.current_slide + i].load_animations();
    // Unload the previous slides until there are 2 behind in case the user
    // wants to go back to a previous slide without waiting.
    for (let i: number = 0, len: number = this.current_slide - 2; i < len; ++i)
      this.slides[i].unload_animations();

    let slide = this.slides[this.current_slide];
    if (this.video_element != null) {
      if (this.video_element.src.length != 0)
        URL.revokeObjectURL(this.video_element.src);
      this.video_element.src = URL.createObjectURL(slide.media_source);
      this.video_element.currentTime = 0;
      let promise = this.video_element.play();
      if (promise !== undefined) {
        promise.then(
            () => { console.log("Playing slide \"" + slide.name + "\""); },
            (error) => { console.error(error); });
      }
    }
    /*let animation = slide.get_animation(this.current_animation);
    if (animation != null) {
        // Wait until the animation has been loaded and set it as the video to
    play. animation.load_animation((self: AnimationInfo) => { if
    (this.video_element != null) { if (this.video_element.src.length != 0)
                    URL.revokeObjectURL(this.video_element.src);
                this.video_element.src = URL.createObjectURL(self.media_source);
                this.video_element.currentTime = 0;
                let promise = this.video_element.play();
                if (promise !== undefined) {
                    promise.then(() => {
                        if (animation != null)
                            console.log("Playing animation \"" + animation.url +
    "\"");
                    }, (error) => {
                        console.error(error);
                    });
                }
            }
        }, (self: AnimationInfo) => {
            console.error("Animation \"" + self.url + "\" could not be loaded");
        });
    }*/
  }

  set_video_element(video_element: HTMLVideoElement): void {
    this.video_element = video_element;

    /*this.video_element.onended = (ev: Event) => {
        let cur_slide = this.slides[this.current_slide];
        if (this.current_animation == cur_slide.animations.length - 1) {
            switch (cur_slide.type) {
                case SlideType.LOOP: // When the current slide is a loop type we
    just restart from the beginning. this.update_video(); break; case
    SlideType.COMPLETE_LOOP: // When the current slide is a complete loop type
    and the next slide has changed, we go to that one from here. if
    (this.next_slide != this.current_slide) { this.current_slide =
    this.next_slide; this.current_animation = 0;
                    }
                    this.update_video();
                    break;
            }

            this.on_slide_done.invoke(this);
        } else {
            // Increment animation and play that animation.
            ++this.current_animation;
            this.update_video();
            this.on_animation_done.invoke(this);
        }
    };*/
  }

  load_slides(on_loaded: (self: Slides) => void,
              on_failed: (self: Slides) => void): void {
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
        this.slides.push(
            new SlideInfo(slides_array[i], animations_array, this));

      // Once loading and constructing the infos is done inform others that it's
      // done
      this.loaded = true;
      this.on_load_info.invoke(this);
      on_loaded(this);
    });
  }

  play_slide(slide: number): void {
    if (this.current_slide >= 0) {
      let cur_slide = this.slides[this.current_slide];
      // If the current slide is a complete loop type, we want to wait until the
      // slide finishes playing.
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

let popup_video_viewer: Window|null;

// download file and parse json
function get_json(url: string,
                  callback: {(response: any, success: boolean): void;}): void {
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
  // if the popup video viewer window is not opened, then open a new popup
  // window
  if (popup_video_viewer == null || popup_video_viewer.closed) {
    popup_video_viewer = window.open(
        "/video_viewer.html", "Manim Video Viewer",
        "resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no,status=no");
    return popup_video_viewer != null;
  } else {
    popup_video_viewer.focus();
    return true;
  }
}

document.body.onload = () => {
  slides.load_slides(
      (self: Slides) => {
        let videoElement =
            document.querySelector("div.main div.playback video");
        if (videoElement != null)
          self.set_video_element(videoElement as HTMLVideoElement);
        self.play_slide(0);
      },
      (self: Slides) => { console.error("Slides could not be loaded"); });
}
