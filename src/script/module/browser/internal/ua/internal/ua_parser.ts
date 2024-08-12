import { UAParser } from 'ua-parser-js';

let result: UAParser.IResult | null = null;

export function getUAParserResult() {
    if (result !== null) {
        return result;
    }
    result = UAParser();
    return result;
}
