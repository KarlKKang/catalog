// JavaScript Document

const serverURL = 'https://server.featherine.com';
const cdnURL = 'https://cdn.featherine.com';
	
const debug = process.env.NODE_ENV !== 'production';

const topURL = debug?'index.html':'https://featherine.com';
const loginURL = debug?'login.html':'https://login.featherine.com';
	
var expiredMessage = {
	title: '期限が切れています',
	message: 'もう一度やり直してください。',
	url: loginURL
};

export {topURL, loginURL, serverURL, cdnURL, debug, expiredMessage};


//////////////////////////////////////// Javascript/DOM interfaces ////////////////////////////////////////
//////////////////////////////////////// Dependencies: none
export function keyExists (obj, key) {
	return obj.hasOwnProperty(key);
}
////////////////////////////////////////


//////////////////////////////////////// Helper functions ////////////////////////////////////////
//////////////////////////////////////// Dependencies: none
export function getURLParam (name) {
	var url = window.location.href;
	url = new URL(url);
	return url.searchParams.get(name);
}
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: getURLParam
export function getSeriesID () {
	var url = window.location.href + '?';
	if (url.startsWith(topURL + '/bangumi/')) {
		var start = (topURL+'/bangumi/').length;
		var end = url.indexOf('?');
		return url.slice(start, end);
	} else {
		return getURLParam('series')
	}
}
////////////////////////////////////////

