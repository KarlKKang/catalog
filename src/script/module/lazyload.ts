// JavaScript Document
import 'intersection-observer';
import {
	imageProtection,
	sendServerRequest,
	message,
	concatenateSignedURL,
	debug,
	type,
	DOM
} from './main';
import type {WebpMachine} from 'webp-hero/dist-cjs';

var webpMachine: WebpMachine | null = null;
var webpMachineActive = false;
var webpMachineQueue: HTMLImageElement[] = [];

export default function () {
	
	var elems = DOM.getByClass('lazyload');
	const options = {
		root: null,
		rootMargin: '0px 0px 50% 0px',
		threshold: [0]
	};
	
	for (let elem of elems) {
		if (elem instanceof HTMLElement && !DOM.containsClass(elem, 'listening')) {
			let observer = new IntersectionObserver(observerCallback, options);
			observer.observe(elem);
			DOM.addClass(elem, 'listening');
		}
	}
}

function observerCallback(entries: IntersectionObserverEntry[], observer: IntersectionObserver) {
	const entry = entries[0];
	if (entry === undefined) {
		message.show(message.template.param.javascriptError('IntersectionObserverEntry is undefined.'));
		return;
	}
	const target = entry.target as HTMLElement;
	
	if(entry['isIntersecting'] === true) {
		observer.unobserve(target);
			
		const imageNode = DOM.createElement('img') as HTMLImageElement;
		imageProtection(imageNode);
		DOM.addEventListener(imageNode, 'load', function () {
			DOM.addClass(target, 'complete');
		});
		DOM.addEventListener(imageNode, 'error', function () {
			if (imageNode.src.includes('.webp')) {
				if (webpMachineActive) {
					webpMachineQueue.push(imageNode);
					if (debug) {
						console.log('Webp Machine active. Pushed ' + imageNode.src + ' to queue.');
					}
				} else {
					webpMachineActive = true;
					webpMachineQueue.push(imageNode);
					startWebpMachine();
					if (debug) {
						console.log('Webp Machine NOT active. Pushed ' + imageNode.src + ' to queue. Webp Machine started.');
					}
				}
			}
		});
		if (target.dataset.src === undefined) {
			message.show(message.template.param.lazyloadSrcMissing);
			return;
		}
		if (target.dataset.crossorigin !== undefined) {
			imageNode.setAttribute('crossorigin', target.dataset.crossorigin);
		}
		if (target.dataset.alt !== undefined) {
			imageNode.alt = target.dataset.alt;
		} else {
			imageNode.alt = 'image element';
		}
		if (target.dataset.authenticationToken !== undefined) {
			sendServerRequest('get_image.php', {
				callback: function (response: string) {
					var credentials: type.CDNCredentials.CDNCredentials;
					try {
						var parsedResponse: any = JSON.parse(response);
						type.CDNCredentials.check(parsedResponse);
						credentials = parsedResponse as type.CDNCredentials.CDNCredentials;
					} catch (e) {
						message.show (message.template.param.server.invalidResponse);
						return;
					}
					if (target.dataset.src === undefined) {
						message.show(message.template.param.lazyloadSrcMissing);
						return;
					}
					let url = concatenateSignedURL(target.dataset.src, credentials);
					imageNode.src = url;
					target.appendChild(imageNode);
				},
				content: "token="+target.dataset.authenticationToken+"&p="+target.dataset.xhrParam
			});
		} else {
			imageNode.src = target.dataset.src;
			target.appendChild(imageNode);
		}
	}
}

async function startWebpMachine() {
	if (webpMachine === null) {
		try {
			let {WebpMachine} = await import(
				/* webpackChunkName: "webp-hero" */
				/* webpackExports: ["WebpMachine"] */
				'webp-hero/dist-cjs'
			);
			webpMachine = new WebpMachine();
		} catch(e: unknown) {
			message.show (message.template.param.moduleImportError(e));
            return;
		}
	}
	while(webpMachineQueue.length != 0) {
		let imageNode = webpMachineQueue.shift() as HTMLImageElement;
		let originalSrc = imageNode.src;
		await webpMachine.polyfillImage(imageNode);
		if (imageNode.src == originalSrc) { // The first two images tend to failed to decode.
			if (debug) {
				console.log('Failed to polyfill webp. Appended back to the queue to retry.');
			}
			webpMachineQueue.push(imageNode);
		}
		webpMachine.clearCache();
	}
	webpMachineActive = false;
}