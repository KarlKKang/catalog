// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var loginURL = mainLocal.loginURL;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var getURLParam = mainLocal.getURLParam;
	
	if (!window.location.href.startsWith('https://featherine.com/confirm_special_register') && !debug) {
		window.location.href = 'https://featherine.com';
		return;
	}
	var user = getURLParam ('user');
	var signature = getURLParam ('signature');

	if (user == null || user.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = loginURL;
		return;
	}
	if (signature == null || signature.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = loginURL;
		return;
	}
	

	sendServerRequest('verify_special_register.php', {
		callback: function (response) {
				if (response == 'REJECTED') {
					showMessage ('拒否されました', 'red', '現在、登録は招待制となっています。', loginURL);
				} else if (response == 'EXPIRED') {
					showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
				} else if (response == 'DONE') {
					showMessage ('完了しました', 'green', 'アカウントが登録されました。', loginURL);
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。');
				}
		},
		content: "user="+user+"&signature="+signature,
		withCredentials: false
	});
	
});