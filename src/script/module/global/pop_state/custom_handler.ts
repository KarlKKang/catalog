import { addOffloadCallback } from '../offload';

let customPopStateHandler: (() => void) | null = null;

export { customPopStateHandler };

export function setCustomPopStateHandler(handler: () => void) {
    addOffloadCallback(offload);
    customPopStateHandler = handler;
}

function offload() {
    customPopStateHandler = null;
}
