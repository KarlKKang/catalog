// JavaScript Document
import "core-js";
import {
	debug,
	topURL,
	logout,
	clearCookies,
	cssVarWrapper,
	DOM,
	type,
	changeColor
} from './module/main';

DOM.addEventListener(DOM.w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	var paramCookie = DOM.getCookie('local-message-param');
	var titleElem = DOM.getById('title');
	var messageElem = DOM.getById('message');

	if (paramCookie === null) {
		if (debug) {
			changeColor(titleElem, 'orange');
			titleElem.innerHTML = 'タイトルTitle';
			messageElem.innerHTML = 'メッセージMessageメッセージMessageメッセージMessageメッセージMessageメッセージMessage';
			DOM.removeClass(DOM.getBody(), "hidden");
		} else {
			DOM.redirect(topURL, true);
		}
		return;
	}

	var parsedParam: any;
	try {
		paramCookie = decodeURIComponent(paramCookie);
		parsedParam = JSON.parse(paramCookie);
		type.LocalMessageParam.check(parsedParam);
	} catch (e) {
		DOM.redirect(topURL, true)
		return;
	}

	var param = parsedParam as type.LocalMessageParam.LocalMessageParam;
	
	var callback = function () {
		DOM.setTitle(param.htmlTitle);
		titleElem.innerHTML = param.title;
		changeColor(titleElem, param.color);
		messageElem.innerHTML = param.message;
		var button = DOM.getById('button');
		if (param.url === null) {
			DOM.deleteCookie('local-message-param');
			DOM.addClass(button, 'hidden');
		} else {
			let url = param.url;
			button.innerHTML = '次に進む';
			DOM.addEventListener(button, 'click', function () {
				DOM.deleteCookie('local-message-param');
				DOM.redirect(url, true);
			})
		}
		
		DOM.removeClass(DOM.getBody(), "hidden");
	};

	if (param.logout === true) {
		logout (callback);
		return;
	}
	
	callback ();
});