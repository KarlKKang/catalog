// JavaScript Document
//Browser detection ported from videojs
var USER_AGENT = window.navigator && window.navigator.userAgent || '';
var TOUCH_ENABLED = Boolean(document === window.document && ('ontouchstart' in window || window.navigator.maxTouchPoints || window.DocumentTouch && window.document instanceof window.DocumentTouch));
var ANDROID_VERSION = function () {
	// This matches Android Major.Minor.Patch versions
	// ANDROID_VERSION is Major.Minor as a Number, if Minor isn't available, then only Major is returned
	var match = USER_AGENT.match(/Android (\d+)(?:\.(\d+))?(?:\.(\d+))*/i);

	if (!match) {
		return null;
	}

	var major = match[1] && parseFloat(match[1]);
	var minor = match[2] && parseFloat(match[2]);

	if (major && minor) {
		return parseFloat(match[1] + '.' + match[2]);
	} else if (major) {
		return major;
	}

	return null;
}();
var webkitVersionMap = /AppleWebKit\/([\d.]+)/i.exec(USER_AGENT);
var appleWebkitVersion = webkitVersionMap ? parseFloat(webkitVersionMap.pop()) : null;
var IS_ANDROID = /Android/i.test(USER_AGENT);
var IS_NATIVE_ANDROID = IS_ANDROID && ANDROID_VERSION < 5 && appleWebkitVersion < 537;
var IS_FIREFOX = /Firefox/i.test(USER_AGENT);
var IS_EDGE = /Edg/i.test(USER_AGENT);
var IS_CHROME = !IS_EDGE && (/Chrome/i.test(USER_AGENT) || /CriOS/i.test(USER_AGENT));
var IS_SAFARI = /Safari/i.test(USER_AGENT) && !IS_CHROME && !IS_ANDROID && !IS_EDGE;
var IS_IPAD = /iPad/i.test(USER_AGENT) || IS_SAFARI && TOUCH_ENABLED && !/iPhone/i.test(USER_AGENT);
var IS_IPHONE = /iPhone/i.test(USER_AGENT) && !IS_IPAD;