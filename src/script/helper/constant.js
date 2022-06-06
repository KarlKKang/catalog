export const serverURL = 'https://server.featherine.com';
export const cdnURL = 'https://cdn.featherine.com';
	
export const debug = process.env.NODE_ENV !== 'production';

export const topURL = debug?'index.html':'https://featherine.com';
export const loginURL = debug?'login.html':'https://login.featherine.com';