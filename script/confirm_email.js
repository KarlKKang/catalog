// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/confirm_email') && !debug) {
		window.location.href = 'https://featherine.com';
		return 0;
	}
	
	var param = getURLParam ('p');
	var signature = getURLParam ('signature');

	if (param == null || param.match(/^[a-zA-Z0-9~_-]+$/)===null) {
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
			if (this.readyState == 4) {
				if (checkXHRStatus (this.status)) {
					if (this.responseText.includes('/var/www')) {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
					} else if (this.responseText.includes('SERVER ERROR:')) {
						showMessage ('エラーが発生しました', 'red', this.responseText, loginURL);
					} else if (this.responseText.includes('EXPIRED')) {
						showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
					} else if (this.responseText.includes('REJECTED')) {
						showMessage ('リクエストは拒否されました', 'red', '未定の招待があります。招待が完了するまでお待ちください。', loginURL);
					} else if (this.responseText == 'DONE') {
						showMessage ('完了しました', 'green', 'メールアドレスが変更されました。', loginURL);
					} else {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
					}
				}
			}
		};
		xmlhttp.open("POST", serverURL + "/change_email.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("p="+param+"&signature="+signature);
	});
});