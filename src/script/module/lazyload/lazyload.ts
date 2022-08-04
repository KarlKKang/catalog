// JavaScript Document
import 'intersection-observer';
import {
	sendServerRequest,
	concatenateSignedURL,
} from '../main';
import {
	getByClass,
	containsClass,
	addClass,
} from '../DOM';
import * as message from '../message';
import {CDNCredentials} from '../type';
import type ImageLoader from '../image_loader';

var loader: typeof ImageLoader;
export default function (imageLoader: typeof ImageLoader) {
	loader = imageLoader;

	var elems = getByClass('lazyload');
	const options = {
		root: null,
		rootMargin: '0px 0px 50% 0px',
		threshold: [0]
	};
	
	for (let elem of elems) {
		if (elem instanceof HTMLElement && !containsClass(elem, 'listening')) {
			let observer = new IntersectionObserver(observerCallback, options);
			observer.observe(elem);
			addClass(elem, 'listening');
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

		const src = target.dataset.src;
		if (src === undefined) {
			message.show(message.template.param.lazyloadSrcMissing);
			return;
		}

		const alt = target.dataset.alt === undefined ? src : target.dataset.alt;

		if (target.dataset.authenticationToken !== undefined) {
			sendServerRequest('get_image.php', {
				callback: function (response: string) {
					var credentials: CDNCredentials.CDNCredentials;
					try {
						var parsedResponse: any = JSON.parse(response);
						CDNCredentials.check(parsedResponse);
						credentials = parsedResponse as CDNCredentials.CDNCredentials;
					} catch (e) {
						message.show (message.template.param.server.invalidResponse);
						return;
					}

					const url = concatenateSignedURL(src, credentials);
					loader(target, url, alt, function () {
						addClass(target, 'complete');
					});
				},
				content: "token="+target.dataset.authenticationToken+"&p="+target.dataset.xhrParam
			});
		} else {
			loader(target, src, alt, function () {
				addClass(target, 'complete');
			});
		}
	}
}