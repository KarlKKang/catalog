import { CSS_COLOR } from '../style/value';

export const enum MessageParamKey {
    MESSAGE,
    TITLE,
    COLOR,
    URL,
    BUTTON_TEXT,
    LOGOUT,
    REPLACE_BODY,
    __LENGTH,
}

export interface MessageParam {
    [MessageParamKey.MESSAGE]?: string | HTMLElement;
    [MessageParamKey.TITLE]?: string;
    [MessageParamKey.COLOR]?: CSS_COLOR;
    [MessageParamKey.URL]?: string;
    [MessageParamKey.BUTTON_TEXT]?: string | null;
    [MessageParamKey.LOGOUT]?: boolean;
}
