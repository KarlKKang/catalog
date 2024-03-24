import { CSS_COLOR } from '../style/value';

export const MessageTitleColor = [
    CSS_COLOR.RED,
    CSS_COLOR.GREEN,
    CSS_COLOR.ORANGE,
] as const;

export const enum MessageParamProp {
    MESSAGE,
    TITLE,
    COLOR,
    URL,
    BUTTON_TEXT,
    LOGOUT,
    REPLACE_BODY,
}

export interface MessageParam {
    [MessageParamProp.MESSAGE]?: string;
    [MessageParamProp.TITLE]?: string;
    [MessageParamProp.COLOR]?: typeof MessageTitleColor[number];
    [MessageParamProp.URL]?: string;
    [MessageParamProp.BUTTON_TEXT]?: string | null;
    [MessageParamProp.LOGOUT]?: boolean;
    [MessageParamProp.REPLACE_BODY]?: boolean;
}