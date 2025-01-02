import { createStyledButtonElement } from '../../../dom/element/button/styled/create';
import { CSS_AUTO } from '../../../style/value/auto';
import { setWidth } from '../../../style/width';

export function createBackToTopButton() {
    const button = createStyledButtonElement('トップページへ戻る');
    setWidth(button, CSS_AUTO);
    return button;
}
