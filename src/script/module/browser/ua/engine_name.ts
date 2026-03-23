import { uaParserResult } from './internal/ua_parser';

export const engineName = (uaParserResult.engine.name ?? '').toLowerCase();
