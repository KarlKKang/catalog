// JavaScript Document
import "core-js";
import {
	debug,
	sendServerRequest,
	showMessage,
	loginURL,
	passwordStyling,
	clearCookies
} from './helper/main.js';
import sha512 from 'node-forge/lib/sha512';

window.addEventListener("load", function(){
	clearCookies();
	
	if (!window.location.href.startsWith('https://featherine.com/special_register') && !debug) {
		window.location.replace('https://featherine.com/special_register');
		return;
	}
	
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
                emailInput.addEventListener('keydown', function (event) {
                    if (event.key === "Enter") {
                        register ();
                    }
                });
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
            } else if (response == 'REJECTED') {
				showMessage ({
					title: 'リクエストは拒否されました',
					message: '現在、このページでの新規登録は受け付けておりません。',
					url: loginURL
				});
            } else {
                showMessage ();
            }
		},
		content: "status_only=true",
		withCredentials: false
	});
}
	
function register () {
	disableAllInputs(true);
	
	var warningElem = document.getElementById('warning');
	
	var email = emailInput.value;
	var username = usernameInput.value;
	var password = passwordInput.value;
	var passwordConfirm = passwordConfirmInput.value;
	
	if (email == '' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
		warningElem.innerHTML = '有効なメールアドレスを入力してください。';
		warningElem.classList.remove('hidden');
		disableAllInputs(false);
		return;
	}
	
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
		email: email,
		username: username,
		password: password
	};
	
	sendServerRequest('special_register.php', {
		callback: function (response) {
            if (response == 'REJECTED') {
                showMessage ({
					title: 'リクエストは拒否されました',
					message: '現在、このページでの新規登録は受け付けておりません。',
					url: loginURL
				});
            } else if (response == 'INVALID FORMAT') {
                warningElem.innerHTML = '有効なメールアドレスを入力してください。';
                warningElem.classList.remove('hidden');
                disableAllInputs(false);
            }else if (response == 'ALREADY REGISTERED') {
                warningElem.innerHTML = 'このメールアドレスはすでに登録済みです。';
                warningElem.classList.remove('hidden');
                disableAllInputs(false);
            } else if (response == 'USERNAME DUPLICATED') {
                warningElem.innerHTML = 'このユーザー名は既に使われています。 別のユーザー名を入力してください。';
                warningElem.classList.remove('hidden');
                disableAllInputs(false);
            } else if (response == 'DONE') {
                showMessage ({
					title: '送信されました',
					message: '確認メールが送信されました。届くまでに時間がかかる場合があります。',
					color: 'green',
					url: loginURL,
					logout: true
				});
            } else {
                showMessage ();
            }
		},
		content: "user="+encodeURIComponent(JSON.stringify(user)),
		withCredentials: false
	});
}
	
function disableAllInputs(disabled) {
	submitButton.disabled = disabled;
	usernameInput.disabled = disabled;
	passwordInput.disabled = disabled;
	passwordConfirmInput.disabled = disabled;
	emailInput.disabled = disabled;
}
	
});