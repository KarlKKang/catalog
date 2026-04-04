import { BROWSER_NAME_RAW, BROWSER_VERSION_RAW, DEVICE_MODEL_RAW, DEVICE_VENDOR_RAW, OS_NAME_RAW, OS_VERSION_RAW } from '../../../browser/ua/parser';
import { jsonEncode } from '../../../json';
import { objectEntries } from '../../../object';
import { urlencode } from '../../../string/http_form/urlencode';
import { isString } from '../../../type/is/string';

interface StringDictionary { [key: string]: string | undefined | StringDictionary }
type ReducibleCandidate = [StringDictionary, string];
type ReducibleCandidates = ReducibleCandidate[];


export default function (): string {
    const EMPTY_VAL = '%7B%7D'; // urlencode('{}')
    const MAX_LENGTH = 2000; // A reasonable length limit, not strictly based on any specific technical limitations, though nginx has a default limit of 8k for a single header field.

    const browserObj = {
        name: BROWSER_NAME_RAW,
        ver: BROWSER_VERSION_RAW,
    };
    const deviceObj = {
        model: DEVICE_MODEL_RAW,
        vendor: DEVICE_VENDOR_RAW,
    };
    const osObj = {
        name: OS_NAME_RAW,
        ver: OS_VERSION_RAW,
    };
    const uaCookie: StringDictionary = {
        browser: browserObj,
        device: deviceObj,
        os: osObj,
    };

    let uaCookieStr = encodeObj(uaCookie);
    if (uaCookieStr === null) {
        filterInvalidValues(uaCookie);
        uaCookieStr = encodeObj(uaCookie);
        if (uaCookieStr === null) {
            return EMPTY_VAL;
        }
    }

    // Reduce length if necessary.
    for (const candidates of [
        [
            [browserObj, 'ver'],
            [osObj, 'ver'],
            [deviceObj, 'vendor'],
            [deviceObj, 'model'],
        ],
        [
            [browserObj, 'name'],
            [osObj, 'name'],
        ]
    ] as ReducibleCandidates[]) {
        while (uaCookieStr.length > MAX_LENGTH) {
            if (!removeLongValue(candidates)) {
                break;
            }
            uaCookieStr = encodeObj(uaCookie);
            if (uaCookieStr === null) {
                return EMPTY_VAL; // This should not happen since we have already filtered out all invalid values.
            }
        }
    }
    return uaCookieStr; // If all strings are longer than the limit, uaCookieStr should be the empty object at this stage, so we just directly return it without further checks.
}

function encodeObj(obj: StringDictionary): string | null {
    filterEmpty(obj);
    return encode(obj);
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

function removeLongValue(candidates: ReducibleCandidates): boolean {
    let longestLength = -1;
    let longestCandidate: ReducibleCandidate | null = null;
    for (const [parent, key] of candidates) {
        const value = parent[key];
        if (isString(value)) {
            const length = encode(value)?.length ?? -1;
            if (length >= longestLength) {
                longestLength = length;
                longestCandidate = [parent, key];
            }
        }
    }
    if (longestCandidate === null) {
        return false;
    }
    longestCandidate[0][longestCandidate[1]] = undefined;
    return true;
}
