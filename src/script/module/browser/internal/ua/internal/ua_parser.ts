import { UAParser } from 'ua-parser-js';

export const uaParserResult = await (await new UAParser().getResult().withClientHints()).withFeatureCheck();
