// JavaScript Document
var topURL = 'https://featherine.com';
topURL = 'index.html';
var loginURL = 'https://login.featherine.com';
loginURL = 'login.html';
var serverURL = 'https://server.featherine.com';
var debug = true;

function start (currentPage, callback) {
	if (callback === undefined) {
		callback = function () {return 0;};
	}
	
	handshake (function () {
		if (currentPage == 'login' || currentPage == 'request_password_reset' || currentPage == 'special_register') {
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (this.readyState == 4) {
					if (checkXHRStatus (this.status)) {
						if (this.responseText == "PASSED") {
							window.location.href = redirect(topURL);
						} else if (this.responseText == "AUTHENTICATION FAILED") {
							callback ();
						} else {
							showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL, false);
						}
					}
				}
			};
			xmlhttp.open("POST", serverURL + "/check_cookies.php",true);
			xmlhttp.withCredentials = true;
			xmlhttp.send();
		} else {
			callback ();
		}
	});
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
	var format = getURLParam ('format');
	var timestamp = getURLParam ('timestamp');
	if (series == null) {
		return url;
	} else {
		return url+'?series='+series+'&ep='+((ep==null)?'1':ep)+((format==null)?'':('&format='+format))+((timestamp==null)?'':('&timestamp='+timestamp));
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

function logout (callback) {
	if (callback === undefined) {
		callback = function () {return 0;};
	}
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (this)) {
				if (this.responseText=='DONE') {
					callback ();
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL, false);
					return false;
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/logout.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.send();
}

function checkXHRResponse (response) {
	if (checkXHRStatus (response.status)) {
		if (checkXHRResponseText (response.responseText))
			return true;
	}
	return false;
}

function checkXHRResponseText (responseText) {
	if (responseText.includes('/var/www')) {
		showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL, true);
		return false;
	} else if (responseText.includes('SERVER ERROR:')) {
		showMessage ('エラーが発生しました', 'red', responseText, loginURL, true);
		return false;
	} else if (responseText=='AUTHENTICATION FAILED') {
		logout(function () {window.location.href = redirect (loginURL);});
		return false;
	} else if (responseText=='NOT FOUND' || responseText=='SESSION ENDED') {
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

function navUpdate () {
	document.getElementById('nav-btn').classList.toggle('active');
	var menu = document.getElementById('nav-menu');
	
	if (document.getElementById('nav-btn').classList.contains('active')) {
		menu.classList.remove('invisible');
		menu.classList.remove('transparent');
	} else {
		menu.classList.add('transparent');
		setTimeout (function () {
			menu.classList.add('invisible');
		}, 300);
	}
}

function goTo (page) {
	if (page == 'top') {
		window.location.href = topURL;
	} else {
		window.location.href = page+(debug?'.html':'');
	}
}

function showMessage (title, color, message, url, logout) {
	if (logout === undefined) {
		logout = false;
	}
	var param = {
		title: title,
		titleColor: color,
		message: message,
		url: url,
		htmlTitle: document.title,
		logout: logout
	};
	
	window.localStorage.setItem('message-param', JSON.stringify(param));
	window.location.href = 'message'+(debug?'.html':'');
}

function handshake (callback) {
	if (callback === undefined) {
		callback = function () {return 0;};
	}
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				if (this.responseText == "IN MAINTENANCE") {
					showMessage ("メンテナンス中", "red", "後でもう一度やり直してください。", null);
				} else if (this.responseText == "OK") {
					callback();
				} else {
					showMessage ("サーバーでエラーが発生しました", "red", "後でもう一度やり直してください。", null);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/handshake.php",true);
	xmlhttp.send();
}
