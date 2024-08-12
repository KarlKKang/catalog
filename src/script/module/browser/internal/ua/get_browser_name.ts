import { getUAParserResult } from './internal/ua_parser';

export function getBrowserName() {
    return (getUAParserResult().browser.name ?? '').toLowerCase();
}
