export const SERVER_URL = 'https://server.featherine.com';
export const CDN_URL = 'https://cdn.featherine.com';
	
export const DEVELOPMENT = process.env.NODE_ENV !== 'production';

export const TOP_URL = DEVELOPMENT?'index.html':'https://featherine.com';
export const LOGIN_URL = DEVELOPMENT?'login.html':'https://login.featherine.com';