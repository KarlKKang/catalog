// JavaScript Document

function generateEP () {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			checkEP(this.responseXML);
		}
	};
	xhttp.open("GET", "xml/series.xml", true);
	xhttp.send();
}

function checkEP (xml) {
	var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var result='';
	var ids = xml.querySelectorAll('video, image, audio');
	var repeat = true;
	
	while (repeat) {
		repeat = false;
		for (var i = 0; i < 11; i++) {
			result += characters.charAt(Math.floor(Math.random() * 62));
		}

		for (i = 0; i < ids.length; i++) {
			if (ids[i].childNodes[0].nodeValue == result) {
				repeat = true;
				break;
			}
		}
	}
	
	document.getElementById('ep-output').innerHTML = 'EP: ' + result;
}

function generateUser () {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			checkUser(this.responseXML);
		}
	};
	xhttp.open("GET", "xml/user.xml", true);
	xhttp.send();
}

function checkUser (xml) {
	var username = SHA256 (document.getElementById('username').value);
	var password = SHA256 (document.getElementById('password').value);
	var url = document.getElementById('url').value;
	
	var ids = xml.getElementsByTagName('id');
	
	var usrID = generateID (username, password);
	url = encryptAES (url, SHA256 (username + password + usrID));
	url = url.toString();
	
	for (var i = 0; i < ids.length; i++) {
		if (ids[i].childNodes[0].nodeValue == usrID){
			alert ('This account already exist.');
		}
	}
	
	document.getElementById('id-output').innerHTML = 'USER ID: ' + usrID;
	document.getElementById('url-output').innerHTML = 'URL: ' + url;
}