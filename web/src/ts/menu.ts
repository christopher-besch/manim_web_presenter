import { get_json } from "./utils";

document.body.onload = () => {
    get_json("./presentation_index.json", (response, success) => {
        if (!success)
            console.error("Failed to download 'presentation_index.json'");
        let presentations = response as string[];
        for (let presentation of presentations) {
            let anchor = document.body.appendChild(
                document.createElement("h2")).appendChild(
                    document.createElement("a"));
            anchor.href = presentation;
            anchor.innerText = presentation;
        }
    });
}
