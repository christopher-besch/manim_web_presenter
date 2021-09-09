import "./index.css";

let manim_web_controls: Window | null;

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

// open manim web controls window
function open_manim_web_controls(): boolean {
    // if the manim web controls window is not opened, then open a popup window
    if (manim_web_controls == null || manim_web_controls.closed) {
        manim_web_controls = window.open("/fallback.html", "Manim Web Controls", "resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no,status=no");
        return manim_web_controls != null;
    } else {
        manim_web_controls.focus();
        return true;
    }
}

document.body.onload = () => {
    get_json("index.json", (response, success) => {
        console.log(response);
    });
}
