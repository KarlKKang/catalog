// JavaScript Document
import {
	debug,
	sendServerRequest,
	showMessage,
	loginURL,
	getURLParam,
	passwordStyling,
	expiredMessage,
	clearCookies
} from './main.js';
import sha512 from 'node-forge/lib/sha512';

window.addEventListener("load", function(){
	clearCookies();

	
	if (!window.location.href.startsWith('https://login.featherine.com/password_reset') && !debug) {
		window.location.replace(loginURL);
		return;
	}
	
	
	var newPasswordInput = document.getElementById('new-password');
	var newPasswordConfirmInput = document.getElementById('new-password-confirm');
	var submitButton = document.getElementById('submit-button');
	
	
	var user = getURLParam ('user');
	var signature = getURLParam ('signature');
	var expires = getURLParam ('expires');

	if (user == null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
		if (debug) {
			document.body.classList.remove("hidden");
		} else {
			window.location.replace(loginURL);
		}
		return;
	}
	
	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		window.location.replace(loginURL);
		return;
	}

	if (expires == null || !/^[0-9]+$/.test(expires)) {
		window.location.replace(loginURL);
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
				submitButton.addEventListener('click', function () {
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
		
		disableAllInputs(true);

		var newPassword = newPasswordInput.value;
		var newPasswordConfirm = newPasswordConfirmInput.value;

		if (newPassword=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(newPassword)) {
			warningElem.innerHTML = 'パスワードが要件を満たしていません。';
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		} else if (newPassword!=newPasswordConfirm) {
			warningElem.innerHTML = '確認再入力が一致しません。';
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		} else {
			var hash = sha512.sha256.create();
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
	
	function disableAllInputs(disabled) {
		submitButton.disabled = disabled;
		newPasswordInput.disabled = disabled;
		newPasswordConfirmInput.disabled = disabled;
	}
});