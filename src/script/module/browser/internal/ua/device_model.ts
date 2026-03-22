import { uaParserResult } from './internal/ua_parser';

export const deviceModel = (uaParserResult.device.model ?? '').toLowerCase();
