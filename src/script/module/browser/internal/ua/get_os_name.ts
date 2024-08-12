import { getUAParserResult } from './internal/ua_parser';

export function getOsName() {
    return (getUAParserResult().os.name ?? '').toLowerCase();
}
