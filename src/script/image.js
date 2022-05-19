// JavaScript Document
import "core-js";
import {
	debug,
	getCookie,
	topURL,
	keyExists,
	sendServerRequest,
	showMessage,
	imageProtection,
	concatenateSignedURL,
	clearCookies
} from './helper/main.js';

window.addEventListener("load", function(){
	clearCookies();
	
	if (!window.location.href.startsWith('https://featherine.com/image') && !debug) {
		window.location.replace('https://featherine.com/image');
		return;
	}
	
	var paramCookie = getCookie('local-image-param');
	
	if (paramCookie === null) {
		window.location.replace(topURL);
		return;
	}
	
	document.cookie = 'local-image-param=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
	
	var param;
	try {
		paramCookie = decodeURIComponent(paramCookie);
		param = JSON.parse(paramCookie);
	} catch (e) {
		window.location.replace(topURL);
		return;
	}
	
	
	var image = document.createElement('img');
	imageProtection(image);
	
	if (!keyExists(param, 'src') || !keyExists(param, 'title') || !keyExists(param, 'authenticationToken') || !keyExists(param, 'xhrParam')) {
		window.location.replace(topURL);
		return;
	}
	
	setInterval (function () {sendServerRequest('device_authenticate.php', {
		callback: function (response) {
			if (response!='APPROVED') {
				showMessage ();
				return false;
			}
		},
		content: "token="+param.authenticationToken
	});}, 60*1000);
	
	document.title = param.title + ' | featherine';
	
	var container = document.getElementById('image-container');
	
	image.addEventListener('error', function () {
		if (image.src.includes('.webp')) {
			import(
				/* webpackChunkName: "webp-hero" */
				/* webpackExports: ["WebpMachine"] */
				'webp-hero/dist-cjs'
			).then(({WebpMachine}) => {
				const webpMachine = new WebpMachine();
				webpMachine.polyfillImage(image);
			}).catch((e) => {
				showMessage ({message: 'モジュールの読み込みに失敗しました。このエラーが続く場合は、管理者にお問い合わせください。<br>' + e});
			});
		} else {
			window.location.replace(topURL);
		}
	});
	image.setAttribute('crossorigin', 'use-credentials');
	
	image.alt = 'image from ' + param.title;

	container.addEventListener('contextmenu', event => event.preventDefault());
	
	sendServerRequest('get_image.php', {
		callback: function (response) {
			try {
				response = JSON.parse(response);
			} catch (e) {
				showMessage ({message: 'サーバーが無効な応答を返しました。このエラーが続く場合は、管理者にお問い合わせください。', url: topURL});
				return;
			}
			let url = concatenateSignedURL(param.src, response);
			image.src = url;
			container.appendChild(image);
		},
		content: "token="+param.authenticationToken + '&p=' + param.xhrParam
	});
});