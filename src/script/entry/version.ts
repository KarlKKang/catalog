import { addEventListenerNative } from '../module/event_listener/add/native';
import { max } from '../module/math';
import { addTimeoutNative } from '../module/timer/add/native/timeout';
import { removeTimeoutNative } from '../module/timer/remove/native/timeout';

export let clientVersionOutdated = false;
const checkInterval = 30 * 60 * 1000;
let currentTimeout: ReturnType<typeof addTimeoutNative> | null = null;
let currentXhr: XMLHttpRequest | null = null;

export function checkClientVersion() {
    clearSchedule();
    sendVersionCheckRequest();
}

function sendVersionCheckRequest() {
    if (currentXhr !== null) {
        return;
    }
    const xhr = new XMLHttpRequest();
    currentXhr = xhr;
    xhr.open('GET', '/version', true);
    addEventListenerNative(xhr, 'load', () => {
        clientVersionOutdated = xhr.status !== 200 || semverGreater(xhr.responseText, ENV_CLIENT_VERSION);
    });
    addEventListenerNative(xhr, 'error', () => {
        clientVersionOutdated = true;
    });
    addEventListenerNative(xhr, 'loadend', () => {
        currentXhr = null;
        if (!clientVersionOutdated) {
            scheduleVersionCheck();
        }
    });
    xhr.timeout = 60 * 1000;
    xhr.send();
}

function scheduleVersionCheck() {
    clearSchedule();
    const newTimeout = addTimeoutNative(() => {
        if (newTimeout === currentTimeout) {
            currentTimeout = null;
            sendVersionCheckRequest();
        }
    }, checkInterval);
    currentTimeout = newTimeout;
}

function clearSchedule() {
    if (currentTimeout !== null) {
        removeTimeoutNative(currentTimeout);
        currentTimeout = null;
    }
}

function semverGreater(ver: string, refver: string): boolean {
    if (ver === refver) return false;
    const verParts = ver.split('.');
    const refverParts = refver.split('.');
    for (let i = 0; i < max(verParts.length, refverParts.length); i++) {
        const verPart = parseInt(verParts[i] ?? '0', 10);
        const refverPart = parseInt(refverParts[i] ?? '0', 10);
        if (verPart > refverPart) return true;
        if (verPart < refverPart) return false;
    }
    return false;
}
