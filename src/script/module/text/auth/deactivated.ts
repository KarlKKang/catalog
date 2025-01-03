import { createEmailLink } from '../../dom/element/email_link/create';
import { createTextNode } from '../../dom/element/text/create';
import { TOP_DOMAIN } from '../../env/top_domain';

export const accountDeactivated = () => {
    const message: [Text, HTMLAnchorElement, Text] = [
        createTextNode('お客様のアカウントは無効化されています。アカウントの再有効化をご希望の場合は、管理者（'),
        createEmailLink('admin@' + TOP_DOMAIN),
        createTextNode('）にご連絡ください。'),
    ];
    return message;
};
