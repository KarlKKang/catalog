import {
	topURL,
	loginURL
} from './constant.js';

export function keyExists (obj, key) {
	return obj.hasOwnProperty(key);
}

export function getHref () {
    const href = window.location.href;
    if (href == topURL + '/' || href == loginURL + '/') { //When the trailing slash is included for root pages
        return href.substring(0, href.length-1);
    }
    return href;
}