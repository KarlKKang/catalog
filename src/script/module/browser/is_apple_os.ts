import { osName } from './internal/ua/os_name';

export const IS_APPLE_OS = osName === 'macos' || osName === 'ios';
