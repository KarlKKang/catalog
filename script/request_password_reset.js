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
		window.location.href = 'https://login.featherine.com/request_password_reset';
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
		window.location.href = loginURL;
	});
	
	authenticate({
		successful: 
		function () {
			window.location.href = topURL;
		},
		failed: 
		function () {
			document.body.classList.remove("hidden");
		},
	});
	
	
	function submitRequest () {
		var warningElem = document.getElementById('warning');
		
		submitButton.disabled = true;

		var email = emailInput.value;
		if (email=='' || email.match(/^[^\s@]+@[^\s@]+$/)===null) {
			warningElem.innerHTML="有効なメールアドレスを入力してください。";
			warningElem.classList.remove('hidden');
			submitButton.disabled = false;
			return;
		}
		
		sendServerRequest('send_password_reset.php', {
			callback: function (response) {
                if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = '有効なメールアドレスを入力してください。';
                    warningElem.classList.remove('hidden');
                    submitButton.disabled = false;
                } else if (response == 'DONE') {
                    showMessage ('送信されました', 'green', '入力したメールアドレスが正しければ、パスワードを再設定するためのメールを送信されました。届くまでに時間がかかる場合があります。', loginURL);
                } else {
                    showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。のエラーが続く場合は、管理者にお問い合わせください。');
                }
			},
			content: "email="+email,
			withCredentials: false
		})
	}
});