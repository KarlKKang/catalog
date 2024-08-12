import { MessageParamKey } from '../../../message/type';

export const status429 = {
    [MessageParamKey.TITLE]: '429 Too Many Requests',
    [MessageParamKey.MESSAGE]: 'リクエストを送信する頻度が高すぎる。数分待ってから、もう一度お試しください。',
};
