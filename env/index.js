export const TOP_DOMAIN = 'featherine.com';
export const DESCRIPTION = 'ときめきを世界に届ける。';
export function WEBSITE_SUBDOMAIN_PREFIX(dev) {
    return dev ? 'alpha.' : '';
}
export function WEBSITE_PORT_SUFFIX(dev) {
    return '';
}
export function WEBSITE_NAME(dev) {
    return TOP_DOMAIN + (dev ? ' (alpha)' : '');
}