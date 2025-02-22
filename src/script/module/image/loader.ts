import type { WebpMachine } from 'webp-hero';
import { removeRightClick } from '../dom/element/remove_right_click';
import { newXhr } from '../xhr/new';
import { appendChild } from '../dom/node/append_child';
import { removeAllEventListeners } from '../event_listener/remove/all_listeners';
import { addEventListener } from '../event_listener/add';
import { createCanvasElement } from '../dom/element/canvas/create';
import { setHeight } from '../style/height';
import { setWidth } from '../style/width';
import { importModule } from '../import_module';
import { newFileReader } from '../file_reader/new';
import { abortFileReader } from '../file_reader/abort';

let webpMachine: WebpMachine | null = null;
let webpMachineActive = false;
const enum WebpMachineQueueItemProp {
    CONTAINER,
    IMAGE,
    WEBP_DATA,
    ON_LOAD,
    ON_ERROR,
}
interface webpMachineQueueItem {
    readonly [WebpMachineQueueItemProp.CONTAINER]: Element;
    readonly [WebpMachineQueueItemProp.IMAGE]: HTMLImageElement;
    readonly [WebpMachineQueueItemProp.WEBP_DATA]: Uint8Array;
    readonly [WebpMachineQueueItemProp.ON_LOAD]: (canvas: HTMLCanvasElement) => void;
    readonly [WebpMachineQueueItemProp.ON_ERROR]: () => void;
}
const webpMachineQueue: webpMachineQueueItem[] = [];
let webpSupported: boolean;

let jobId: object = {};
const eventTargetsTracker = new Set<EventTarget>();
const fileReaderTracker = new Set<FileReader>();

export function imageLoader(container: Element, src: string, alt: string, withCredentials: boolean, onImageDraw: (canvas: HTMLCanvasElement) => void, onDataLoad: ((data: Blob) => void) | undefined, onNetworkError: () => void, onImageDrawError: () => void): XMLHttpRequest {
    const currentJobId = jobId;
    let imageData: Blob;
    let isWebp: boolean;

    const image = new Image();
    image.alt = alt;

    function finalizeImageDrawError() {
        if (ENABLE_DEBUG) {
            console.error('Unrecoverable error occured when loading the image.');
        }
        const errorImage = new Image(); // Should not reuse the old Image instance since setting src to //:0 triggers onError event.
        errorImage.src = '//:0';
        errorImage.alt = alt;
        appendChild(container, errorImage);
        onImageDrawError();
    }

    function onImageError() {
        removeAllEventListeners(image);

        if (currentJobId !== jobId) {
            return;
        }

        if (!isWebp) {
            finalizeImageDrawError();
            return;
        }

        // Convert Blob to Uint8Array
        const reader = newFileReader();
        fileReaderTracker.add(reader);
        addEventListener(reader, 'load', () => {
            fileReaderTracker.delete(reader);

            const base64URL = reader.result;
            if (base64URL === null) {
                finalizeImageDrawError();
                return;
            }

            const webpData = new Uint8Array(base64URL as ArrayBuffer);
            webpMachineQueue.push({
                [WebpMachineQueueItemProp.CONTAINER]: container,
                [WebpMachineQueueItemProp.IMAGE]: image,
                [WebpMachineQueueItemProp.WEBP_DATA]: webpData,
                [WebpMachineQueueItemProp.ON_LOAD]: onImageDraw,
                [WebpMachineQueueItemProp.ON_ERROR]: finalizeImageDrawError,
            });
            if (webpMachineActive) {
                if (ENABLE_DEBUG) {
                    console.log('Webp Machine active. Pushed ' + image.alt + ' to queue.');
                }
            } else {
                webpMachineActive = true;
                startWebpMachine();
                if (ENABLE_DEBUG) {
                    console.log('Webp Machine NOT active. Pushed ' + image.alt + ' to queue. Webp Machine started.');
                }
            }
        });
        addEventListener(reader, 'error', () => {
            fileReaderTracker.delete(reader);
            finalizeImageDrawError();
        });
        reader.readAsArrayBuffer(imageData);
    }

    function onImageLoad() {
        removeAllEventListeners(image);

        if (currentJobId !== jobId) {
            return;
        }

        const canvas = createCanvasElement();
        const ctx = canvas.getContext('2d');
        if (ctx === null) {
            finalizeImageDrawError();
            return;
        }

        canvas.width = image.width;
        canvas.height = image.height;
        try {
            ctx.drawImage(image, 0, 0);
        } catch {
            finalizeImageDrawError();
            return;
        } finally {
            URL.revokeObjectURL(image.src);
        }

        imageProtection(canvas);
        appendChild(container, canvas);
        onImageDraw(canvas);
    }

    addEventListener(image, 'error', onImageError);
    addEventListener(image, 'load', onImageLoad);

    const xhr = newXhr(
        src,
        'GET',
        withCredentials,
        () => {
            if (currentJobId !== jobId) {
                return;
            }
            if (xhr.status === 200) {
                isWebp = xhr.getResponseHeader('Content-Type') === 'image/webp';
                imageData = xhr.response as Blob;
                image.src = URL.createObjectURL(imageData);
                onDataLoad && onDataLoad(imageData);
            } else {
                onNetworkError();
            }
        },
    );
    addEventListener(xhr, 'error', () => {
        if (currentJobId !== jobId) {
            return;
        }
        onNetworkError();
    });
    xhr.responseType = 'blob';
    xhr.send();
    return xhr;
}

