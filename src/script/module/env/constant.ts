const TOP_DOMAIN = ENV_DOMAIN;

let DOMAIN: string = TOP_DOMAIN;
if (DEVELOPMENT) {
    DOMAIN = 'alpha.' + DOMAIN;
}

export { TOP_DOMAIN };
export { DOMAIN };

export const SERVER_URL = 'https://server.' + DOMAIN;
export const CDN_URL = 'https://cdn.' + DOMAIN;

export const TOP_URL = 'https://' + DOMAIN;
export const LOGIN_URL = TOP_URL + '/login';