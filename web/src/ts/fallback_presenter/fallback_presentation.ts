import { Presentation } from "../presenter/presentation";
import { SlideJson } from "../presenter/slide";
import { FallbackSlide } from "./fallback_slide";

// no buffering, only change src of video
export class FallbackPresentation extends Presentation {
    public override add_slide(slide: SlideJson): void {
        this.slides.push(new FallbackSlide(slide));
    }
}
