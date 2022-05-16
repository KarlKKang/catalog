// JavaScript Document
import {
	debug,
	loginURL,
	sendServerRequest,
	showMessage,
	getURLParam,
	expiredMessage,
	clearCookies
} from './main.js';

window.addEventListener("load", function(){
	clearCookies();
	
	if (!window.location.href.startsWith('https://featherine.com/confirm_special_register') && !debug) {
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
					showMessage ({
						title: '拒否されました',
						message: '現在、登録は招待制となっています。',
						url: loginURL
					});
				} else if (response == 'EXPIRED') {
					showMessage (expiredMessage);
				} else if (response == 'DONE') {
					showMessage ({
						title: '完了しました',
						message: 'アカウントが登録されました。',
						color: 'green',
						url: loginURL
					});
				} else {
					showMessage ();
				}
		},
		content: "user="+user+"&signature="+signature,
		withCredentials: false
	});
	
});