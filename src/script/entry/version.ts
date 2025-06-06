export let clientVersionOutdated = false;
const checkInterval = 30 * 60 * 1000;
let currentTimeout: ReturnType<typeof setTimeout> | null = null;

export function checkClientVersion() {
    clearSchedule();
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/version', true);
    xhr.addEventListener('load', () => {
        clientVersionOutdated = xhr.responseText !== ENV_CLIENT_VERSION;
        scheduleVersionCheck();
    });
    xhr.addEventListener('error', () => {
        clientVersionOutdated = true;
        scheduleVersionCheck();
    });
    xhr.addEventListener('timeout', () => {
        scheduleVersionCheck();
    });
    xhr.timeout = 60 * 1000;
    xhr.send();
}

function scheduleVersionCheck() {
    const newTimeout = setTimeout(() => {
        if (newTimeout === currentTimeout) {
            checkClientVersion();
        }
    }, checkInterval);
    currentTimeout = newTimeout;
}

function clearSchedule() {
    if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
    }
}
