const TOP_DOMAIN = ENV_DOMAIN;
export { TOP_DOMAIN };
export function getServerOrigin(domain: string) {
    return 'https://server.' + domain;
}
export function getCDNOrigin(domain: string) {
    return 'https://cdn.' + domain;
}