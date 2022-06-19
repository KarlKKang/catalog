import {
	serverURL,
	cdnURL,
	debug,
	topURL,
	loginURL
} from './env/constant';

export {topURL, loginURL, serverURL, cdnURL, debug};

import * as message from './message/message';
export {message};

//import * as DOM from './DOM';
import {
	d, 
	w, 
	getBody, 
	getHref, 
	getHash, 
	redirect,
	changeURL,
	openWindow,
	getCookie,
	setCookie,
	deleteCookie,
	getTitle,
	setTitle,
	
	getByIdNative,
	getById,
	getDescendantsByClass,
	getByClass,
	getDescendantsByClassAt,
	getByClassAt,
	getDescendantsByTag,
	getByTag,
	getDescendantsByTagAt,
	getByTagAt,
	addClass,
	removeClass,
	setClass,
	toggleClass,
	containsClass,
	getParent,
	insertBefore,
	remove,
	createElement,
	createTextNode,
	addEventListener,
	addEventsListener,
	removeEventListener,
	removeEventsListener,
	getComputedStyle,
	appendChild
} from './DOM';
//export {DOM};
export {
	d, 
	w, 
	getBody, 
	getHref, 
	getHash, 
	redirect,
	changeURL,
	openWindow,
	getCookie,
	setCookie,
	deleteCookie,
	getTitle,
	setTitle,
	
	getByIdNative,
	getById,
	getDescendantsByClass,
	getByClass,
	getDescendantsByClassAt,
	getByClassAt,
	getDescendantsByTag,
	getByTag,
	getDescendantsByTagAt,
	getByTagAt,
	addClass,
	removeClass,
	setClass,
	toggleClass,
	containsClass,
	getParent,
	insertBefore,
	remove,
	createElement,
	createTextNode,
	addEventListener,
	addEventsListener,
	removeEventListener,
	removeEventsListener,
	getComputedStyle,
	appendChild
};

import * as type from '../../type';
export {type};

//////////////////////////////////////// Helper functions ////////////////////////////////////////

////////////////////////////////////////
export function getURLParam (name: string): string | null {
	var urlObj = new URL(getHref());
	return urlObj.searchParams.get(name);
}
////////////////////////////////////////
	
////////////////////////////////////////
export function getSeriesID (): string | null {
	var url = getHref() + '?';
	if (url.startsWith(topURL + '/bangumi/')) {
		var start = (topURL+'/bangumi/').length;
		var end = url.indexOf('?');
		if (start == end) {
			return null;
		}
		return url.slice(start, end);
	} else {
		return getURLParam('series');
	}
}
////////////////////////////////////////

////////////////////////////////////////
export function urlWithParam (url: string) {
	var ep = getURLParam ('ep');
	var series = getSeriesID();
	var format = getURLParam ('format');
	var keywords = getURLParam ('keywords');
	if (series === null || !/^[a-zA-Z0-9~_-]{8,}$/.test(series)) {
		return url + ((keywords === null)?'':'?keywords='+keywords);
	} else {
		if (url == topURL+'/bangumi/') {
			var separator = '?';
			url += series;
			if (ep !== null && ep !== '1') {
				url += separator + 'ep=' + ep;
				separator = '&';
			} 
			if (format !== null && format !== '1') {
				url += separator + 'format=' + format;
			}
			return url;
		} else {
			return url + '?series='+series+((ep !== null && ep !== '1')?('&ep='+ep):'')+((format !== null && format !== '1')?('&format='+format):'');
		}
	}
}
////////////////////////////////////////
	
////////////////////////////////////////
export function addXHROnError (xmlhttp: XMLHttpRequest) {
	xmlhttp.onerror = function () {
		message.show (message.template.param.server.connectionError);
	};
}
////////////////////////////////////////
	
