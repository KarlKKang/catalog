// JavaScript Document
import "core-js";
import {
	debug,
	topURL,
	sendServerRequest,
	message,
	imageProtection,
	concatenateSignedURL,
	clearCookies,
	removeRightClick,

	w,
	addEventListener,
	getHref,
	redirect,
	getCookie,
	deleteCookie,
	createElement,
	setTitle,
	getById,
	appendChild,

	type
} from './module/main';

addEventListener(w, 'load', function(){
	clearCookies();
	
	if (getHref()!='https://featherine.com/image' && !debug) {
		redirect('https://featherine.com/image', true);
		return;
	}
	
	var paramCookie = getCookie('local-image-param');
	
	if (paramCookie === null) {
		redirect(topURL, true);
		return;
	}
	
	deleteCookie('local-image-param');

	var parsedCookie: any;
	try {
		paramCookie = decodeURIComponent(paramCookie);
		parsedCookie = JSON.parse(paramCookie);
		type.LocalImageParam.check(parsedCookie);
	} catch (e) {
		redirect(topURL, true);
		return;
	}
	var param = parsedCookie as type.LocalImageParam.LocalImageParam;
	
	
	var image = createElement('img') as HTMLImageElement;
	imageProtection(image);
	
	setInterval (function () {sendServerRequest('device_authenticate.php', {
		callback: function (response: string) {
			if (response!='APPROVED') {
				message.show();
			}
		},
		content: "token="+param.authenticationToken
	});}, 60*1000);
	
	setTitle(param.title + ' | featherine');
	
	var container = getById('image-container');

	addEventListener(image, 'error', function () {
		if (image.src.includes('.webp')) {
			import(
				/* webpackChunkName: "webp-hero" */
				/* webpackExports: ["WebpMachine"] */
				'webp-hero/dist-cjs'
			).then(({WebpMachine}) => {
				const webpMachine = new WebpMachine();
				webpMachine.polyfillImage(image);
			}).catch((e) => {
				message.show(message.template.param.moduleImportError(e));
			});
		} else {
			redirect(topURL, true);
		}
	});

	image.crossOrigin = 'use-credentials';
	image.alt = 'image from ' + param.title;

	removeRightClick(container);
	
	sendServerRequest('get_image.php', {
		callback: function (response: string) {
			var parsedResponse: any;
			try {
				parsedResponse = JSON.parse(response);
				type.CDNCredentials.check(parsedResponse);
			} catch (e) {
				message.show(message.template.param.server.invalidResponse);
			}
			var credentials = parsedResponse as type.CDNCredentials.CDNCredentials;
			let url = concatenateSignedURL(param.src, credentials);
			image.src = url;
			appendChild(container, image);
		},
		content: "token="+param.authenticationToken + '&p=' + param.xhrParam
	});
});