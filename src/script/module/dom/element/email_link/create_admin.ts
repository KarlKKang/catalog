import { WEBSITE_APEX_HOSTNAME } from '../../../env/website_apex_hostname';
import { createEmailLink } from './create';

export function createAdminEmailLink() {
    return createEmailLink('admin@' + WEBSITE_APEX_HOSTNAME);
}
