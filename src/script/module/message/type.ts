import { type CSS_COLOR } from '../style/color';

export const enum MessageParamKey {
    MESSAGE,
    TITLE,
    COLOR,
    URL,
    BUTTON,
    REDIRECT_WITHOUT_HISTORY,
}

export interface MessageParam {
    [MessageParamKey.MESSAGE]?: string | HTMLElement;
    [MessageParamKey.TITLE]?: string;
    [MessageParamKey.COLOR]?: CSS_COLOR;
    [MessageParamKey.URL]?: string;
    [MessageParamKey.BUTTON]?: string | HTMLButtonElement | null;
    [MessageParamKey.REDIRECT_WITHOUT_HISTORY]?: boolean;
}
