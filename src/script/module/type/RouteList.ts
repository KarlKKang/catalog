import { parseObject } from './internal/parse_object';
import { parseTypedArray } from './internal/parse_array/typed';
import { parseString } from './internal/parse_string';
import { parseOptional } from './internal/parse_optional';

export const enum RouteInfoKey {
    NAME,
    CODE,
    TYPE,
}
export interface RouteInfo {
    readonly [RouteInfoKey.NAME]: string;
    readonly [RouteInfoKey.CODE]: string;
    readonly [RouteInfoKey.TYPE]: string | undefined;
}
export type RouteList = RouteInfo[];

export function parseRouteList(routeList: unknown): RouteList {
    return parseTypedArray(routeList, (routeInfo): RouteInfo => {
        const routeInfoObj = parseObject(routeInfo);
        return {
            [RouteInfoKey.NAME]: parseString(routeInfoObj.name),
            [RouteInfoKey.CODE]: parseString(routeInfoObj.code),
            [RouteInfoKey.TYPE]: parseOptional(routeInfoObj.type, parseString),
        };
    });
}
