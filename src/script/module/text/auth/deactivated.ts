import { createEmailLink } from '../../dom/element/email_link/create';
import { createTextNode } from '../../dom/element/text/create';
import { WEBSITE_APEX_HOSTNAME } from '../../env/website_apex_hostname';

export const accountDeactivated = () => {
    const message: [Text, HTMLAnchorElement, Text] = [
        createTextNode('お客様のアカウントは無効化されています。アカウントの再有効化をご希望の場合は、管理者（'),
        createEmailLink('admin@' + WEBSITE_APEX_HOSTNAME),
        createTextNode('）にご連絡ください。'),
    ];
    return message;
};
