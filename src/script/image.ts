// JavaScript Document
import "core-js";
import {
	debug,
	topURL,
	sendServerRequest,
	message,
	concatenateSignedURL,
	clearCookies,
	removeRightClick,

	w,
	addEventListener,
	getHref,
	redirect,
	getCookie,
	deleteCookie,
	setTitle,
	getById,

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
	const param = parsedCookie as type.LocalImageParam.LocalImageParam;
	
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
			const credentials = parsedResponse as type.CDNCredentials.CDNCredentials;
			const url = concatenateSignedURL(param.src, credentials);
			
			import(
                /* webpackChunkName: "image_loader" */
                /* webpackExports: ["default"] */
                './module/image_loader'
            ).then(({default: imageLoader}) => {
				imageLoader(container, url, 'image from ' + param.title);
			}).catch((e) => {
				message.show(message.template.param.moduleImportError(e));
			});
		},
		content: "token="+param.authenticationToken + '&p=' + param.xhrParam
	});
});