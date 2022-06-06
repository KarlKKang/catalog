// JavaScript Document
import "core-js";
import {
	debug,
	loginURL,
	sendServerRequest,
	message,
	getURLParam,
	clearCookies,
	getHref
} from './helper/main.js';

window.addEventListener("load", function(){
	clearCookies();
	
	if (!getHref().startsWith('https://featherine.com/confirm_special_register') && !debug) {
		window.location.replace(loginURL);
		return;
	}
	var user = getURLParam ('user');
	var signature = getURLParam ('signature');

	if (user == null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
		window.location.replace(loginURL);
		return;
	}
	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		window.location.replace(loginURL);
		return;
	}
	

	sendServerRequest('verify_special_register.php', {
		callback: function (response) {
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