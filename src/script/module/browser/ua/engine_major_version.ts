import { ENGINE_VERSION_RAW } from './parser';

export const ENGINE_MAJOR_VERSION = ENGINE_VERSION_RAW === undefined ? NaN : parseInt(ENGINE_VERSION_RAW);
