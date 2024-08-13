import { uaParserResult } from './internal/ua_parser';

export const browserName = (uaParserResult.browser.name ?? '').toLowerCase();
