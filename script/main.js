// JavaScript Document
var main = {};

(function () {
	
var topURL = 'https://featherine.com';
topURL = 'index.html';
main.topURL = topURL;
	
var loginURL = 'https://login.featherine.com';
loginURL = 'login.html';
main.loginURL = loginURL;
	
var serverURL = 'https://server.featherine.com';
main.serverURL = serverURL;
	
var debug = true;
main.debug = debug;

//////////////////////////////////////// Dependencies: none
var getURLParam = function (param) {
	var url = window.location.href;
	url = new URL(url);
	return url.searchParams.get(param);
};
main.getURLParam = getURLParam;
////////////////////////////////////////

//////////////////////////////////////// Dependencies: getURLParam
var redirect = function (url) {
	var ep = getURLParam ('ep');
	var series = getURLParam ('series');
	var format = getURLParam ('format');
	var timestamp = getURLParam ('timestamp');
	if (series == null) {
		return url;
	} else {
		return url+'?series='+series+'&ep='+((ep==null)?'1':ep)+((format==null)?'':('&format='+format))+((timestamp==null)?'':('&timestamp='+timestamp));
	}
};
main.redirect = redirect;
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: none
var showMessage = function (title, color, message, url, logout) {
	if (logout === undefined) {
		logout = false;
	}
	if (url === undefined) {
		url = null;
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
};
main.showMessage = showMessage;
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: showMessage
var addXHROnError = function (xmlhttp) {
	xmlhttp.onerror = function () {
		showMessage ("サーバーに接続できません", "red", "数分待ってから、もう一度試してください。", null);
	};
};
main.addXHROnError = addXHROnError;
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: showMessage, logout
var checkXHRStatus = function (response) {
	var status = response.status;
	if (response.readyState == 4) {
		if (status == 200) {
			return true;
		} else if (status == 401) {
			if (response.responseText == 'SESSION ENDED')
				window.location.href = topURL;
			else {
				logout(function () {
					window.location.href = redirect (loginURL);
				});
			}	
			return false;
		} else if (status == 429) {
			showMessage ("429 Too Many Requests", "red", "サーバーにリクエストを送信する頻度が高すぎる。数分待ってから、もう一度試してください。");
			return false;
		} else if (status == 503) {
			showMessage ("メンテナンス中", "red", "後でもう一度試してください。");
			return false;
		} else if (status == 500 || status == 400) {
			var responseText = response.responseText;
			var message = '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。';
			if (responseText.startsWith('500 Internal Server Error') || responseText.startsWith('400 Bad Request'))
				message = 'サーバーからの応答：' + responseText + '<br>このエラーが続く場合は、管理者にお問い合わせください。';
			showMessage ("エラーが発生しました", "red", message);
			return false;
		} else if (status == 403) {
			showMessage ("エラーが発生しました", "red", "サーバーがリクエストを拒否しました。");
			return false;
		} else if (status == 404) {
			if (response.responseText == 'REQUEST CANNOT BE SATISFIED')
				window.location.href = topURL;
			else {
				showMessage ("サーバーに接続できません", "red", "数分待ってから、もう一度試してください。");
			}	
			return false;
		} else {
			showMessage ("サーバーに接続できません", "red", "数分待ってから、もう一度試してください。");
			return false;
		}
	} else {
		return false;
	}
};
main.checkXHRStatus = checkXHRStatus;
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: checkXHRStatus, addXHROnError
var sendServerRequest = function (uri, options) {
	if (!options.hasOwnProperty('callback')) {
		options.callback = function () {return;};
	}
	if (!options.hasOwnProperty('content')) {
		options.content = '';
	}
	if (!options.hasOwnProperty('withCredentials')) {
		options.withCredentials = true;
	}
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (checkXHRStatus(this)) {
			options.callback(this.responseText);
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open('POST', serverURL + "/" + uri, true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.withCredentials = options.withCredentials;
	xmlhttp.send(options.content);
};
main.sendServerRequest = sendServerRequest;
////////////////////////////////////////
	
/*//////////////////////////////////////// Dependencies: showMessage
var checkXHRResponseText = function (response) {
	var responseText = response.responseText;
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
};
main.checkXHRResponseText = checkXHRResponseText;
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: checkXHRStatus, checkXHRResponseText
var checkXHRResponse = function (response) {
	if (checkXHRStatus (response)) {
		if (checkXHRResponseText (response))
			return true;
	}
	return false;
};
main.checkXHRResponse = checkXHRResponse;
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: checkXHRStatus, sendServerRequest, showMessage
var handshake = function (callback) {
	if (callback === undefined) {
		callback = function () {return 0;};
	}
	sendServerRequest('handshake.php', {
		callback: function () {
			if (checkXHRStatus (this)) {
				if (this.responseText == "IN MAINTENANCE") {
					showMessage ("メンテナンス中", "red", "後でもう一度試してください。", null);
				} else if (this.responseText == "OK") {
					callback();
				} else {
					showMessage ("サーバーでエラーが発生しました", "red", "数分待ってから、もう一度試してください。", null);
				}
			}
		}, 
		withCredentials: false
	});
};
main.handshake = handshake;
////////////////////////////////////////*/

//////////////////////////////////////// Dependencies: sendServerRequest, showMessage
var authenticate = function (callback) {
	var successful = function () {return;};
	var failed = function () {return;};
	if (callback.hasOwnProperty('successful')) {
		successful = callback.successful;
	}
	if (callback.hasOwnProperty('failed')) {
		failed = callback.failed;
	}
	
	sendServerRequest('get_authentication_state.php', {
		callback: function (response) {
			if (response == "APPROVED") {
				successful();
			} else if (response == "FAILED") {
				failed();
			} else {
				showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。');
			}
		}
	});
}
main.authenticate = authenticate;
////////////////////////////////////////

//////////////////////////////////////// Dependencies: sendServerRequest, debug
var logout = function (callback) {
	if (callback === undefined) {
		callback = function () {return;};
	}
	
	sendServerRequest('logout.php', {
		callback: function (response) {
            if (response=='PARTIAL' || response=='DONE') {
                if (debug) {
                    console.log(response);
                }
                callback ();
            } else {
                showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。');
                return false;
            }
		}
	});
};
main.logout = logout;
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: none
var getCookie = function (cname) {
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
};
main.getCookie = getCookie;
////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
var passwordStyling = function (element) {
	if (element.value == '') {
		element.classList.remove('password-font');
	} else {
		element.classList.add('password-font');
	}
};
main.passwordStyling = passwordStyling;
////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
var navUpdate = function () {
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
};
main.navUpdate = navUpdate
////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
var goTo = function (page) {
	if (page == 'top') {
		window.location.href = topURL;
	} else {
		window.location.href = page+(debug?'.html':'');
	}
};
main.goTo = goTo;
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: navUpdate, goTo, logout, redirect
var navListeners = function () {
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
		logout(function () {window.location.href = loginURL;});
	});
};
main.navListeners = navListeners;
////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
var secToTimestamp = function (sec) {
	var hour = Math.floor(sec/60/60);
	sec = sec - hour*60*60;
	var min = Math.floor(sec/60);
	sec = sec - min*60;

	sec = Math.round(sec);
	if (sec < 10) {
		sec = '0' + sec;
	}

	if (hour > 0 && min < 10) {
		min = '0' + min;
	}
	
	return ((hour==0)?'':(hour + ':')) + min + ':' + sec;
};
main.secToTimestamp = secToTimestamp;
////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
var onScreenConsoleOutput = function (message) {
	var onScreenConsole = document.getElementById('on-screen-console');
	if (onScreenConsole) {
		var date = new Date();
		onScreenConsole.value += (date.getHours()<10 ? '0'+date.getHours() : date.getHours()) + ':' + (date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes()) + ':' + (date.getSeconds()<10 ? '0'+date.getSeconds() : date.getSeconds()) + '   ' + message + '\r\n';
	}
};
main.onScreenConsoleOutput = onScreenConsoleOutput;
////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
var appearanceSwitching = function () {
	var bodyElem = document.body;
	var htmlElem = document.documentElement;
	if (window.matchMedia) {
		if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			bodyElem.classList.add('dark-mode');
		}
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
			htmlElem.classList.add('appearance-switching');
			if (e.matches) {
				htmlElem.style.background = 'var(--background-color-dark)';
				bodyElem.classList.add('dark-mode');
			} else {
				htmlElem.style.background = 'var(--background-color)';
				bodyElem.classList.remove('dark-mode');
			}
			setInterval(function () {
				htmlElem.classList.remove('appearance-switching');
			}, 400);
		});
	}
	bodyElem.classList.remove('document-loading');
};
main.appearanceSwitching = appearanceSwitching;
////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
var changeColor = function (elem, color) {
	elem.classList.remove('color-red');
	elem.classList.remove('color-green');
	elem.classList.remove('color-orange');
	elem.classList.add('color-'+color);
};
main.changeColor = changeColor;
////////////////////////////////////////


})();
