// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var getURLParam = mainLocal.getURLParam;
	var loginURL = mainLocal.loginURL;
	var expiredMessage = mainLocal.expiredMessage;
	
	if (!window.location.href.startsWith('https://featherine.com/confirm_email') && !debug) {
		window.location.replace(loginURL);
		return;
	}
	
	var param = getURLParam ('p');
	var signature = getURLParam ('signature');

	if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
		window.location.replace(loginURL);
		return;
	}
	
	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		window.location.replace(loginURL);
		return;
	}
		
	sendServerRequest('change_email.php', {
		callback: function (response) {
			if (response == 'EXPIRED') {
				showMessage (expiredMessage);
			} else if (response == 'REJECTED') {
				showMessage ({
					title: 'リクエストは拒否されました',
					message: '未完成の招待状があります。招待が完了するまでお待ちください。',
					url: loginURL
				});
			} else if (response == 'DONE') {
				showMessage ({
					title: '完了しました',
					message: 'メールアドレスが変更されました。',
					color: 'green',
					url: loginURL
				});
			} else {
				showMessage ();
			}
		},
		content: "p="+param+"&signature="+signature,
		withCredentials: false
	});
		
});