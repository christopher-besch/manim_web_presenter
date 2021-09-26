import { get_json } from "./utils";

function load_presentation_links() {
    get_json("./presentation_index.json", (presentations: string[]) => {
        for (let presentation of presentations) {
            let anchor = document.body.appendChild(
                document.createElement("h2")).appendChild(
                    document.createElement("a"));
            anchor.href = presentation;
            anchor.innerText = presentation;
        }
    });
}

document.body.onload = () => {
    load_presentation_links();
}
