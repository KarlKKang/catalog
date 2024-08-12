import { getUAParserResult } from './internal/ua_parser';

export function getEngineName() {
    return (getUAParserResult().engine.name ?? '').toLowerCase();
}
