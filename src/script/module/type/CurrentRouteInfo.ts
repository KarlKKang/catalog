import { parseObject, parseString } from './helper';

export const enum CurrentRouteInfoKey {
    ASN,
    TYPE,
}
export type CurrentRouteInfo = {
    readonly [CurrentRouteInfoKey.ASN]: string;
    readonly [CurrentRouteInfoKey.TYPE]: string;
};

export function parseCurrentRouteInfo(routeInfo: unknown): CurrentRouteInfo {
    const routeInfoObj = parseObject(routeInfo);
    return {
        [CurrentRouteInfoKey.ASN]: parseString(routeInfoObj.asn),
        [CurrentRouteInfoKey.TYPE]: parseString(routeInfoObj.type),
    };
}