////////////////////////////////////////
export function checkXHRStatus (response: XMLHttpRequest): boolean {
	var status = response.status;
	if (response.readyState == 4) {
		if (status == 200) {
			return true;
		} else if (status == 401) {
			if (response.responseText == 'SESSION ENDED')
				redirect(topURL);
			else if (response.responseText == 'INSUFFICIENT PERMISSIONS')
				redirect(topURL, true);
			else {
				logout(function () {
					redirect(urlWithParam(loginURL), true);
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
			redirect(topURL);
		} else {
			message.show (message.template.param.server.connectionError);
		}
		return false;
	} else {
		return false;
	}
}
////////////////////////////////////////
	
////////////////////////////////////////
interface SendServerRequestOption {
	callback?: Function,
	content?: string,
	withCredentials?: boolean,
	method?: 'POST' | 'GET'
};
export function sendServerRequest (uri: string, options: SendServerRequestOption) {
	if (options.content === undefined) {
		options.content = '';
	}
	if (options.withCredentials === undefined) {
		options.withCredentials = true;
	}
	if (options.method === undefined) {
		options.method = 'POST';
	}
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function () {
		if (checkXHRStatus(this)) {
			if (options.callback === undefined) {
				return;
			}
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

////////////////////////////////////////
export function authenticate (callback: {successful?: Function, failed?: Function}) {
	var successful: Function = function () {return;};
	var failed: Function = function () {return;};
	if (callback.successful !== undefined) {
		successful = callback.successful;
	}
	if (callback.failed !== undefined) {
		failed = callback.failed;
	}
	
	sendServerRequest('get_authentication_state.php', {
		callback: function (response: string) {
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

////////////////////////////////////////
export function logout (callback: Function) {
	if (callback === undefined) {
		callback = function () {return;};
	}
	
	sendServerRequest('logout.php', {
		callback: function (response: string) {
            if (response=='PARTIAL' || response=='DONE') {
                if (debug) {
                    console.log(response);
                }
                callback ();
            } else {
                message.show();
            }
		}
	});
}
////////////////////////////////////////

////////////////////////////////////////
export function passwordStyling (element: HTMLInputElement) {
	function inputChangeHandler () {
		if (element.value === '') {
			removeClass(element, 'password-font');
		} else {
			addClass(element, 'password-font');
		}
	}
	
	var descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value") as PropertyDescriptor; //The object returned is mutable but mutating it has no effect on the original property's configuration.
	var originalSet = descriptor.set;

	// define our own setter
	descriptor.set = function() {
		originalSet!.apply(this, arguments as any);
		inputChangeHandler();
	}

	Object.defineProperty(element, "value", descriptor);

	addEventListener(element, 'input', inputChangeHandler);
	addEventListener(element, 'change', inputChangeHandler);
}
////////////////////////////////////////

////////////////////////////////////////
export function navUpdate () {
	var navBtn = getById('nav-btn');
	toggleClass(navBtn, 'active');
	var menu = getById('nav-menu');
	
	if (containsClass(navBtn, 'active')) {
		removeClass(menu, 'invisible');
		removeClass(menu, 'transparent');
	} else {
		addClass(menu, 'transparent');
		setTimeout (function () {
			addClass(menu, 'invisible');
		}, 300);
	}
}
////////////////////////////////////////
	
////////////////////////////////////////
export function navListeners () {
	getById('nav-menu-content').innerHTML = '<p><span id="nav-menu-content-1">ライブラリ／LIBRARY</span></p>' +
			'<p><span id="nav-menu-content-2">マイページ／ACCOUNT SETTINGS</span></p>' +
			'<p><span id="nav-menu-content-3">ご利用ガイド／INFO</span></p>' +
			'<p><span id="nav-menu-content-4">ログアウト／LOG OUT</span></p>';
	
	addEventListener(getById('nav-btn'), 'click', function () {
		navUpdate ();
	});
	
	addEventListener(getById('nav-menu-content-1'), 'click', function () {
		redirect(topURL);
	});

	addEventListener(getById('nav-menu-content-2'), 'click', function () {
		redirect(debug?'account.html':(topURL+'/account'));
	});

	addEventListener(getById('nav-menu-content-3'), 'click', function () {
		redirect(debug?'info.html':(topURL+'/info'));
	});

	addEventListener(getById('nav-menu-content-4'), 'click', function () {
		logout(function () {redirect(loginURL);});
	});
}
////////////////////////////////////////

////////////////////////////////////////
export function secToTimestamp (sec: number) {
	if (isNaN(sec)) {
		return '--:--';
	}
	var hour = Math.floor(sec/60/60);
	sec = sec - hour*60*60;
	var min = Math.floor(sec/60);
	sec = sec - min*60;

	sec = Math.floor(sec);
	var secText = sec.toString();
	if (sec < 10) {
		secText = '0' + secText;
	}

	var minText = min.toString();
	if (hour > 0 && min < 10) {
		minText = '0' + minText;
	}
	
	return ((hour==0)?'':(hour + ':')) + minText + ':' + secText;
}
////////////////////////////////////////

////////////////////////////////////////
export function onScreenConsoleOutput (txt: string) {
	var onScreenConsole = getByIdNative('on-screen-console');
	if (onScreenConsole instanceof HTMLTextAreaElement) {
		var date = new Date();
		onScreenConsole.value += (date.getHours()<10 ? '0'+date.getHours() : date.getHours()) + ':' + (date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes()) + ':' + (date.getSeconds()<10 ? '0'+date.getSeconds() : date.getSeconds()) + '   ' + txt + '\r\n';
	}
}
////////////////////////////////////////

////////////////////////////////////////
export  function changeColor (elem: HTMLElement, color: string) {
	removeClass(elem, 'color-red');
	removeClass(elem, 'color-green');
	removeClass(elem, 'color-orange');
	addClass(elem, 'color-'+color);
}
////////////////////////////////////////

////////////////////////////////////////
export function imageProtection (elem: HTMLImageElement) {
	removeRightClick(elem);
	addEventListener(elem, 'dragstart', e => {
		e.preventDefault();
	});
	addEventListener(elem, 'touchforcechange', e => {
		var event = e as TouchEvent;
		if (event.changedTouches[0] !== undefined && event.changedTouches[0].force > 0.1) {
			event.preventDefault();
		}
	});

	addEventListener(elem, 'touchstart', e=> {
		var event = e as TouchEvent;
		if (event.changedTouches[0] !== undefined && event.changedTouches[0].force > 0.1) {
			event.preventDefault();
		}
	});
}
////////////////////////////////////////
	
////////////////////////////////////////
export function concatenateSignedURL (url: string, credentials: type.CDNCredentials.CDNCredentials, resourceURLOverride?: string) {
	var policyString: string;
	if (credentials.Policy !== undefined) {
		var policy = credentials['Policy'];
		policy['Statement'][0]['Resource'] = (resourceURLOverride===undefined)?url:resourceURLOverride;
		policyString = JSON.stringify(policy);
		policyString = w.btoa(policyString);
		policyString = policyString.replace(/\+/g, "-");
		policyString = policyString.replace(/\=/g, "_");
		policyString = policyString.replace(/\//g, "~");
		policyString = 'Policy=' + policyString
	} else {
		policyString = 'Expires=' + credentials['Expires']
	}
	return url + '?' + policyString + '&Signature=' + credentials['Signature'] + '&Key-Pair-Id=' + credentials['Key-Pair-Id'];
}
////////////////////////////////////////
	
////////////////////////////////////////
export function encodeCFURIComponent (uri: string) {
	return encodeURIComponent(uri).replace(/%20/g, "+");
}
////////////////////////////////////////
	
////////////////////////////////////////
export function disableCheckbox (checkbox: HTMLInputElement, disabled: boolean) {
	checkbox.disabled = disabled;
	if (disabled) {
		addClass(getParent(checkbox), 'disabled');
	} else {
		removeClass(getParent(checkbox), 'disabled');
	}
}
////////////////////////////////////////
	
////////////////////////////////////////
export function clearCookies () {
	if (getHref() != topURL + '/message' && !debug) {
		deleteCookie('local-message-param');
	}
	if (getHref() != topURL + '/image' && !debug) {
		deleteCookie('local-image-param');
	}
}
////////////////////////////////////////

////////////////////////////////////////
export function cssVarWrapper () {
	import(
		/* webpackChunkName: "css-vars-ponyfill" */
		/* webpackExports: ["default"] */
		'css-vars-ponyfill'
	).then(({default: cssVars}) => {
		cssVars({
			onError: function(errorMessage) {
				if (getHref() != topURL + '/message' && !debug) {
					message.show(message.template.param.cssVarError(errorMessage));
				}
			},
			onWarning: function(errorMessage) {
				console.log(errorMessage);
			}
		});
	}).catch((e) => {
		message.show(message.template.param.moduleImportError(e));
	});
}
////////////////////////////////////////

////////////////////////////////////////
import type Sha512 from 'node-forge/lib/sha512';
var sha512: typeof Sha512 | null = null;
export async function hashPassword (password: string) {
	if (sha512 === null) {
		try {
			({default: sha512} = await import(
				/* webpackChunkName: "sha512" */
				/* webpackExports: ["default"] */
				'node-forge/lib/sha512'
			));
		} catch (e) {
			message.show(message.template.param.moduleImportError(e));
		}
	}
	
	var hash = (sha512 as typeof Sha512).sha256.create();
	hash.update(password);
	return hash.digest().toHex();
}
////////////////////////////////////////

////////////////////////////////////////
export function removeRightClick (elem: HTMLElement) {
	addEventListener(elem, 'contextmenu', event => event.preventDefault());
}