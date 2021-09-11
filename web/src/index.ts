import "./index.css";

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
    get_json("index.json", (response, success) => {
        console.log(response);
    });
}
