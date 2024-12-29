import { html } from '../dom/html';
import { CSS_PROPERTY } from './internal/property';
import { setStyle } from './internal/set_style';

export function setSmoothScroll(enable: boolean) {
    setStyle(html, CSS_PROPERTY.SCROLL_BEHAVIOR, enable ? 'smooth' : 'auto');
}
