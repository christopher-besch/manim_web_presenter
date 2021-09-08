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

document.body.onload = () => {
    get_json("index.json", (response, success) => {
        console.log(response);
    })
}
