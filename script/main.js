// JavaScript Document
var topURL = 'https://featherine.com';
topURL = 'index.html';
var rootURL = '';
var loginURL = 'https://login.featherine.com';
loginURL = 'login.html';
var serverURL = 'https://server.featherine.com';
var debug = true;

var user;
var signature = getCookie('signature');
var expires = getCookie('expires');

function start (currentPage) {
	var email = getCookie('email');
	var password = getCookie('password');

	if (email == '' || password=='' || signature=='' || expires=='') {
		if (currentPage != 'login' && currentPage != 'request_password_reset' && currentPage != 'special_register') {
			logout ();
		} else {
			document.getElementsByTagName("body")[0].style.display = "block";
		}
		return 0;
	}

	if (parseInt(expires)*1000<Date.now() || password.match(/^[a-f0-9]{64}$/)===null) {
		if (currentPage != 'login' && currentPage != 'request_password_reset' && currentPage != 'special_register') {
			logout ();
		} else {
			document.getElementsByTagName("body")[0].style.display = "block";
		}
		return 0;
	}
	
	handshake ();

	user = {
		email: email,
		password: password
	};

	if (currentPage == 'login' || currentPage == 'request_password_reset' || currentPage == 'special_register') {
		window.location.href = redirect(topURL);
	} else {
		document.getElementsByTagName("body")[0].style.display = "block";
		initialize ();
	}
}

function getURLParam (param) {
	var url = window.location.href;
	url = new URL(url);
	param = url.searchParams.get(param);
	return param;
}

function redirect (url) {
	var ep = getURLParam ('ep');
	var series = getURLParam ('series');
	if (series == null) {
		return url;
	} else {
		return url + '?series=' + series + '&ep=' + ((ep==null)?'1':ep);
	}
}

function getCookie(cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for(var i = 0; i <ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function logout (goToLogin) {
	if (goToLogin === undefined) {
		goToLogin = true;
	}
	
	document.cookie = "email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/" + (debug?"":"; Domain=.featherine.com");
	document.cookie = "password=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/" + (debug?"":"; Domain=.featherine.com");
	document.cookie = "signature=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/" + (debug?"":"; Domain=.featherine.com");
	document.cookie = "expires=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/" + (debug?"":"; Domain=.featherine.com");
	if (goToLogin)
		window.location.href = redirect (loginURL);
}

function checkXHRResponseText (responseText) {
	if (responseText.includes('AUTHENTICATION FAILED')) {
		logout(true);
		return false;
	} else if (responseText.includes('SERVER ERROR:')) {
		logout(false);
		showMessage ('エラーが発生しました', 'red', responseText, topURL);
		return false;
	} else if (responseText.includes('/var/www')) {
		logout(false);
		showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL);
		return false;
	} else if (responseText.includes('NOT FOUND')) {
		window.location.href = topURL;
		return false;
	} else {
		return true;
	}
}

function checkXHRStatus (status) {
	if (status == 200) 
		return true;
	else if (status != 0) {
		showMessage ("サーバーに接続できません", "red", "後でもう一度やり直してください。", null);
		return false;
	} else {
		return false;
	}
}

function passwordStyling (element) {
	if (element.value == '') {
		element.classList.remove('password-font');
	} else {
		element.classList.add('password-font');
	}
}

function checkXHRResponse (response) {
	if (checkXHRStatus (response.status)) {
		if (checkXHRResponseText (response.responseText))
			return true;
	}
	return false;
}

function navUpdate () {
	document.getElementById('nav-btn').classList.toggle('active');
	var menu = document.getElementById('nav-menu');
	
	if (document.getElementById('nav-btn').classList.contains('active')) {
		menu.style.visibility = "visible";
		menu.style.opacity = 1;
	} else {
		menu.style.opacity = 0;
		setTimeout (function () {
			menu.style.visibility = "hidden";
		}, 300);
	}
}

function goTo (page) {
	if (page == 'top') {
		window.location.href = topURL;
	} else if (page == 'account') {
		window.location.href = rootURL + 'account.html';
	} else if (page == 'info') {
		window.location.href = rootURL + 'info.html?nav=true';
	} else if (page == 'special_register') {
		window.location.href = rootURL + 'special_register.html';
	}
}

function openWindow (page) {
	if (page == 'top') {
		window.open (topURL);
	} else if (page == 'account') {
		window.open (rootURL + 'account.html');
	} else if (page == 'info') {
		window.open (rootURL + 'info.html');
	}
}

function showMessage (title, color, message, url) {
	var param = {
		title: title,
		titleColor: color,
		message: message,
		url: url,
		htmlTitle: document.title
	};
	
	window.location.href = rootURL + 'message.html?p=' + encodeURIComponent(JSON.stringify(param));
}

function handshake () {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				if (this.responseText == "IN MAINTENANCE") {
					showMessage ("メンテナンス中", "red", "後でもう一度やり直してください。", null);
				} else if (!this.responseText.includes("OK")) {
					showMessage ("サーバーでエラーが発生しました", "red", "後でもう一度やり直してください。", null);   
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/handshake.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send();
}
