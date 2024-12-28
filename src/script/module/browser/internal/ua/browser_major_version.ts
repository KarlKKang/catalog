import { uaParserResult } from './internal/ua_parser';

const version = uaParserResult.browser.version;
export const browserMajorVersion = version === undefined ? NaN : parseInt(version);
