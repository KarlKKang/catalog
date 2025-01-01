import { OG_PROPERTY } from '../internal/property';
import { setOgProperty } from '../internal/set';

export function setOgTitle(title: string) {
    setOgProperty(OG_PROPERTY.TITLE, title);
}
