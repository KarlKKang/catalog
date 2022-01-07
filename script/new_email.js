// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var loginURL = mainLocal.loginURL;
	var topURL = mainLocal.topURL;
	var getURLParam = mainLocal.getURLParam;
	
	if (!window.location.href.startsWith('https://featherine.com/new_email') && !debug) {
		window.location.href = 'https://featherine.com';
		return;
	}
	
	appearanceSwitching();
	
	var newEmailInput = document.getElementById('new-email');
	var submitButton = document.getElementById('submit-button');
	
	var param = getURLParam ('p');
	var signature = getURLParam ('signature');

	
	if (param == null || param.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		if (debug) {
			document.body.classList.remove("hidden");
		} else {
			window.location.href = topURL;
		}
		return;
	}
	if (signature == null || signature.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = topURL;
		return;
	}

    sendServerRequest('verify_email_change.php', {
        callback: function (response) {
            if (response == 'EXPIRED') {
                showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
            } else if (response == 'APPROVED') {
				newEmailInput.addEventListener('keydown', function () {
					if (event.key === "Enter") {
						submitRequest ();
					}
				});

				submitButton.addEventListener('click', function () {
					submitRequest ();
				});
                document.body.classList.remove("hidden");
            } else {
                showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。');
            }
        },
        content: "p="+param+"&signature="+signature,
        withCredentials: false
    });


	function submitRequest () {
		var warningElem = document.getElementById('warning');
		
		submitButton.disabled = true;
		var newEmail = newEmailInput.value;

		if (newEmail == '' || newEmail.match(/^[^\s@]+@[^\s@]+$/)===null) {
			warningElem.innerHTML = '有効なメールアドレスを入力してください。';
			warningElem.classList.remove('hidden');
			submitButton.disabled = false;
			return;
		}
		
		sendServerRequest('verify_email_change.php', {
			callback: function (response) {
                if (response == 'EXPIRED') {
                    showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
                } else if (response == 'DUPLICATED') {
                    warningElem.innerHTML = 'このメールアドレスは登録済み、または招待されています。';
                    warningElem.classList.remove('hidden');
                    submitButton.disabled = false;
                } else if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = '有効なメールアドレスを入力してください。';
                    warningElem.classList.remove('hidden');
                    submitButton.disabled = false;
                } else if (response == 'DONE') {
                    showMessage ('送信されました', 'green', '変更を確認するメールが送信されました。届くまでに時間がかかる場合があります。', loginURL);
                } else {
                    showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。');
				}
			},
			content: "p="+param+"&signature="+signature+"&new="+newEmail,
			withCredentials: false
		});
	}
});