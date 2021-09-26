export class ProgressBar {
    progress_el: HTMLDivElement;
    bar_el: HTMLDivElement;
    max: number;

    constructor(progress_el: HTMLDivElement, bar_el: HTMLDivElement, max: number = -1) {
        this.progress_el = progress_el;
        this.bar_el = bar_el;
        this.max = max;
    }

    set_max(max: number) {
        if (max <= 0)
            throw "ProgressBar max can't be smaller/equals 0";
        this.max = max;
    }

    show(): void {
        this.progress_el.style.visibility = "visible";
    }

    hide(): void {
        this.progress_el.style.visibility = "hidden";
    }

    update(value: number): void {
        // must be in [0, this.max]
        if (value < 0 || value > this.max) {
            console.error(`ProgressBar with max ${this.max} can't update to value ${value}`);
            return;
        }
        this.bar_el.style.width = `${value / this.max * 100}%`;
        if (value == this.max)
            // todo: fade out would be nice
            setTimeout(this.hide.bind(this), 500);
    }
}
