// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/confirm_special_register.html') && !debug) {
		window.location.href = 'https://featherine.com';
	}
    initialize ();
});

var user = getURLParam ('user');
var signature = getURLParam ('signature');

function initialize () {
	if (user == null || user.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = topURL;
		return 0;
	}
	
	if (signature == null || signature.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = topURL;
		return 0;
	}
	
	handshake ();
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				if (this.responseText.includes('REJECTED')) {
					window.location.href = loginURL;
				} else if (this.responseText.includes('EXPIRED')) {
					showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
				} else if (this.responseText.includes('SERVER ERROR:')) {
					showMessage ('エラーが発生しました', 'red', this.responseText, loginURL);
				} else if (this.responseText.includes('/var/www') || !this.responseText.includes('DONE')) {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				} else {
					showMessage ('完了しました', 'green', 'アカウントが登録されました。', loginURL);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/verify_special_register.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+user+"&signature="+signature);
}