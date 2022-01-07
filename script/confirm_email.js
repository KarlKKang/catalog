// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var getURLParam = mainLocal.getURLParam;
	var loginURL = mainLocal.loginURL;
	
	if (!window.location.href.startsWith('https://featherine.com/confirm_email') && !debug) {
		window.location.href = 'https://featherine.com';
		return;
	}
	
	var param = getURLParam ('p');
	var signature = getURLParam ('signature');

	if (param == null || param.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = loginURL;
		return;
	}
	
	if (signature == null || signature.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = loginURL;
		return;
	}
		
	sendServerRequest('change_email.php', {
		callback: function (response) {
			if (response == 'EXPIRED') {
				showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
			} else if (response == 'REJECTED') {
				showMessage ('リクエストは拒否されました', 'red', '未完成の招待状があります。招待が完了するまでお待ちください。', loginURL);
			} else if (response == 'DONE') {
				showMessage ('完了しました', 'green', 'メールアドレスが変更されました。', loginURL);
			} else {
				showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。');
			}
		},
		content: "p="+param+"&signature="+signature,
		withCredentials: false
	});
		
});