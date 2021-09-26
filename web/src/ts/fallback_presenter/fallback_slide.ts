import { Slide } from "../presenter/slide";

export class FallbackSlide extends Slide {
    public override get_src_url(): string {
        return this.video;
    }
}

