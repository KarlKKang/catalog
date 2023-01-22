import type { WebpMachine } from 'webp-hero/dist-cjs';
import {
    DEVELOPMENT
} from './env/constant';
import {
    imageProtection,
} from './main';
import {
    appendChild,
    createElement
} from './dom';
import { show as showMessage } from './message';
import { moduleImportError } from './message/template/param';

let webpMachine: WebpMachine | null = null;
let webpMachineActive = false;
type webpMachineQueueItem = { container: Element; image: HTMLImageElement; webpData: Uint8Array; onload: (() => void) | undefined; onerror: () => void };
const webpMachineQueue: webpMachineQueueItem[] = [];
let webpSupported: boolean;

export default function (container: Element, src: string, alt: string, onload?: () => void) {

    let blob: Blob;
    let isWebp: boolean;

    const image = new Image();
    image.alt = alt;

    function finalizeErrorImage() {
        if (DEVELOPMENT) {
            console.log('Unrecoverable error occured when loading the image.');
        }
        image.src = '//:0';
        appendChild(container, image);
    }

    function errorHandler() {
        // Convert Blob to Uint8Array
        const reader = new FileReader();
        reader.onload = function () {
            const base64URL = reader.result;
            if (!(base64URL instanceof ArrayBuffer) || !isWebp) {
                finalizeErrorImage();
                return;
            }

            const webpData = new Uint8Array(base64URL);
            if (webpMachineActive) {
                webpMachineQueue.push({ container: container, image: image, webpData: webpData, onload: onload, onerror: finalizeErrorImage });
                if (DEVELOPMENT) {
                    console.log('Webp Machine active. Pushed ' + image.alt + ' to queue.');
                }
            } else {
                webpMachineActive = true;
                webpMachineQueue.push({ container: container, image: image, webpData: webpData, onload: onload, onerror: finalizeErrorImage });
                startWebpMachine();
                if (DEVELOPMENT) {
                    console.log('Webp Machine NOT active. Pushed ' + image.alt + ' to queue. Webp Machine started.');
                }
            }
        };
        reader.readAsArrayBuffer(blob);
    }

    image.onerror = errorHandler;
    image.onload = function () {
        const canvas = createElement('canvas') as HTMLCanvasElement;
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
        onload && onload();
    };


    const xhr = new XMLHttpRequest();
    xhr.open('GET', src);
    xhr.responseType = 'blob';

    xhr.onerror = finalizeErrorImage;
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                isWebp = xhr.getResponseHeader('Content-Type') === 'image/webp';
                blob = xhr.response as Blob;
                image.src = URL.createObjectURL(blob);
            } else {
                finalizeErrorImage();
            }
        }
    };

    xhr.send();
}

async function startWebpMachine() {
    if (webpMachine === null) {
        try {
            const { WebpMachine, detectWebpSupport } = await import(
                /* webpackExports: ["WebpMachine", "detectWebpSupport"] */
                'webp-hero/dist-cjs'
            );
            webpMachine = new WebpMachine();
            webpSupported = await detectWebpSupport();
        } catch (e: unknown) {
            showMessage(moduleImportError(e));
            return;
        }
    }


    let queueNext = webpMachineQueue.shift();
    while (queueNext !== undefined) {
        if (webpSupported) {
            queueNext.onerror();
        } else {
            await drawWebp(webpMachine, queueNext);
        }
        queueNext = webpMachineQueue.shift();
    }
    webpMachineActive = false;
}

async function drawWebp(webpMachine: WebpMachine, queueItem: webpMachineQueueItem) {
    const canvas = createElement('canvas') as HTMLCanvasElement;
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
    const onload = queueItem.onload;
    onload && onload();
}