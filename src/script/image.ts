// JavaScript Document
import "core-js";
import {
	DEVELOPMENT,
	TOP_URL,
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
} from './module/main';
import {LocalImageParam, CDNCredentials} from './module/type';

addEventListener(w, 'load', function(){
	clearCookies();
	
	if (getHref()!='https://featherine.com/image' && !DEVELOPMENT) {
		redirect('https://featherine.com/image', true);
		return;
	}
	
	var paramCookie = getCookie('local-image-param');
	
	if (paramCookie === null) {
		redirect(TOP_URL, true);
		return;
	}
	
	deleteCookie('local-image-param');

	var parsedCookie: any;
	try {
		paramCookie = decodeURIComponent(paramCookie);
		parsedCookie = JSON.parse(paramCookie);
		LocalImageParam.check(parsedCookie);
	} catch (e) {
		redirect(TOP_URL, true);
		return;
	}
	const param = parsedCookie as LocalImageParam.LocalImageParam;

	const imageLoaderImportPromise = import(
		/* webpackChunkName: "image_loader" */
		/* webpackExports: ["default"] */
		'./module/image_loader'
	);
	
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
				CDNCredentials.check(parsedResponse);
			} catch (e) {
				message.show(message.template.param.server.invalidResponse);
			}
			const credentials = parsedResponse as CDNCredentials.CDNCredentials;
			const url = concatenateSignedURL(param.src, credentials);
			
			imageLoaderImportPromise.then(({default: imageLoader}) => {
				imageLoader(container, url, 'image from ' + param.title);
			}).catch((e) => {
				message.show(message.template.param.moduleImportError(e));
			});
		},
		content: "token="+param.authenticationToken + '&p=' + param.xhrParam
	});
});