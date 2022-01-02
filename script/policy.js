// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/policy') && !debug) {
		window.location.href = 'https://featherine.com/policy';
		return 0;
	}
	
	appearanceSwitching();
	
	handshake (function (){
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (checkXHRStatus (this.status)) {
				if (this.readyState == 4) {
					var responseText = this.responseText;
					if (responseText.includes('/var/www')) {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL, true);
						return false;
					} else if (responseText.includes('SERVER ERROR:')) {
						showMessage ('エラーが発生しました', 'red', responseText, loginURL, true);
						return false;
					} else if (responseText == 'APPROVED') {
						goTo ('info');
					} else if (responseText == 'AUTHENTICATION FAILED') {
						document.getElementsByTagName("body")[0].classList.remove("hidden");
						var scrollID = window.location.hash;
						if (scrollID != '') {
							var elem = document.getElementById(scrollID.substr(1));
							if (elem) {
								elem.scrollIntoView({
									behavior: 'smooth'
								});
							}
						}
					} else {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL, true);
					}
				}
			}
		};
		addXHROnError(xmlhttp);
		xmlhttp.open("POST", serverURL + "/authenticate.php",true);
		xmlhttp.withCredentials = true;
		xmlhttp.send();
	});
	
});
