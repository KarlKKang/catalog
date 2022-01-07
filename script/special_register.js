// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var loginURL = mainLocal.loginURL;
	var passwordStyling = mainLocal.passwordStyling;
	
	if (!window.location.href.startsWith('https://featherine.com/special_register') && !debug) {
		window.location.href = 'https://featherine.com/special_register';
		return;
	}
	
	appearanceSwitching();
	
	var emailInput = document.getElementById('email');
	var usernameInput = document.getElementById('username');
	var passwordInput = document.getElementById('password');
	var passwordConfirmInput = document.getElementById('password-confirm');
	var submitButton = document.getElementById('submit-button');
	
	initialize ();
	
function initialize () {
	sendServerRequest('special_register.php', {
		callback: function (response) {
            if (response == 'APPROVED' || debug) {
                emailInput.addEventListener('keydown', function () {
                    if (event.key === "Enter") {
                        register ();
                    }
                });
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
            } else if (response == 'REJECTED') {
				showMessage ('リクエストは拒否されました', 'red', '現在、このページでの新規登録は受け付けておりません。', loginURL);
            } else {
                showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。');
            }
		},
		content: "status_only=true",
		withCredentials: false
	});
}
	
function register () {
	var warningElem = document.getElementById('warning');
	
	submitButton.disabled = true;
	
	var email = emailInput.value;
	var username = usernameInput.value;
	var password = passwordInput.value;
	var passwordConfirm = passwordConfirmInput.value;
	
	if (email == '' || email.match(/^[^\s@]+@[^\s@]+$/)===null) {
		warningElem.innerHTML = '有効なメールアドレスを入力してください。';
		warningElem.classList.remove('hidden');
		submitButton.disabled = false;
		return;
	}
	
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
		email: email,
		username: username,
		password: password
	};
	
	sendServerRequest('special_register.php', {
		callback: function (response) {
            if (response == 'REJECTED') {
                showMessage ('リクエストは拒否されました', 'red', '現在、このページでの新規登録は受け付けておりません。', loginURL);
            } else if (response == 'INVALID FORMAT') {
                warningElem.innerHTML = '有効なメールアドレスを入力してください。';
                warningElem.classList.remove('hidden');
                submitButton.disabled = false;
            }else if (response == 'ALREADY REGISTERED') {
                warningElem.innerHTML = 'このメールアドレスはすでに登録済みです。';
                warningElem.classList.remove('hidden');
                submitButton.disabled = false;
            } else if (response == 'USERNAME DUPLICATED') {
                warningElem.innerHTML = 'このユーザー名は既に使われています。 別のユーザー名を入力してください。';
                warningElem.classList.remove('hidden');
                submitButton.disabled = false;
            } else if (response == 'DONE') {
                showMessage ('送信されました', 'green', '確認メールが送信されました。届くまでに時間がかかる場合があります。', loginURL, true);
            } else {
                showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。');
            }
		},
		content: "user="+encodeURIComponent(JSON.stringify(user)),
		withCredentials: false
	});
}
});