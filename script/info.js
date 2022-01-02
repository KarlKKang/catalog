// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/info') && !debug) {
		window.location.href = 'https://featherine.com/info';
		return 0;
	}
	
	appearanceSwitching();
	
	document.getElementById('nav-btn').addEventListener('click', function () {
		navUpdate ();
	});

	document.getElementById('nav-menu-content-1').addEventListener('click', function () {
		goTo('top');
	});
	document.getElementById('nav-menu-content-2').addEventListener('click', function () {
		goTo('account');
	});
	document.getElementById('nav-menu-content-3').addEventListener('click', function () {
		goTo('info');
	});
	document.getElementById('nav-menu-content-4').addEventListener('click', function () {
		logout(function () {window.location.href = redirect (loginURL);});
	});
	
	handshake (function (){
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (checkXHRResponse (this)) {
				if (this.responseText == 'APPROVED') {
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
					return false;
				}
			}
		};
		addXHROnError(xmlhttp);
		xmlhttp.open("POST", serverURL + "/authenticate.php",true);
		xmlhttp.withCredentials = true;
		xmlhttp.send();
	});
});
