// JavaScript Document
import "core-js";
import {
	debug,
	loginURL,
	sendServerRequest,
	message,
	getURLParam,
	clearCookies,
	DOM
} from './module/main';

DOM.addEventListener(DOM.w, 'load', function(){
	clearCookies();
	
	if (!DOM.getHref().startsWith('https://featherine.com/confirm_special_register') && !debug) {
		DOM.redirect(loginURL, true);
		return;
	}
	var user = getURLParam ('user');
	var signature = getURLParam ('signature');

	if (user == null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
		DOM.redirect(loginURL, true);
		return;
	}
	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		DOM.redirect(loginURL, true);
		return;
	}
	

	sendServerRequest('verify_special_register.php', {
		callback: function (response: string) {
				if (response == 'REJECTED') {
					message.show(message.template.param.invitationOnly);
				} else if (response == 'EXPIRED') {
					message.show(message.template.param.expired);
				} else if (response == 'DONE') {
					message.show(message.template.param.registerComplete);
				} else {
					message.show();
				}
		},
		content: "user="+user+"&signature="+signature,
		withCredentials: false
	});
	
});