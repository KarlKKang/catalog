import { osName } from './internal/ua/os_name';
import { deviceModel } from './internal/ua/device_model';
import { engineName } from './internal/ua/engine_name';

export const IS_APPLE_MOBILE_WEBKIT = (osName === 'ios' || deviceModel === 'ipad') && engineName === 'webkit';
