import { parseObject, parseString, parseTypedArray } from './helper';

export const enum RouteInfoKey {
    NAME,
    CODE,
}
export type RouteInfo = {
    readonly [RouteInfoKey.NAME]: string;
    readonly [RouteInfoKey.CODE]: string;
};
export type RouteList = RouteInfo[];

export function parseRouteList(routeList: unknown): RouteList {
    return parseTypedArray(routeList, (routeInfo): RouteInfo => {
        const routeInfoObj = parseObject(routeInfo);
        return {
            [RouteInfoKey.NAME]: parseString(routeInfoObj.name),
            [RouteInfoKey.CODE]: parseString(routeInfoObj.code),
        };
    });
}