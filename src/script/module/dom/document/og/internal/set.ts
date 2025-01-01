import { setAttribute } from '../../../attr/set';
import { createMetaElement } from '../../../element/meta/create';
import { head } from '../../../head';
import { appendChild } from '../../../node/append_child';
import { OG_PROPERTY } from './property';

export function setOgProperty(property: OG_PROPERTY, value: string): void {
    const metas = head.querySelectorAll('meta[property="og:' + property + '"]');
    if (metas.length === 0) {
        const meta = createMetaElement();
        setAttribute(meta, 'property', 'og:' + property);
        setAttribute(meta, 'content', value);
        appendChild(head, meta);
    } else {
        for (const meta of metas) {
            setAttribute(meta, 'content', value);
        }
    }
}
