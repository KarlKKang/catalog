import { osName } from './ua/os_name';
import { deviceModel } from './ua/device_model';
import { engineName } from './ua/engine_name';

export const IS_APPLE_MOBILE_WEBKIT = (osName === 'ios' || deviceModel === 'ipad') && engineName === 'webkit';
