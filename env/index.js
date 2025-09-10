export const WEBSITE_APEX_HOSTNAME = 'featherine.com';
export const WEBSITE_DESCRIPTION = 'ときめきを世界に届ける。';
export function WEBSITE_HOSTNAME_PREFIX(dev) {
    return dev ? 'alpha.' : '';
}
export function WEBSITE_PORT_SUFFIX(dev) {
    return '';
}
export function WEBSITE_NAME(dev) {
    return WEBSITE_APEX_HOSTNAME + (dev ? ' (alpha)' : '');
}