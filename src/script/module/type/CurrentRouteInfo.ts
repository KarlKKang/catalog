import { parseObject } from './internal/parse_object';
import { parseString } from './internal/parse_string';

export const enum CurrentRouteInfoKey {
    ASN,
    TYPE,
}
export interface CurrentRouteInfo {
    readonly [CurrentRouteInfoKey.ASN]: string;
    readonly [CurrentRouteInfoKey.TYPE]: string;
}

export function parseCurrentRouteInfo(routeInfo: unknown): CurrentRouteInfo {
    const routeInfoObj = parseObject(routeInfo);
    return {
        [CurrentRouteInfoKey.ASN]: parseString(routeInfoObj.asn),
        [CurrentRouteInfoKey.TYPE]: parseString(routeInfoObj.type),
    };
}
