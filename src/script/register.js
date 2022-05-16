// JavaScript Document
import {
	debug,
	getURLParam,
	sendServerRequest,
	showMessage,
	loginURL,
	passwordStyling,
	expiredMessage,
	clearCookies
} from './main.js';
import sha512 from 'node-forge/lib/sha512';

window.addEventListener("load", function(){
	clearCookies();
	
	if (!window.location.href.startsWith('https://featherine.com/register') && !debug) {
		window.location.replace(loginURL);
		return;
	}
		
	var submitButton = document.getElementById('submit-button');
	var usernameInput = document.getElementById('username');
	var passwordInput = document.getElementById('password');
	var passwordConfirmInput = document.getElementById('password-confirm');
	
	var param = getURLParam ('p');
	var signature = getURLParam ('signature');

	if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
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

    sendServerRequest('register.php', {
        callback: function (response) {
            if (response == 'EXPIRED') {
                showMessage (expiredMessage);
            } else if (response == 'SPECIAL') {
                showMessage ({
					title: 'リクエストは拒否されました',
					message: '現在、一般登録を受け付けています。ボタンをクリックして登録ページに移動してください。',
					url: 'special_register'+(debug?'.html':'')
				});
            } else if (response == 'APPROVED') {
				usernameInput.addEventListener('keydown', function (event) {
					if (event.key === "Enter") {
						register ();
					}
				});
				passwordInput.addEventListener('keydown', function (event) {
					if (event.key === "Enter") {
						register ();
					}
				});
				passwordConfirmInput.addEventListener('keydown', function (event) {
					if (event.key === "Enter") {
						register ();
					}
				});

				document.getElementsByClassName('link')[0].addEventListener('click', function () {
					window.open ('policy');
				});
				document.getElementsByClassName('link')[1].addEventListener('click', function () {
					window.open ('policy#en');
				});
				document.getElementsByClassName('link')[2].addEventListener('click', function () {
					window.open ('policy#zh-Hant');
				});
				document.getElementsByClassName('link')[3].addEventListener('click', function () {
					window.open ('policy#zh-Hans');
				});

				submitButton.addEventListener('click', function () {
					register ();
				});

				passwordInput.addEventListener('input', function () {
					passwordStyling(this);
				});
				passwordConfirmInput.addEventListener('input', function () {
					passwordStyling(this);
				});
                document.body.classList.remove("hidden");
            } else {
                showMessage ();
            }
        },
        content: "p="+param+"&signature="+signature,
        withCredentials: false
    });

	function register () {
		disableAllInputs(true);
		
		var warningElem = document.getElementById('warning');

		var username = usernameInput.value;
		var password = passwordInput.value;
		var passwordConfirm = passwordConfirmInput.value;

		if (username == '') {
			warningElem.innerHTML = 'ユーザー名を入力してください。';
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		}

		if (password=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(password)) {
			warningElem.innerHTML = 'パスワードが要件を満たしていません。';
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		} else if (password!=passwordConfirm) {
			warningElem.innerHTML = '新しいパスワードと新しいパスワード(確認)が一致しません。';
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		} else {
			var hash = sha512.sha256.create();
			hash.update(password);
			password = hash.digest().toHex();
		}

		var user = {
			username: username,
			password: password
		};

		sendServerRequest('register.php', {
			callback: function (response) {
                if (response == 'EXPIRED') {
                    showMessage (expiredMessage);
                } else if (response == 'USERNAME DUPLICATED') {
                    warningElem.innerHTML = 'このユーザー名は既に使われています。 別のユーザー名を入力してください。';
                    warningElem.classList.remove('hidden');
                    disableAllInputs(false);
                } else if (response == 'DONE') {
                    showMessage ({
						title: '完了しました',
						message: 'アカウントが登録されました。',
						color: 'green',
						url: loginURL
					});
                } else {
                    showMessage ();
                }
			},
			content: "p="+param+"&signature="+signature+"&user="+encodeURIComponent(JSON.stringify(user)),
			withCredentials: false
		});
	}
	
	function disableAllInputs(disabled) {
		submitButton.disabled = disabled;
		usernameInput.disabled = disabled;
		passwordInput.disabled = disabled;
		passwordConfirmInput.disabled = disabled;
	}
});