//////////////////////////////////////// Dependencies: getURLParam, getSeriesID
export function redirect (url) {
	var ep = getURLParam ('ep');
	var series = getSeriesID();
	var format = getURLParam ('format');
	var keywords = getURLParam ('keywords');
	if (series == null || !/^[a-zA-Z0-9~_-]{8,}$/.test(series)) {
		return url+((keywords==null)?'':'?keywords='+keywords);
	} else {
		if (url == topURL+'/bangumi/') {
			var separator = '?';
			url += series;
			if (ep!=null && ep!='1') {
				url += separator + 'ep=' + ep;
				separator = '&';
			} 
			if (format!=null && format!='1') {
				url += separator + 'format=' + format;
			}
			return url;
		} else {
			return url+'?series='+series+((ep!=null && ep!='1')?('&ep='+ep):'')+((format!=null && format!='1')?('&format='+format):'');
		}
	}
}
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: none
export function showMessage (param) {
	if (param === undefined) {
		param = {};
	}
	
	if (!keyExists(param, 'title')) {
		param.title = 'エラーが発生しました';
	}
	if (!keyExists(param, 'message')) {
		param.message = '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。';
	}
	if (!keyExists(param, 'color')) {
		param.color = 'red';
	}
	if (!keyExists(param, 'logout')) {
		param.logout = false;
	}
	if (!keyExists(param, 'url')) {
		param.url = null;
	}
	
	param.htmlTitle = document.title;
	document.cookie = 'local-message-param='+encodeURIComponent(JSON.stringify(param))+';max-age=86400;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
	window.location.replace(debug?'message.html':(topURL+'/message'));
}
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: showMessage
export function addXHROnError (xmlhttp) {
	xmlhttp.onerror = function () {
		showMessage ({
			title: "サーバーに接続できません",
			message: "数分待ってから、もう一度お試しください。このエラーが続く場合は、管理者にお問い合わせください。"
		});
	};
}
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: showMessage, logout
export function checkXHRStatus (response) {
	var status = response.status;
	if (response.readyState == 4) {
		if (status == 200) {
			return true;
		} else if (status == 401) {
			if (response.responseText == 'SESSION ENDED')
				window.location.href = topURL;
			else if (response.responseText == 'INSUFFICIENT PERMISSIONS')
				window.location.replace(topURL);
			else {
				logout(function () {
					window.location.replace(redirect(loginURL));
				});
			}	
			return false;
		} else if (status == 429) {
			showMessage ({
				title: "429 Too Many Requests",
				message: "サーバーにリクエストを送信する頻度が高すぎる。数分待ってから、もう一度お試しください。"
			});
			return false;
		} else if (status == 503) {
			showMessage ({
				title: "メンテナンス中",
				message: "ご不便をおかけして申し訳ありません。後ほどもう一度お試しください。",
				color: 'orange'
			});
			return false;
		} else if (status == 500 || status == 400) {
			var responseText = response.responseText;
			if (responseText.startsWith('500 Internal Server Error') || responseText.startsWith('400 Bad Request'))
				showMessage ({
					message: 'サーバーからの応答：' + responseText + '<br>このエラーが続く場合は、管理者にお問い合わせください。'
				});
			else
				showMessage ();
			return false;
		} else if (status == 403) {
			if (response.responseText != 'CRAWLER') {
				showMessage ({
					message: "サーバーがリクエストを拒否しました。"
				});
			}
			return false;
		} else if (status == 404) {
			if (response.responseText == 'REJECTED')
				window.location.replace(topURL);
			else {
				showMessage ({
					title: "サーバーに接続できません",
					message: "数分待ってから、もう一度お試しください。このエラーが続く場合は、管理者にお問い合わせください。"
				});
			}
			return false;
		} else {
			showMessage ({
				title: "サーバーに接続できません",
				message: "数分待ってから、もう一度お試しください。このエラーが続く場合は、管理者にお問い合わせください。"
			});
			return false;
		}
	} else {
		return false;
	}
}
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: checkXHRStatus, addXHROnError
export function sendServerRequest (uri, options) {
	if (!keyExists(options, 'callback')) {
		options.callback = function () {return;};
	}
	if (!keyExists(options, 'content')) {
		options.content = '';
	}
	if (!keyExists(options, 'withCredentials')) {
		options.withCredentials = true;
	}
	if (!keyExists(options, 'method')) {
		options.method = 'POST';
	}
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (checkXHRStatus(this)) {
			options.callback(this.responseText);
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open(options.method, serverURL + "/" + uri, true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.withCredentials = options.withCredentials;
	xmlhttp.send(options.content);
}
////////////////////////////////////////

//////////////////////////////////////// Dependencies: sendServerRequest, showMessage
export function authenticate (callback) {
	var successful = function () {return;};
	var failed = function () {return;};
	if (keyExists(callback, 'successful')) {
		successful = callback.successful;
	}
	if (keyExists(callback, 'failed')) {
		failed = callback.failed;
	}
	
	sendServerRequest('get_authentication_state.php', {
		callback: function (response) {
			if (response == "APPROVED") {
				successful();
			} else if (response == "FAILED") {
				failed();
			} else {
				showMessage ();
			}
		}
	});
}
////////////////////////////////////////

//////////////////////////////////////// Dependencies: sendServerRequest, debug, showMessage
export function logout (callback) {
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
                showMessage ();
                return false;
            }
		}
	});
}
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: none
export function getCookie (cname) {
	var name = cname + "=";
	// var decodedCookie = decodeURIComponent(document.cookie);
	var decodedCookie = document.cookie;
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
	return null;
}
////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
export function passwordStyling (element) {
	if (element.value == '') {
		element.classList.remove('password-font');
	} else {
		element.classList.add('password-font');
	}
}
////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
export function navUpdate () {
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
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: navUpdate, logout
export function navListeners () {
	document.getElementById('nav-menu-content').innerHTML = '<p><span id="nav-menu-content-1">ライブラリ／LIBRARY</span></p>' +
			'<p><span id="nav-menu-content-2">マイページ／ACCOUNT SETTINGS</span></p>' +
			'<p><span id="nav-menu-content-3">ご利用ガイド／INFO</span></p>' +
			'<p><span id="nav-menu-content-4">ログアウト／LOG OUT</span></p>';
	
	document.getElementById('nav-btn').addEventListener('click', function () {
		navUpdate ();
	});
	
	document.getElementById('nav-menu-content-1').addEventListener('click', function () {
		window.location.href = topURL;
	});
	document.getElementById('nav-menu-content-2').addEventListener('click', function () {
		window.location.href = (debug?'account.html':(topURL+'/account'));
	});
	document.getElementById('nav-menu-content-3').addEventListener('click', function () {
		window.location.href = (debug?'info.html':(topURL+'/info'));
	});
	document.getElementById('nav-menu-content-4').addEventListener('click', function () {
		logout(function () {window.location.href = loginURL;});
	});
}
////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
export function secToTimestamp (sec) {
	if (isNaN(sec)) {
		return '--:--';
	}
	var hour = Math.floor(sec/60/60);
	sec = sec - hour*60*60;
	var min = Math.floor(sec/60);
	sec = sec - min*60;

	sec = Math.floor(sec);
	if (sec < 10) {
		sec = '0' + sec;
	}

	if (hour > 0 && min < 10) {
		min = '0' + min;
	}
	
	return ((hour==0)?'':(hour + ':')) + min + ':' + sec;
}
////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
export function onScreenConsoleOutput (message) {
	var onScreenConsole = document.getElementById('on-screen-console');
	if (onScreenConsole) {
		var date = new Date();
		onScreenConsole.value += (date.getHours()<10 ? '0'+date.getHours() : date.getHours()) + ':' + (date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes()) + ':' + (date.getSeconds()<10 ? '0'+date.getSeconds() : date.getSeconds()) + '   ' + message + '\r\n';
	}
}
////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
export  function changeColor (elem, color) {
	elem.classList.remove('color-red');
	elem.classList.remove('color-green');
	elem.classList.remove('color-orange');
	elem.classList.add('color-'+color);
}
////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
export function imageProtection (elem) {
	elem.addEventListener('contextmenu', e => {
		e.preventDefault();
		return false;
	});
	elem.addEventListener('dragstart', e => {
		e.preventDefault();
		return false;
	});
	elem.addEventListener('touchforcechange', e => {
		if (e.changedTouches[0].force > 0.1) {
			e.preventDefault();
			return false;
		}
	});
	elem.addEventListener('touchstart', e => {
		if (e.changedTouches[0].force > 0.1) {
			e.preventDefault();
			return false;
		}
	});
}
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: none
export function concatenateSignedURL (url, credentials, resourceURLOverride) {
	var policy = '';
	if (keyExists(credentials, 'Policy')) {
		policy = credentials['Policy'];
		policy['Statement'][0]['Resource'] = (resourceURLOverride===undefined)?url:resourceURLOverride;
		policy = JSON.stringify(policy);
		policy = btoa(policy);
		policy = policy.replace(/\+/g, "-");
		policy = policy.replace(/\=/g, "_");
		policy = policy.replace(/\//g, "~");
		policy = 'Policy=' + policy
	} else {
		policy = 'Expires=' + credentials['Expires']
	}
	return url + '?' + policy + '&Signature=' + credentials['Signature'] + '&Key-Pair-Id=' + credentials['Key-Pair-Id'];
}
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: none
export function encodeCFURIComponent (uri) {
	return encodeURIComponent(uri).replace(/%20/g, "+");
}
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: none
export function disableCheckbox (checkbox, disabled) {
	checkbox.disabled = disabled;
	if (disabled) {
		checkbox.parentNode.classList.add('disabled');
	} else {
		checkbox.parentNode.classList.remove('disabled');
	}
}
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: none
export function clearCookies () {
	if (window.location.href != topURL + '/message' && !debug) {
		document.cookie = 'local-message-param=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
	}
	if (window.location.href != topURL + '/image' && !debug) {
		document.cookie = 'local-image-param=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
	}
}

//////////////////////////////////////// Dependencies: none
export function cssVarWrapper (cssVars) {
	cssVars({
		onError: function(message, elm, xhr, url) {
			if (window.location.href != topURL + '/message' && !debug) {
				showMessage({
					message: "cssの解析に失敗しました。別のブラウザで、もう一度お試しください。<br>" + message
				});
			}
		},
		onWarning: function(message) {
			console.log(message);
		}
	  });
}