import { parseObject } from './internal/parse_object';
import { parseString } from './internal/parse_string';

export const enum CurrentRouteInfoKey {
    COUNTRY,
    TYPE,
}
export interface CurrentRouteInfo {
    readonly [CurrentRouteInfoKey.COUNTRY]: string;
    readonly [CurrentRouteInfoKey.TYPE]: string;
}

export function parseCurrentRouteInfo(routeInfo: unknown): CurrentRouteInfo {
    const routeInfoObj = parseObject(routeInfo);
    return {
        [CurrentRouteInfoKey.COUNTRY]: parseString(routeInfoObj.country),
        [CurrentRouteInfoKey.TYPE]: parseString(routeInfoObj.type),
    };
}
