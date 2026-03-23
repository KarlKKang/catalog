import { OS_NAME } from './ua/os_name';
import { DEVICE_MODEL } from './ua/device_model';
import { ENGINE_NAME } from './ua/engine_name';

export const IS_APPLE_MOBILE_WEBKIT = (OS_NAME === 'ios' || DEVICE_MODEL === 'ipad') && ENGINE_NAME === 'webkit';
