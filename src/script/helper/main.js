import {
	serverURL,
	cdnURL,
	debug,
	topURL,
	loginURL
} from './constant.js';

export {topURL, loginURL, serverURL, cdnURL, debug};

import {keyExists, getHref} from './javascript_wrapper.js';
export {keyExists, getHref};

import {default as message} from './message.js';
export {message};

//////////////////////////////////////// Helper functions ////////////////////////////////////////

//////////////////////////////////////// Dependencies: none
export function getURLParam (name) {
	var urlObj = new URL(window.location.href);
	return urlObj.searchParams.get(name);
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
	
//////////////////////////////////////// Dependencies: message
export function addXHROnError (xmlhttp) {
	xmlhttp.onerror = function () {
		message.show (message.template.param.server.connectionError);
	};
}
////////////////////////////////////////
	
//////////////////////////////////////// Dependencies: message, logout
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
		} else if (status == 429) {
			message.show (message.template.param.server['429']);
		} else if (status == 503) {
			message.show (message.template.param.server['503']);
		} else if (status == 500 || status == 400) {
			var responseText = response.responseText;
			if (responseText.startsWith('500 Internal Server Error') || responseText.startsWith('400 Bad Request')) {
				message.show (message.template.param.server['400And500'](responseText));
			}
			else {
				message.show ();
			}
		} else if (status == 403) {
			if (response.responseText != 'CRAWLER') {
				message.show (message.template.param.server[403]);
			}
		} else if (status == 404 && response.responseText == 'REJECTED') {
			window.location.replace(topURL);
		} else {
			message.show (message.template.param.server.connectionError);
		}
		return false;
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

//////////////////////////////////////// Dependencies: sendServerRequest, message
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
				message.show();
			}
		}
	});
}
////////////////////////////////////////

//////////////////////////////////////// Dependencies: sendServerRequest, debug, message
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
                message.show();
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
export function onScreenConsoleOutput (txt) {
	var onScreenConsole = document.getElementById('on-screen-console');
	if (onScreenConsole) {
		var date = new Date();
		onScreenConsole.value += (date.getHours()<10 ? '0'+date.getHours() : date.getHours()) + ':' + (date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes()) + ':' + (date.getSeconds()<10 ? '0'+date.getSeconds() : date.getSeconds()) + '   ' + txt + '\r\n';
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
		onError: function(errorMessage, elm, xhr, url) {
			if (window.location.href != topURL + '/message' && !debug) {
				message.show(message.template.param.cssVarError(errorMessage));
			}
		},
		onWarning: function(errorMessage) {
			console.log(errorMessage);
		}
	});
}

//////////////////////////////////////// Dependencies: none
var sha512 = null;
export async function hashPassword (password) {
	if (sha512 === null) {
		try {
			({default: sha512} = await import(
				/* webpackChunkName: "sha512" */
				/* webpackExports: ["default"] */
				'node-forge/lib/sha512'
			));
		} catch (e) {
			message.show(message.template.param.moduleImportError(e));
			return;
		}
	}
	
	var hash = sha512.sha256.create();
	hash.update(password);
	return hash.digest().toHex();
}