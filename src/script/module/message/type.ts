import { CSS_COLOR } from '../style/value';

export const MessageTitleColor = [
    CSS_COLOR.RED,
    CSS_COLOR.GREEN,
    CSS_COLOR.ORANGE,
] as const;

export interface MessageParam {
    message?: string;
    title?: string;
    color?: typeof MessageTitleColor[number];
    url?: string;
    buttonText?: string | null;
    logout?: boolean;
    replaceBody?: boolean;
}