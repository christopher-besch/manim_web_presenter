import "../index.css";
import { SlideJson, Presentation, Slide } from "./presenter";

class FallbackSlide extends Slide {
    override get_src_url(): string {
        return this.video;
    }
}

export class FallbackPresentation extends Presentation {
    override add_slide(slide: SlideJson): void {
        this.slides.push(new FallbackSlide(slide));
    }
}
