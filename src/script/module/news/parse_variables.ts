import { removeClass } from '../dom/class/remove';
import { createAdminEmailLink } from '../dom/element/email_link/create_admin';
import { getByClass } from '../dom/element/get/by_class';
import { createTextNode } from '../dom/element/text/create';
import { replaceWith } from '../dom/node/replace_with';
import { WEBSITE_NAME } from '../env/website_name';

export function parseNewsInternalVariables(container: HTMLElement) {
    const INTERNAL_VARIABLE_CLASS = 'internal-var';
    const elems = getByClass(container, INTERNAL_VARIABLE_CLASS);
    let elem = elems[0];
    while (elem !== undefined) {
        removeClass(elem, INTERNAL_VARIABLE_CLASS);
        const replacementNode = getReplacementNode(elem.innerHTML);
        if (replacementNode !== null) {
            replaceWith(elem, replacementNode);
        }
        elem = elems[0];
    }
}

function getReplacementNode(varName: string): Node | null {
    if (varName === 'WEBSITE_NAME') {
        return createTextNode(WEBSITE_NAME);
    }
    if (varName === 'ADMIN_EMAIL') {
        return createAdminEmailLink();
    }
    return null;
}
