// JavaScript Document
import "core-js";
import {
	DEVELOPMENT,
	sendServerRequest,
	message,
	getURLParam,
	LOGIN_URL,
	clearCookies,
	
	w,
	addEventListener,
	getHref,
	redirect,
} from './module/main';

addEventListener(w, 'load', function(){
	clearCookies();
	
	if (!getHref().startsWith('https://featherine.com/confirm_email') && !DEVELOPMENT) {
		redirect(LOGIN_URL, true);
		return;
	}
	
	var param = getURLParam ('p');
	var signature = getURLParam ('signature');

	if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
		redirect(LOGIN_URL, true);
		return;
	}
	
	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		redirect(LOGIN_URL, true);
		return;
	}
		
	sendServerRequest('change_email.php', {
		callback: function (response: string) {
			if (response == 'EXPIRED') {
				message.show (message.template.param.expired);
			} else if (response == 'REJECTED') {
				message.show (message.template.param.incompletedInvitation);
			} else if (response == 'DONE') {
				message.show (message.template.param.emailChanged);
			} else {
				message.show ();
			}
		},
		content: "p="+param+"&signature="+signature,
		withCredentials: false
	});
		
});