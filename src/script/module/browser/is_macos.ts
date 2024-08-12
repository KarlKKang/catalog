import { getOsName } from './internal/ua/get_os_name';

export const IS_MACOS = getOsName() === 'mac os';
