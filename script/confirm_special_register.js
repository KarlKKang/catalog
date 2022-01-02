// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/confirm_special_register') && !debug) {
		window.location.href = 'https://featherine.com';
		return 0;
	}
	var user = getURLParam ('user');
	var signature = getURLParam ('signature');

	if (user == null || user.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = loginURL;
		return 0;
	}
	if (signature == null || signature.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = loginURL;
		return 0;
	}

	handshake (function () {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (checkXHRStatus (this.status)) {
				if (this.readyState == 4) {
					if (this.responseText.includes('/var/www')) {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
					} else if (this.responseText.includes('SERVER ERROR:')) {
						showMessage ('エラーが発生しました', 'red', this.responseText, loginURL);
					} else if (this.responseText.includes('REJECTED')) {
						window.location.href = loginURL;
					} else if (this.responseText.includes('EXPIRED')) {
						showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
					} else if (this.responseText == 'DONE') {
						showMessage ('完了しました', 'green', 'アカウントが登録されました。', loginURL);
					} else {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
					}
				}
			}
		};
		addXHROnError(xmlhttp);
		xmlhttp.open("POST", serverURL + "/verify_special_register.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("user="+user+"&signature="+signature);
	});
});