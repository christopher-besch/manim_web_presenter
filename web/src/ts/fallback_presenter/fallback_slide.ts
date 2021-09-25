import { Slide } from "../presenter/slide";

export class FallbackSlide extends Slide {
    override get_src_url(): string {
        return this.video;
    }
}

