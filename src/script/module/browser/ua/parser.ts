import { UAParser } from 'ua-parser-js';

const uaParserResult = await (await new UAParser().getResult().withClientHints()).withFeatureCheck();
const { engine: uaParserResultEngine, browser: uaParserResultBrowser, device: uaParserResultDevice, os: uaParserResultOS } = uaParserResult;
export const {
    name: BROWSER_NAME_RAW,
    version: BROWSER_VERSION_RAW,
} = uaParserResultBrowser;
export const {
    model: DEVICE_MODEL_RAW,
    vendor: DEVICE_VENDOR_RAW,
} = uaParserResultDevice;
export const {
    name: OS_NAME_RAW,
    version: OS_VERSION_RAW,
} = uaParserResultOS;
export const {
    name: ENGINE_NAME_RAW,
    version: ENGINE_VERSION_RAW,
} = uaParserResultEngine;
