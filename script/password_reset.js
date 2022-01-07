// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var loginURL = mainLocal.loginURL;
	var getURLParam = mainLocal.getURLParam;
	var passwordStyling = mainLocal.passwordStyling;
	
	if (!window.location.href.startsWith('https://login.featherine.com/password_reset') && !debug) {
		window.location.href = 'https://featherine.com';
		return;
	}
	
	appearanceSwitching();
	
	var newPasswordInput = document.getElementById('new-password');
	var newPasswordConfirmInput = document.getElementById('new-password-confirm');
	var sumbitButton = document.getElementById('submit-button');
	
	
	var user = getURLParam ('user');
	var signature = getURLParam ('signature');
	var expires = getURLParam ('expires');

	if (user == null || user.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		if (debug) {
			document.body.classList.remove("hidden");
		} else {
			window.location.href = loginURL;
		}
		return;
	}
	
	if (signature == null || signature.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = loginURL;
		return;
	}

	if (expires == null || expires.match(/^[0-9]+$/)===null) {
		window.location.href = loginURL;
		return;
	}

    sendServerRequest('reset_password.php', {
        callback: function (response) {
            if (response == 'EXPIRED') {
                showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
            } else if (response != 'APPROVED') {
                showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。');
            } else {
				newPasswordInput.addEventListener('keydown', function () {
					if (event.key === "Enter") {
						submitRequest ();
					}
				});
				newPasswordConfirmInput.addEventListener('keydown', function () {
					if (event.key === "Enter") {
						submitRequest ();
					}
				});
				sumbitButton.addEventListener('click', function () {
					submitRequest ();
				});

				newPasswordInput.addEventListener('input', function () {
					passwordStyling(this);
				});
				newPasswordConfirmInput.addEventListener('input', function () {
					passwordStyling(this);
				});
				document.body.classList.remove("hidden");
            }
        },
        content: "user="+user+"&signature="+signature+"&expires="+expires,
        withCredentials: false
    });


	function submitRequest () {
		var warningElem = document.getElementById('warning');
		
		sumbitButton.disabled=true;

		var newPassword = newPasswordInput.value;
		var newPasswordConfirm = newPasswordConfirmInput.value;

		if (newPassword=='' || newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
			warningElem.innerHTML = 'パスワードが要件を満たしていません。';
			warningElem.classList.remove('hidden');
			sumbitButton.disabled=false;
			return;
		} else if (newPassword!=newPasswordConfirm) {
			warningElem.innerHTML = '確認再入力が一致しません。';
			warningElem.classList.remove('hidden');
			sumbitButton.disabled=false;
			return;
		} else {
			var hash = forge.md.sha512.sha256.create();
			hash.update(newPassword);
			newPassword = hash.digest().toHex();
		}
		
		sendServerRequest('reset_password.php', {
			callback: function (response) {
                if (response == 'EXPIRED') {
                    showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
                } else if (response == 'DONE') {
                    showMessage ('完了しました', 'green', 'パスワードが変更されました。', loginURL);
                } else {
                    showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。');
                }
			},
			content: "user="+user+"&signature="+signature+"&expires="+expires+"&new="+newPassword,
			withCredentials: false
		});
	}
});