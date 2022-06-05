// JavaScript Document
import 'intersection-observer';
import {
	imageProtection,
	sendServerRequest,
	topURL,
	showMessage,
	concatenateSignedURL,
	debug
} from './main.js';

var webpMachine = null;
var webpMachineActive = false;
var webpMachineQueue = [];

export default function () {
	
	var elem = document.getElementsByClassName('lazyload');
	const options = {
		root: null,
		rootMargin: '0px 0px 50% 0px',
		threshold: [0]
	};
	
	for (var i=0; i<elem.length; i++) {
		if (!elem[i].classList.contains('listening')) {
			let observer = new IntersectionObserver((entries, observer) => {
				if(entries[0]['isIntersecting'] === true) {
					let target = entries[0].target;
					observer.unobserve(target);
						
					let imageNode = document.createElement('img');
					imageProtection(imageNode);
					imageNode.addEventListener('load', function () {
						target.classList.add('complete');
					});
					imageNode.addEventListener('error', function () {
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
					if ('crossorigin' in target.dataset) {
						imageNode.setAttribute('crossorigin', target.dataset.crossorigin);
					}
					if ('alt' in target.dataset) {
						imageNode.alt = target.dataset.alt;
					} else {
						imageNode.alt = 'image element';
					}
					if ('authenticationToken' in target.dataset) {
						sendServerRequest('get_image.php', {
							callback: function (response) {
								try {
									response = JSON.parse(response);
								} catch (e) {
									showMessage ({message: 'サーバーが無効な応答を返しました。このエラーが続く場合は、管理者にお問い合わせください。', url: topURL});
									return;
								}
								let url = concatenateSignedURL(target.dataset.src, response);
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
			}, options);
			observer.observe(elem[i]);
			elem[i].classList.add('listening');
		}
	}
}

async function startWebpMachine() {
	if (webpMachine === null) {
		if (debug) {
			console.log('webp-hero not imported.');
		}
		let {WebpMachine} = await import(
			/* webpackChunkName: "webp-hero" */
			/* webpackExports: ["WebpMachine"] */
			'webp-hero/dist-cjs'
		);
		webpMachine = new WebpMachine();
		if (debug) {
			console.log('webp-hero successfully imported.');
		}
	}
	while(webpMachineQueue.length != 0) {
		let imageNode = webpMachineQueue.shift();
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