async function startWebpMachine() {
    const currentJobId = jobId;
    if (webpMachine === null) {
        const { WebpMachine, detectWebpSupport } = await importModule(
            () => import(
                /* webpackExports: ["WebpMachine", "detectWebpSupport"] */
                'webp-hero',
            ),
        );
        webpMachine = new WebpMachine();
        webpSupported = await detectWebpSupport();
        if (currentJobId !== jobId) {
            return;
        }
    }

    let queueNext = webpMachineQueue.shift();
    while (queueNext !== undefined) {
        if (webpSupported) {
            queueNext[WebpMachineQueueItemProp.ON_ERROR]();
        } else {
            await drawWebp(webpMachine, queueNext);
            if (currentJobId !== jobId) {
                return;
            }
        }
        queueNext = webpMachineQueue.shift();
    }
    webpMachineActive = false;
}

async function drawWebp(webpMachine: WebpMachine, queueItem: webpMachineQueueItem) {
    const currentJobId = jobId;
    const canvas = createCanvasElement();
    try {
        await webpMachine.decodeToCanvas(canvas, queueItem[WebpMachineQueueItemProp.WEBP_DATA]);
    } catch {
        if (currentJobId !== jobId) {
            return;
        }
        if (ENABLE_DEBUG) {
            console.warn('Failed to polyfill webp. Appended back to the queue to retry.');
        }
        webpMachineQueue.push(queueItem);
        webpMachine.clearCache();
        return;
    }
    if (currentJobId !== jobId) {
        return;
    }
    webpMachine.clearCache();
    setWidth(canvas, null); // webp-hero will add incorrect width and height properties
    setHeight(canvas, null);
    imageProtection(canvas);
    appendChild(queueItem[WebpMachineQueueItemProp.CONTAINER], canvas);
    queueItem[WebpMachineQueueItemProp.ON_LOAD](canvas);
}

function imageProtection(elem: HTMLElement) {
    eventTargetsTracker.add(elem);
    removeRightClick(elem);
    addEventListener(elem, 'dragstart', (e) => {
        e.preventDefault();
    });
}

export function offload() {
    jobId = {};
    webpMachineQueue.length = 0;
    webpMachineActive = false;
    webpMachine?.clearCache();
    offloadSet(eventTargetsTracker, removeAllEventListeners);
    offloadSet(fileReaderTracker, abortFileReader);
}

function offloadSet<T>(set: Set<T>, callback: (item: T) => void) {
    for (const item of set) {
        callback(item);
    }
    set.clear();
}
