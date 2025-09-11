import { createAdminEmailLink } from '../../dom/element/email_link/create_admin';
import { createTextNode } from '../../dom/element/text/create';

export const accountDeactivated = () => {
    const message: [Text, HTMLAnchorElement, Text] = [
        createTextNode('お客様のアカウントは無効化されています。アカウントの再有効化をご希望の場合は、管理者（'),
        createAdminEmailLink(),
        createTextNode('）にご連絡ください。'),
    ];
    return message;
};
