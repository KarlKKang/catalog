import { addEventListenerNative } from '../module/event_listener/add/native';
import { max } from '../module/math';
import { addTimeout } from '../module/timer/add/timeout';
import { newXhr } from '../module/xhr/new';

export let clientVersionOutdated = false;
const checkInterval = 20 * 60 * 1000;

export function checkClientVersion() {
    const xhr = newXhr(
        '/version',
        'GET',
        false,
        () => {
            clientVersionOutdated = xhr.status !== 200 || semverGreater(xhr.responseText, ENV_CLIENT_VERSION);
        },
        () => {
            if (!clientVersionOutdated) {
                addTimeout(checkClientVersion, checkInterval);
            }
        },
    );
    addEventListenerNative(xhr, 'error', () => {
        clientVersionOutdated = true;
    });
    xhr.timeout = 60 * 1000;
    xhr.send();
}

function semverGreater(ver: string, refver: string): boolean {
    if (ver === refver) return false;
    const verParts = ver.split('.');
    const refverParts = refver.split('.');
    for (let i = 0; i < max(verParts.length, refverParts.length); i++) {
        const verPart = parseInt(verParts[i] ?? '0', 10);
        const refverPart = parseInt(refverParts[i] ?? '0', 10);
        if (verPart < refverPart) return false;
        if (verPart !== refverPart) return true;
    }
    return false;
}
