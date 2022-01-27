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
	var expiredMessage = mainLocal.expiredMessage;

	
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

	if (user == null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
		if (debug) {
			document.body.classList.remove("hidden");
		} else {
			window.location.href = loginURL;
		}
		return;
	}
	
	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		window.location.href = loginURL;
		return;
	}

	if (expires == null || !/^[0-9]+$/.test(expires)) {
		window.location.href = loginURL;
		return;
	}

    sendServerRequest('reset_password.php', {
        callback: function (response) {
            if (response == 'EXPIRED') {
                showMessage (expiredMessage);
            } else if (response != 'APPROVED') {
                showMessage ();
            } else {
				newPasswordInput.addEventListener('keydown', function (event) {
					if (event.key === "Enter") {
						submitRequest ();
					}
				});
				newPasswordConfirmInput.addEventListener('keydown', function (event) {
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

		if (newPassword=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/.test(newPassword)) {
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
                    showMessage (expiredMessage);
                } else if (response == 'DONE') {
                    showMessage ({
						title: '完了しました',
						message: 'パスワードが変更されました。',
						color: 'green',
						url: loginURL
					});
                } else {
                    showMessage ();
                }
			},
			content: "user="+user+"&signature="+signature+"&expires="+expires+"&new="+newPassword,
			withCredentials: false
		});
	}
});