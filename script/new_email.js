// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/new_email') && !debug) {
		window.location.href = 'https://featherine.com';
		return 0;
	}
	
	appearanceSwitching();
	
	document.getElementById('new-email').addEventListener('keydown', function () {
		if (event.key === "Enter") {
			submitRequest ();
		}
	});
	
	document.getElementById('submit-button').addEventListener('click', function () {
		submitRequest ();
	});
	
	var param = getURLParam ('p');
	var signature = getURLParam ('signature');

	
	if (param == null || param.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		if (debug) {
			document.getElementsByTagName("body")[0].classList.remove("hidden");
		} else {
			window.location.href = topURL;
		}
		return 0;
	}
	if (signature == null || signature.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = topURL;
		return 0;
	}

	handshake (function () {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (checkXHRStatus (this.status)) {
					if (this.responseText.includes('/var/www')) {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL);
					} else if (this.responseText.includes('SERVER ERROR:')) {
						showMessage ('エラーが発生しました', 'red', this.responseText, topURL);
					} else if (this.responseText.includes('EXPIRED')) {
						showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', topURL);
					} else if (this.responseText == 'APPROVED') {
						document.getElementsByTagName("body")[0].classList.remove("hidden");
					} else {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL);
					}
				}
			}
		};
		xmlhttp.open("POST", serverURL + "/verify_email_change.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("p="+param+"&signature="+signature);
	});


	function submitRequest () {
		document.getElementById('submit-button').disabled = true;
		var newEmail = document.getElementById('new-email').value;

		if (newEmail == '' || newEmail.match(/^[^\s@]+@[^\s@]+$/)===null) {
			document.getElementById('warning').innerHTML = '有効なメールアドレスを入力してください。';
			document.getElementById('warning').classList.remove('hidden');
			document.getElementById('submit-button').disabled = false;
			return 0;
		}

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
					} else if (this.responseText.includes('DUPLICATED')) {
						document.getElementById('warning').innerHTML = 'このメールアドレスは登録済み、または招待されています。';
						document.getElementById('warning').classList.remove('hidden');
						document.getElementById('submit-button').disabled = false;
					} else if (this.responseText == 'DONE') {
						showMessage ('送信されました', 'green', '変更を確認するメールが送信されました。届くまでに時間がかかる場合があります。', loginURL);
					} else {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
					}
				}
			}
		};
		xmlhttp.open("POST", serverURL + "/verify_email_change.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("p="+param+"&signature="+signature+"&new="+newEmail);
	}
});