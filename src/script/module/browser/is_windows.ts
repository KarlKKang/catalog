import { getOsName } from './internal/ua/get_os_name';

export const IS_WINDOWS = getOsName() === 'windows';
