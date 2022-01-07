// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var getURLParam = mainLocal.getURLParam;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var loginURL = mainLocal.loginURL;
	var passwordStyling = mainLocal.passwordStyling;
	
	if (!window.location.href.startsWith('https://featherine.com/register') && !debug) {
		window.location.href = 'https://featherine.com';
		return;
	}
	
	appearanceSwitching();
	
	var submitButton = document.getElementById('submit-button');
	var usernameInput = document.getElementById('username');
	var passwordInput = document.getElementById('password');
	var passwordConfirmInput = document.getElementById('password-confirm');
	
	var param = getURLParam ('p');
	var signature = getURLParam ('signature');

	if (param == null || param.match(/^[a-zA-Z0-9~_-]+$/)===null) {
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

    sendServerRequest('register.php', {
        callback: function (response) {
            if (response == 'EXPIRED') {
                showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
            } else if (response == 'SPECIAL') {
                showMessage ('リクエストは拒否されました', 'red', '現在、一般登録を受け付けています。ボタンをクリックして登録ページに移動してください。', 'special_register'+(debug?'.html':''));
            } else if (response == 'APPROVED') {
				usernameInput.addEventListener('keydown', function () {
					if (event.key === "Enter") {
						register ();
					}
				});
				passwordInput.addEventListener('keydown', function () {
					if (event.key === "Enter") {
						register ();
					}
				});
				passwordConfirmInput.addEventListener('keydown', function () {
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
                showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。');
            }
        },
        content: "p="+param+"&signature="+signature,
        withCredentials: false
    });

	function register () {
		var warningElem = document.getElementById('warning');
		
		submitButton.disabled = true;

		var username = usernameInput.value;
		var password = passwordInput.value;
		var passwordConfirm = passwordConfirmInput.value;

		if (username == '') {
			warningElem.innerHTML = 'ユーザー名を入力してください。';
			warningElem.classList.remove('hidden');
			submitButton.disabled = false;
			return;
		}

		if (password=='' || password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
			warningElem.innerHTML = 'パスワードが要件を満たしていません。';
			warningElem.classList.remove('hidden');
			submitButton.disabled = false;
			return;
		} else if (password!=passwordConfirm) {
			warningElem.innerHTML = '新しいパスワードと新しいパスワード(確認)が一致しません。';
			warningElem.classList.remove('hidden');
			submitButton.disabled = false;
			return;
		} else {
			var hash = forge.md.sha512.sha256.create();
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
                    showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
                } else if (response == 'USERNAME DUPLICATED') {
                    warningElem.innerHTML = 'このユーザー名は既に使われています。 別のユーザー名を入力してください。';
                    warningElem.classList.remove('hidden');
                    submitButton.disabled = false;
                } else if (response == 'DONE') {
                    showMessage ('完了しました', 'green', 'アカウントが登録されました。', loginURL);
                } else {
                    showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。');
                }
			},
			content: "p="+param+"&signature="+signature+"&user="+encodeURIComponent(JSON.stringify(user)),
			withCredentials: false
		});
	}
});