// JavaScript Document
import "core-js";
import {
	DEVELOPMENT,
	LOGIN_URL,
	sendServerRequest,
	message,
	getURLParam,
	clearCookies,
	
	w,
	addEventListener,
	getHref,
	redirect,
} from './module/main';

addEventListener(w, 'load', function(){
	clearCookies();
	
	if (!getHref().startsWith('https://featherine.com/confirm_special_register') && !DEVELOPMENT) {
		redirect(LOGIN_URL, true);
		return;
	}
	var user = getURLParam ('user');
	var signature = getURLParam ('signature');

	if (user == null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
		redirect(LOGIN_URL, true);
		return;
	}
	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		redirect(LOGIN_URL, true);
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