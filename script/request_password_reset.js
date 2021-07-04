// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://login.featherine.com/request_password_reset.html') && !debug) {
		window.location.href = 'https://login.featherine.com/request_password_reset.html';
	}
    start ('request_password_reset');
	document.getElementById('email').addEventListener('keydown', function () {
		if (event.key === "Enter") {
			submitRequest ();
		}
	});
});

function submitRequest () {
	if (getCookie('allow-password-reset')=='false' || getCookie('allow-login')=='false') {
		document.getElementById('warning').innerHTML = 'しばらくしてからもう一度お試しください。';
		document.getElementById('warning').setAttribute('style', 'display: initial;');
		return 0;
	}
	
	var email = document.getElementById('email').value;
	if (email=='' || email.match(/^[^\s@]+@[^\s@]+$/)===null) {
		document.getElementById('warning').innerHTML="有効なメールアドレスを入力してください。";
		document.getElementById('warning').setAttribute('style', 'display: initial;');
		return 0;
	}
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				document.getElementById('submit-button').disabled = false;
				if (this.responseText.includes('REJECTED')) {
					document.getElementById('warning').innerHTML="しばらくしてからもう一度お試しください。";
					document.getElementById('warning').setAttribute('style', 'display: initial;');
					document.cookie = 'allow-password-reset=false; max-age=86400; path=/' + (debug?'':'; Domain=.featherine.com');
				} else if (this.responseText.includes('SERVER ERROR:')) {
					showMessage ('エラーが発生しました', 'red', this.responseText, loginURL);
				} else if (this.responseText.includes('/var/www')) {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				} else if (this.responseText.includes('DONE')) {
					showMessage ('送信されました', 'green', '入力したメールアドレスが正しければ、パスワードを再設定するためのメールを送信されました。届くまでに時間がかかる場合があります。', loginURL);
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/send_password_reset.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("email="+email);
	document.getElementById('submit-button').disabled = true;
}

function goBack () {
	window.location.href = loginURL;
}