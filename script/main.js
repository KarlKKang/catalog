// JavaScript Document

function goHome () {
	window.location.href = 'index.html';
}

function getURLParam (param) {
	var url = window.location.href;
	url = new URL(url);
	param = url.searchParams.get(param);
	return param;
}

function redirect (url) {
	var param = getURLParam ('ep');
	if (param == null) {
		return url;
	} else {
		return url + '?ep=' + param;
	}
}

function SHA256 (message) {
	message = CryptoJS.enc.Utf8.parse(message);
	for (var i = 0; i < 10000; i ++) {
		message = CryptoJS.SHA256(message);
	}
	return CryptoJS.enc.Base64.stringify(message);
}

function generateID (username, password) {
	var usrID = "";
	
	for (var i = 0; i < 100000; i++) {
		usrID = CryptoJS.SHA256 (CryptoJS.enc.Utf8.parse(username + usrID + password));
		usrID = CryptoJS.enc.Base64.stringify(usrID);
	}
	
	return usrID;
}

function decryptAES (encryped, key) {
	
	var message = CryptoJS.AES.decrypt(encryped, key);
	
	return message;
}

function encryptAES (message, key) {
	
	var encrypted = CryptoJS.AES.encrypt(message, key);
	
	return encrypted;
}