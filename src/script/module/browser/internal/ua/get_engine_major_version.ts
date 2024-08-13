import { uaParserResult } from './internal/ua_parser';

const version = uaParserResult.engine.version;
export const engineMajorVersion = version === undefined ? NaN : parseInt(version);
