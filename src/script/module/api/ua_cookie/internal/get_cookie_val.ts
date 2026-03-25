import { BROWSER_NAME_RAW, BROWSER_VERSION_RAW, DEVICE_MODEL_RAW, DEVICE_VENDOR_RAW, OS_NAME_RAW, OS_VERSION_RAW } from '../../../browser/ua/parser';
import { jsonEncode } from '../../../json';
import { encodeURIComponentWrapped } from '../../../string/encode_uri_component';
import type { UACookie } from '../../../type/UACookie';

export default function () {
    const uaCookie: UACookie = {
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
    return encodeURIComponentWrapped(jsonEncode(uaCookie));
}
