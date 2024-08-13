import { uaParserResult } from './internal/ua_parser';

export const osName = (uaParserResult.os.name ?? '').toLowerCase();
