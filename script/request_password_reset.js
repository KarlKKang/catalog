// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var loginURL = mainLocal.loginURL;
	var topURL = mainLocal.topURL;
	var authenticate = mainLocal.authenticate;
	
	if (!window.location.href.startsWith('https://login.featherine.com/request_password_reset') && !debug) {
		window.location.replace('https://login.featherine.com/request_password_reset');
		return;
	}
	
	appearanceSwitching();
	
	var emailInput = document.getElementById('email');
	var submitButton = document.getElementById('submit-button');
	
	emailInput.addEventListener('keydown', function () {
		if (event.key === "Enter") {
			submitRequest ();
		}
	});
	
	submitButton.addEventListener('click', function () {
		submitRequest ();
	});
	document.getElementById('go-back').getElementsByTagName('span')[0].addEventListener('click', function () {
		window.location.replace(loginURL);
	});
	
	authenticate({
		successful: 
		function () {
			window.location.replace(topURL);
		},
		failed: 
		function () {
			document.body.classList.remove("hidden");
		},
	});
	
	
	function submitRequest () {
		disableAllInputs(true);
		
		var warningElem = document.getElementById('warning');

		var email = emailInput.value;
		if (email=='' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
			warningElem.innerHTML="有効なメールアドレスを入力してください。";
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		}
		
		sendServerRequest('send_password_reset.php', {
			callback: function (response) {
                if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = '有効なメールアドレスを入力してください。';
                    warningElem.classList.remove('hidden');
                    disableAllInputs(false);
                } else if (response == 'DONE') {
                    showMessage ({
						title: '送信されました',
						message: '入力したメールアドレスが正しければ、パスワードを再設定するためのメールを送信されました。届くまでに時間がかかる場合があります。',
						color: 'green',
						url: loginURL
					});
                } else {
                    showMessage ();
                }
			},
			content: "email="+email,
			withCredentials: false
		})
	}
	
	function disableAllInputs(disabled) {
		submitButton.disabled = disabled;
		emailInput.disabled = disabled;
	}
});