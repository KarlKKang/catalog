import type { WebpMachine } from 'webp-hero';
import {
    newXHR,
    removeRightClick,
} from './common';
import { appendChild } from './dom/element';
import { addEventListener, addEventListenerOnce, removeAllEventListeners } from './event_listener';
import { createCanvasElement } from './dom/create_element';
import { pgid } from './global';
import { setHeight, setWidth } from './style';
import { importModule } from './import_module';

let webpMachine: WebpMachine | null = null;
let webpMachineActive = false;
const enum WebpMachineQueueItemProp {
    CONTAINER,
    IMAGE,
    WEBP_DATA,
    ON_LOAD,
    ON_ERROR,
}
type webpMachineQueueItem = {
    [WebpMachineQueueItemProp.CONTAINER]: Element;
    [WebpMachineQueueItemProp.IMAGE]: HTMLImageElement;
    [WebpMachineQueueItemProp.WEBP_DATA]: Uint8Array;
    [WebpMachineQueueItemProp.ON_LOAD]: ((canvas: HTMLCanvasElement) => void) | undefined;
    [WebpMachineQueueItemProp.ON_ERROR]: () => void;
};
const webpMachineQueue: webpMachineQueueItem[] = [];
let webpSupported: boolean;

const eventTargetsTracker = new Set<EventTarget>();

export function imageLoader(container: Element, src: string, alt: string, withCredentials: boolean, onImageDraw?: (canvas: HTMLCanvasElement) => void, onDataLoad?: (data: Blob) => void, onNetworkError?: () => void, onUnrecoverableError?: () => void): XMLHttpRequest {
    let imageData: Blob;
    let isWebp: boolean;

    const image = new Image();
    image.alt = alt;

    function finalizeUnrecoverableError() {
        if (DEVELOPMENT) {
            console.error('Unrecoverable error occured when loading the image.');
        }
        const errorImage = new Image(); // Should not reuse the old Image instance since setting src to //:0 triggers onError event.
        errorImage.src = '//:0';
        errorImage.alt = alt;
        appendChild(container, errorImage);
        onUnrecoverableError && onUnrecoverableError();
    }

    function onImageError() {
        removeAllEventListeners(image);

        if (!isWebp) {
            finalizeUnrecoverableError();
            return;
        }

        // Convert Blob to Uint8Array
        const reader = new FileReader();
        addEventListenerOnce(reader, 'load', () => {
            const base64URL = reader.result;
            if (!(base64URL instanceof ArrayBuffer)) {
                finalizeUnrecoverableError();
                return;
            }

            const webpData = new Uint8Array(base64URL);
            webpMachineQueue.push({
                [WebpMachineQueueItemProp.CONTAINER]: container,
                [WebpMachineQueueItemProp.IMAGE]: image,
                [WebpMachineQueueItemProp.WEBP_DATA]: webpData,
                [WebpMachineQueueItemProp.ON_LOAD]: onImageDraw,
                [WebpMachineQueueItemProp.ON_ERROR]: finalizeUnrecoverableError,
            });
            if (webpMachineActive) {
                if (DEVELOPMENT) {
                    console.log('Webp Machine active. Pushed ' + image.alt + ' to queue.');
                }
            } else {
                webpMachineActive = true;
                startWebpMachine();
                if (DEVELOPMENT) {
                    console.log('Webp Machine NOT active. Pushed ' + image.alt + ' to queue. Webp Machine started.');
                }
            }
        });
        reader.readAsArrayBuffer(imageData);
    }

    function onImageLoad() {
        removeAllEventListeners(image);
        const canvas = createCanvasElement();
        const ctx = canvas.getContext('2d');
        if (ctx === null) {
            finalizeUnrecoverableError();
            return;
        }

        canvas.width = image.width;
        canvas.height = image.height;
        try {
            ctx.drawImage(image, 0, 0);
        } catch {
            finalizeUnrecoverableError();
            return;
        } finally {
            URL.revokeObjectURL(image.src);
        }

        imageProtection(canvas);
        appendChild(container, canvas);
        onImageDraw && onImageDraw(canvas);
    }

    addEventListener(image, 'error', onImageError);
    addEventListener(image, 'load', onImageLoad);

    const _onNetworkError = onNetworkError ?? finalizeUnrecoverableError;
    const xhr = newXHR(
        src,
        'GET',
        withCredentials,
        () => {
            if (xhr.status === 200) {
                isWebp = xhr.getResponseHeader('Content-Type') === 'image/webp';
                imageData = xhr.response as Blob;
                image.src = URL.createObjectURL(imageData);
                onDataLoad && onDataLoad(imageData);
            } else {
                _onNetworkError();
            }
        },
    );
    addEventListener(xhr, 'error', _onNetworkError);
    xhr.responseType = 'blob';
    xhr.send();
    return xhr;
}

async function startWebpMachine() {
    const currentPgid = pgid;
    if (webpMachine === null) {
        const { WebpMachine, detectWebpSupport } = await importModule(
            import(
                /* webpackExports: ["WebpMachine", "detectWebpSupport"] */
                'webp-hero'
            ),
        );
        webpMachine = new WebpMachine();
        webpSupported = await detectWebpSupport();
        if (currentPgid !== pgid) {
            return;
        }
    }

    let queueNext = webpMachineQueue.shift();
    while (queueNext !== undefined) {
        if (webpSupported) {
            queueNext[WebpMachineQueueItemProp.ON_ERROR]();
        } else {
            await drawWebp(webpMachine, queueNext);
            if (currentPgid !== pgid) {
                return;
            }
        }
        queueNext = webpMachineQueue.shift();
    }
    webpMachineActive = false;
}

async function drawWebp(webpMachine: WebpMachine, queueItem: webpMachineQueueItem) {
    const currentPgid = pgid;
    const canvas = createCanvasElement();
    try {
        await webpMachine.decodeToCanvas(canvas, queueItem[WebpMachineQueueItemProp.WEBP_DATA]);
    } catch {
        if (currentPgid !== pgid) {
            return;
        }
        if (DEVELOPMENT) {
            console.warn('Failed to polyfill webp. Appended back to the queue to retry.');
        }
        webpMachineQueue.push(queueItem);
        webpMachine.clearCache();
        return;
    }
    if (currentPgid !== pgid) {
        return;
    }
    webpMachine.clearCache();
    setWidth(canvas, null); // webp-hero will add incorrect width and height properties
    setHeight(canvas, null);
    imageProtection(canvas);
    appendChild(queueItem[WebpMachineQueueItemProp.CONTAINER], canvas);
    const onLoad = queueItem[WebpMachineQueueItemProp.ON_LOAD];
    onLoad && onLoad(canvas);
}

function imageProtection(elem: HTMLElement) {
    eventTargetsTracker.add(elem);
    removeRightClick(elem);
    addEventListener(elem, 'dragstart', (e) => {
        e.preventDefault();
    });
}

export function offload() {
    webpMachineQueue.length = 0;
    webpMachineActive = false;
    webpMachine?.clearCache();
    for (const eventTarget of eventTargetsTracker) {
        removeAllEventListeners(eventTarget);
    }
    eventTargetsTracker.clear();
}
