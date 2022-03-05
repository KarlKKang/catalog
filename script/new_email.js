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
	var expiredMessage = mainLocal.expiredMessage;
	
	if (!window.location.href.startsWith('https://featherine.com/new_email') && !debug) {
		window.location.replace(topURL);
		return;
	}
	
	appearanceSwitching();
	
	var newEmailInput = document.getElementById('new-email');
	var submitButton = document.getElementById('submit-button');
	
	var param = getURLParam ('p');
	var signature = getURLParam ('signature');

	
	if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
		if (debug) {
			document.body.classList.remove("hidden");
		} else {
			window.location.replace(topURL);
		}
		return;
	}
	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		window.location.replace(topURL);
		return;
	}

    sendServerRequest('verify_email_change.php', {
        callback: function (response) {
            if (response == 'EXPIRED') {
                showMessage (expiredMessage);
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
                showMessage ();
            }
        },
        content: "p="+param+"&signature="+signature,
        withCredentials: false
    });


	function submitRequest () {
		var warningElem = document.getElementById('warning');
		
		submitButton.disabled = true;
		var newEmail = newEmailInput.value;

		if (newEmail == '' || !/^[^\s@]+@[^\s@]+$/.test(newEmail)) {
			warningElem.innerHTML = '有効なメールアドレスを入力してください。';
			warningElem.classList.remove('hidden');
			submitButton.disabled = false;
			return;
		}
		
		sendServerRequest('verify_email_change.php', {
			callback: function (response) {
                if (response == 'EXPIRED') {
                    showMessage (expiredMessage);
                } else if (response == 'DUPLICATED') {
                    warningElem.innerHTML = 'このメールアドレスは登録済み、または招待されています。';
                    warningElem.classList.remove('hidden');
                    submitButton.disabled = false;
                } else if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = '有効なメールアドレスを入力してください。';
                    warningElem.classList.remove('hidden');
                    submitButton.disabled = false;
                } else if (response == 'DONE') {
                    showMessage ({
						title: '送信されました',
						message: '変更を確認するメールが送信されました。届くまでに時間がかかる場合があります。',
						color: 'green',
						url: loginURL
					});
                } else {
                    showMessage ();
				}
			},
			content: "p="+param+"&signature="+signature+"&new="+newEmail,
			withCredentials: false
		});
	}
});