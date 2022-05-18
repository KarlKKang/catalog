// JavaScript Document
import "core-js";
import {
	debug,
	sendServerRequest,
	showMessage,
	loginURL,
	topURL,
	getURLParam,
	expiredMessage,
	clearCookies
} from './helper/main.js';

window.addEventListener("load", function(){
	clearCookies();
	
	if (!window.location.href.startsWith('https://featherine.com/new_email') && !debug) {
		window.location.replace(topURL);
		return;
	}
		
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
		disableAllInputs(true);
		
		var warningElem = document.getElementById('warning');
		var newEmail = newEmailInput.value;

		if (newEmail == '' || !/^[^\s@]+@[^\s@]+$/.test(newEmail)) {
			warningElem.innerHTML = '有効なメールアドレスを入力してください。';
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		}
		
		sendServerRequest('verify_email_change.php', {
			callback: function (response) {
                if (response == 'EXPIRED') {
                    showMessage (expiredMessage);
                } else if (response == 'DUPLICATED') {
                    warningElem.innerHTML = 'このメールアドレスは登録済み、または招待されています。';
                    warningElem.classList.remove('hidden');
                    disableAllInputs(false);
                } else if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = '有効なメールアドレスを入力してください。';
                    warningElem.classList.remove('hidden');
                    disableAllInputs(false);
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
	
	function disableAllInputs(disabled) {
		submitButton.disabled = disabled;
		newEmailInput.disabled = disabled
	}
});