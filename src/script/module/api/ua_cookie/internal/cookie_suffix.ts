import { baseHostname } from '../../../env/location/get/base_hostname';

export const uaCookieSuffix = ';domain=.' + baseHostname + ';path=/;secure;samesite=strict';
