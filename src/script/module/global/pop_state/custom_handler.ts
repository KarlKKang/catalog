import { addOffloadCallback } from '../offload';

let customPopStateHandler: (() => boolean) | null = null;

export { customPopStateHandler };

export function setCustomPopStateHandler(handler: () => boolean) {
    addOffloadCallback(offload);
    customPopStateHandler = handler;
}

function offload() {
    customPopStateHandler = null;
}
