// This module contains exports that doesn't depend on any other modules.

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+[\]{}\\|;:'",<.>/?]{8,64}$/;
export const EMAIL_REGEX = /^(?=.{3,254}$)[^\s@]+@[^\s@]+$/;

export function getLocalTime(unixTimestamp?: number) {
    let date: Date;
    if (unixTimestamp === undefined) {
        date = new Date();
    } else {
        date = new Date(unixTimestamp * 1000);
    }
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        dayOfWeek: getDayOfWeek(date),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds()
    };
}

function getDayOfWeek(date: Date): string {
    const index = date.getDay();
    let result: string;
    switch (index) {
        case 1:
            result = '月';
            break;
        case 2:
            result = '火';
            break;
        case 3:
            result = '水';
            break;
        case 4:
            result = '木';
            break;
        case 5:
            result = '金';
            break;
        case 6:
            result = '土';
            break;
        default:
            result = '日';
    }
    return result;
}

export function objectKeyExists(key: PropertyKey, obj: object) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

export function handleAuthenticationResult(
    response: string,
    failedCallback: () => void,
    failedTotpCallback: () => void,
    deactivatedCallback: () => void,
    tooManyRequestsCallback: () => void,
): boolean {
    if (response == 'FAILED') {
        failedCallback();
        return false;
    } else if (response == 'DEACTIVATED') {
        deactivatedCallback();
        return false;
    } else if (response == 'TOO MANY REQUESTS') {
        tooManyRequestsCallback();
        return false;
    } else if (response == 'FAILED TOTP') {
        failedTotpCallback();
        return false;
    }
    return true;
}

export function secToTimestamp(sec: number, templateSec?: number) {
    if (isNaN(sec)) {
        return '0:00';
    }

    if (templateSec === undefined || isNaN(templateSec) || templateSec < sec) {
        templateSec = sec;
    }

    const secParsed = parseSec(sec);
    const templateSecParsed = templateSec === sec ? secParsed : parseSec(templateSec);

    let result = '';
    let minText = secParsed.min.toString();

    if (templateSecParsed.hour > 0) {
        const hourText = secParsed.hour.toString();
        result += '0'.repeat(templateSecParsed.hour.toString().length - hourText.length) + hourText + ':';
        if (secParsed.min < 10) {
            minText = '0' + minText;
        }
    } else {
        minText = '0'.repeat(templateSecParsed.min.toString().length - minText.length) + minText;
    }

    let secText = secParsed.sec.toString();
    if (secParsed.sec < 10) {
        secText = '0' + secText;
    }

    return result + minText + ':' + secText;
}

function parseSec(sec: number) {
    const hour = Math.floor(sec / 60 / 60);
    sec = sec - hour * 60 * 60;
    const min = Math.floor(sec / 60);
    sec = sec - min * 60;
    sec = Math.floor(sec);
    return {
        hour: hour,
        min: min,
        sec: Math.floor(sec)
    };
}

export function encodeCFURIComponent(uri: string) {
    return encodeURIComponent(uri).replace(/%20/g, '+');
}