export function setHistoryState(url: string, withoutHistory?: boolean) {
    if (withoutHistory === true) {
        history.replaceState(null, '', url);
    } else {
        history.pushState(null, '', url);
    }
}
