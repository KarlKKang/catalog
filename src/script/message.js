// JavaScript Document
import "core-js";
import {
	debug,
	topURL,
	keyExists,
	logout,
	getCookie,
	clearCookies,
	cssVarWrapper
} from './helper/main.js';
import cssVars from 'css-vars-ponyfill';

window.addEventListener("load", function(){
	cssVarWrapper(cssVars);
	clearCookies();
	
	var paramCookie = getCookie('local-message-param');
	
	var url;
	
	if (paramCookie === null) {
		if (debug) {
			document.getElementById('title').classList.add('color-orange');
			document.getElementById('title').innerHTML = 'タイトルTitle';
			document.getElementById('message').innerHTML = 'メッセージMessageメッセージMessageメッセージMessageメッセージMessageメッセージMessage';
			document.body.classList.remove("hidden");
		} else {
			window.location.replace(topURL);
		}
		return;
	}
	
	var param;
	try {
		paramCookie = decodeURIComponent(paramCookie);
		param = JSON.parse(paramCookie);
	} catch (e) {
		window.location.replace(topURL);
		return;
	}
	
	var callback = function () {
		document.title = param.htmlTitle;
		document.getElementById('title').innerHTML = param.title;
		document.getElementById('title').classList.add('color-'+param.color);
		document.getElementById('message').innerHTML = param.message;
		var button = document.getElementById('button');
		url = param.url;
		if (param.url == null) {
			document.cookie = 'local-message-param=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
			button.classList.add('hidden');
		} else {
			button.innerHTML = '次に進む';
			button.addEventListener('click', function () {
				document.cookie = 'local-message-param=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
				window.location.replace(url);
			});
		}
		
		document.body.classList.remove("hidden");
	};

	if (keyExists(param, 'logout')) {
		if (param.logout === true) {
			logout (callback);
			return;
		}
	}
	
	callback ();

});