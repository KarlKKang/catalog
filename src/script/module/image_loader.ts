import type {WebpMachine} from 'webp-hero/dist-cjs';

import {
    DEVELOPMENT,
    imageProtection,
    message,

    appendChild,
    createElement
} from './main'

var webpMachine: WebpMachine | null = null;
var webpMachineActive = false;
type webpMachineQueueItem = {container: HTMLElement, image: HTMLImageElement, webpData: Uint8Array, onload: (() => void) | undefined, onerror: () => void};
var webpMachineQueue: webpMachineQueueItem[] = [];
var webpSupported: boolean;

export default function (container: HTMLElement, src: string, alt: string, onload?: () => void) {

	let blob: Blob;
	let isWebp: boolean;

	const image = new Image();
	image.alt = alt;

	function finalizeErrorImage () {
		if (DEVELOPMENT) {
			console.log('Unrecoverable error occured when loading the image.');
		}
		image.src = '//:0';
		appendChild(container, image);
	}

	function errorHandler () {
		// Convert Blob to Uint8Array
		var reader = new FileReader();
		reader.onload = function() {
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

		canvas.width = image.width;
		canvas.height = image.height;
		try {
			ctx!.drawImage(image, 0, 0);
		} catch (_) {
			finalizeErrorImage();
			return;
		} finally {
			URL.revokeObjectURL(image.src);
		}

		imageProtection(canvas);
		appendChild(container, canvas);
		if (onload !== undefined) {
			onload();
		}
	}


	const xhr = new XMLHttpRequest();
	xhr.open("GET", src);
	xhr.responseType = "blob";

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
			let {WebpMachine, detectWebpSupport} = await import(
				/* webpackChunkName: "webp-hero" */
				/* webpackExports: ["WebpMachine", "detectWebpSupport"] */
				'webp-hero/dist-cjs'
			);
			webpMachine = new WebpMachine();
			webpSupported = await detectWebpSupport();
		} catch(e: unknown) {
			message.show (message.template.param.moduleImportError(e));
            return;
		}
	}


	let queueNext = webpMachineQueue.shift();
	while(queueNext !== undefined) {
		if (webpSupported) {
			queueNext.onerror();
		} else {
			await drawWebp(webpMachine, queueNext);
		}
		queueNext = webpMachineQueue.shift();
	}
	webpMachineActive = false;
}

async function drawWebp (webpMachine: WebpMachine, queueItem: webpMachineQueueItem) {
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
	canvas.style.removeProperty("width"); // webp-hero will add incorrect width and height properties
	canvas.style.removeProperty("height");
	imageProtection(canvas);
    appendChild(queueItem.container, canvas);
	const onload = queueItem.onload;
	if (onload !== undefined) {
		onload();
	}
}