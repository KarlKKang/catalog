import { BROWSER_NAME_RAW, BROWSER_VERSION_RAW, DEVICE_MODEL_RAW, DEVICE_VENDOR_RAW, OS_NAME_RAW, OS_VERSION_RAW } from '../../../browser/ua/parser';
import { jsonEncode } from '../../../json';
import { objectEntries } from '../../../object';
import { urlencode } from '../../../string/http_form/urlencode';
import { isString } from '../../../type/is/string';

interface StringDictionary { [key: string]: string | undefined | StringDictionary }

export default function (): string {
    const uaCookie: StringDictionary = {
        browser: {
            name: BROWSER_NAME_RAW,
            version: BROWSER_VERSION_RAW,
        },
        device: {
            model: DEVICE_MODEL_RAW,
            vendor: DEVICE_VENDOR_RAW,
        },
        os: {
            name: OS_NAME_RAW,
            version: OS_VERSION_RAW,
        },
    };
    filterEmpty(uaCookie);
    let uaCookieStr = encode(uaCookie);
    if (uaCookieStr === null) {
        filterInvalidValues(uaCookie);
        filterEmpty(uaCookie);
        uaCookieStr = encode(uaCookie);
        if (uaCookieStr === null) {
            return '{}';
        }
    }
    return uaCookieStr;
}

function encode(obj: StringDictionary | string): string | null {
    try {
        return urlencode(jsonEncode(obj));
    } catch {
        return null;
    }
}

function filterInvalidValues(obj: StringDictionary): void {
    for (const [key, value] of objectEntries(obj)) {
        if (isString(value)) {
            if (encode(value) === null) {
                obj[key] = undefined;
            }
        } else if (value !== undefined) {
            filterInvalidValues(value);
        }
    }
}

function filterEmpty(obj: StringDictionary): boolean {
    let allUndefined = true;
    for (const [key, value] of objectEntries(obj)) {
        if (isString(value)) {
            allUndefined = false;
        } else if (value !== undefined) {
            if (filterEmpty(value)) {
                obj[key] = undefined;
            } else {
                allUndefined = false;
            }
        }
    }
    return allUndefined;
}
