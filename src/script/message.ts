// JavaScript Document
import "core-js";
import {
	debug,
	topURL,
	logout,
	clearCookies,
	cssVarWrapper,
	changeColor,

	w,
	addEventListener,
	getCookie,
	getById,
	removeClass,
	getBody,
	redirect,
	setTitle,
	deleteCookie,
	addClass,

	type
} from './module/main';

addEventListener(w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	var paramCookie = getCookie('local-message-param');
	var titleElem = getById('title');
	var messageElem = getById('message');

	if (paramCookie === null) {
		if (debug) {
			changeColor(titleElem, 'orange');
			titleElem.innerHTML = 'タイトルTitle';
			messageElem.innerHTML = 'メッセージMessageメッセージMessageメッセージMessageメッセージMessageメッセージMessage';
			removeClass(getBody(), "hidden");
		} else {
			redirect(topURL, true);
		}
		return;
	}

	var parsedParam: any;
	try {
		paramCookie = decodeURIComponent(paramCookie);
		parsedParam = JSON.parse(paramCookie);
		type.LocalMessageParam.check(parsedParam);
	} catch (e) {
		redirect(topURL, true)
		return;
	}

	var param = parsedParam as type.LocalMessageParam.LocalMessageParam;
	
	var callback = function () {
		setTitle(param.htmlTitle);
		titleElem.innerHTML = param.title;
		changeColor(titleElem, param.color);
		messageElem.innerHTML = param.message;
		var button = getById('button');
		if (param.url === null) {
			deleteCookie('local-message-param');
			addClass(button, 'hidden');
		} else {
			let url = param.url;
			button.innerHTML = '次に進む';
			addEventListener(button, 'click', function () {
				deleteCookie('local-message-param');
				redirect(url, true);
			})
		}
		
		removeClass(getBody(), "hidden");
	};

	if (param.logout === true) {
		logout (callback);
		return;
	}
	
	callback ();
});