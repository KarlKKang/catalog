import { getUAParserResult } from './internal/ua_parser';

export function getEngineMajorVersion() {
    const version = getUAParserResult().engine.version;
    if (version === undefined) {
        return NaN;
    }
    return parseInt(version);
}
