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
	DOM,
	type,
	removeRightClick
} from './module/main';

DOM.addEventListener(DOM.w, 'load', function(){
	clearCookies();
	
	if (DOM.getHref()!='https://featherine.com/image' && !debug) {
		DOM.redirect('https://featherine.com/image', true);
		return;
	}
	
	var paramCookie = DOM.getCookie('local-image-param');
	
	if (paramCookie === null) {
		DOM.redirect(topURL, true);
		return;
	}
	
	DOM.deleteCookie('local-image-param');

	var parsedCookie: any;
	try {
		paramCookie = decodeURIComponent(paramCookie);
		parsedCookie = JSON.parse(paramCookie);
		type.LocalImageParam.check(parsedCookie);
	} catch (e) {
		DOM.redirect(topURL, true);
		return;
	}
	var param = parsedCookie as type.LocalImageParam.LocalImageParam;
	
	
	var image = DOM.createElement('img') as HTMLImageElement;
	imageProtection(image);
	
	setInterval (function () {sendServerRequest('device_authenticate.php', {
		callback: function (response: string) {
			if (response!='APPROVED') {
				message.show();
			}
		},
		content: "token="+param.authenticationToken
	});}, 60*1000);
	
	DOM.setTitle(param.title + ' | featherine');
	
	var container = DOM.getById('image-container');

	DOM.addEventListener(image, 'error', function () {
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
			DOM.redirect(topURL, true);
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
			container.appendChild(image);
		},
		content: "token="+param.authenticationToken + '&p=' + param.xhrParam
	});
});