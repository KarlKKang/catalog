// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var loginURL = mainLocal.loginURL;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var getURLParam = mainLocal.getURLParam;
	var expiredMessage = mainLocal.expiredMessage;
	
	if (!window.location.href.startsWith('https://featherine.com/confirm_special_register') && !debug) {
		window.location.href = 'https://featherine.com';
		return;
	}
	var user = getURLParam ('user');
	var signature = getURLParam ('signature');

	if (user == null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
		window.location.href = loginURL;
		return;
	}
	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		window.location.href = loginURL;
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