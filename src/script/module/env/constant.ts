import { DOMAIN } from '../../../../env/index.cjs';
export { DOMAIN };

export const SERVER_URL = 'https://server.' + DOMAIN;
export const CDN_URL = 'https://cdn.' + DOMAIN;

export const DEVELOPMENT = process.env.NODE_ENV !== 'production';

export const TOP_URL = DEVELOPMENT ? 'index.html' : 'https://' + DOMAIN;
export const LOGIN_URL = DEVELOPMENT ? 'login.html' : 'https://login.' + DOMAIN;