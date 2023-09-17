import type { WebpMachine } from 'webp-hero/dist-cjs';
import {
    removeRightClick,
} from './main';
import {
    appendChild,
    addEventListener,
    addEventListenerOnce,
    createCanvasElement,
    removeAllEventListeners,
} from './dom';
import { show as showMessage } from './message';
import { moduleImportError } from './message/template/param';

let webpMachine: WebpMachine | null = null;
let webpMachineActive = false;
type webpMachineQueueItem = { container: Element; image: HTMLImageElement; webpData: Uint8Array; onLoad: (() => void) | undefined; onError: () => void };
const webpMachineQueue: webpMachineQueueItem[] = [];
let webpSupported: boolean;

const eventTargetsTracker = new Set<EventTarget>();

export default function (container: Element, src: string, alt: string, withCredentials: boolean, onImageDraw?: () => void, onDataLoad?: (data: Blob) => void, onError?: () => void): XMLHttpRequest {
    let imageData: Blob;
    let isWebp: boolean;

    const image = new Image();
    image.alt = alt;

    function finalizeErrorImage() {
        if (DEVELOPMENT) {
            console.log('Unrecoverable error occured when loading the image.');
        }
        const errorImage = new Image(); // Should not reuse the old Image instance since setting src to //:0 triggers onError event.
        errorImage.src = '//:0';
        errorImage.alt = alt;
        appendChild(container, errorImage);
        onError && onError();
    }

    function onImageError() {
        removeAllEventListeners(image);

        if (!isWebp) {
            finalizeErrorImage();
            return;
        }

        // Convert Blob to Uint8Array
        const reader = new FileReader();
        addEventListenerOnce(reader, 'load', () => {
            const base64URL = reader.result;
            if (!(base64URL instanceof ArrayBuffer)) {
                finalizeErrorImage();
                return;
            }

            const webpData = new Uint8Array(base64URL);
            webpMachineQueue.push({ container: container, image: image, webpData: webpData, onLoad: onImageDraw, onError: finalizeErrorImage });
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
            finalizeErrorImage();
            return;
        }

        canvas.width = image.width;
        canvas.height = image.height;
        try {
            ctx.drawImage(image, 0, 0);
        } catch (_) {
            finalizeErrorImage();
            return;
        } finally {
            URL.revokeObjectURL(image.src);
        }

        imageProtection(canvas);
        appendChild(container, canvas);
        onImageDraw && onImageDraw();
    }

    addEventListener(image, 'error', onImageError);
    addEventListener(image, 'load', onImageLoad);


    const xhr = new XMLHttpRequest();
    xhr.open('GET', src);
    xhr.responseType = 'blob';
    xhr.withCredentials = withCredentials;

    addEventListener(xhr, 'error', () => {
        removeAllEventListeners(xhr);
        finalizeErrorImage();
    });
    addEventListener(xhr, 'abort', () => {
        removeAllEventListeners(xhr);
    });
    addEventListener(xhr, 'load', () => {
        removeAllEventListeners(xhr);
        if (xhr.status === 200) {
            isWebp = xhr.getResponseHeader('Content-Type') === 'image/webp';
            imageData = xhr.response as Blob;
            image.src = URL.createObjectURL(imageData);
            onDataLoad && onDataLoad(imageData);
        } else {
            finalizeErrorImage();
        }
    });

    xhr.send();
    return xhr;
}

async function startWebpMachine() {
    if (webpMachine === null) {
        try {
            const { WebpMachine, detectWebpSupport } = await import(
                'webp-hero/dist-cjs'
            );
            webpMachine = new WebpMachine();
            webpSupported = await detectWebpSupport();
        } catch (e: unknown) {
            showMessage(moduleImportError(e));
            throw e;
        }
    }

    let queueNext = webpMachineQueue.shift();
    while (queueNext !== undefined) {
        if (webpSupported) {
            queueNext.onError();
        } else {
            await drawWebp(webpMachine, queueNext);
        }
        queueNext = webpMachineQueue.shift();
    }
    webpMachineActive = false;
}

async function drawWebp(webpMachine: WebpMachine, queueItem: webpMachineQueueItem) {
    const canvas = createCanvasElement();
    try {
        await webpMachine.decodeToCanvas(canvas, queueItem.webpData);
    } catch (_) {
        if (DEVELOPMENT) {
            console.log('Failed to polyfill webp. Appended back to the queue to retry.');
        }
        webpMachineQueue.push(queueItem);
        return;
    } finally {
        webpMachine.clearCache();
    }
    canvas.style.removeProperty('width'); // webp-hero will add incorrect width and height properties
    canvas.style.removeProperty('height');
    imageProtection(canvas);
    appendChild(queueItem.container, canvas);
    const onLoad = queueItem.onLoad;
    onLoad && onLoad();
}

function imageProtection(elem: HTMLElement) {
    eventTargetsTracker.add(elem);
    removeRightClick(elem);
    addEventListener(elem, 'dragstart', (e) => {
        e.preventDefault();
    });
}

export function clearAllImageEvents() {
    for (const eventTarget of eventTargetsTracker) {
        removeAllEventListeners(eventTarget);
    }
    eventTargetsTracker.clear();
}