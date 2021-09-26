// download file and parse json
export function get_json(url: string, callback: { (response: any): void; }): void {
    let request = new XMLHttpRequest();
    request.onload = () => {
        callback(JSON.parse(request.responseText));
    };
    request.onerror = () => {
        console.error(`Failed to load json '${url}'`);
    };
    request.open("GET", url, true);
    request.send();
}
