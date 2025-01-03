import { type MessageParam } from './type';
import { redirectSameOrigin } from '../global/redirect';
import { MESSAGE_URI } from '../env/uri';

let _messageParam: MessageParam | null = null;

export function showMessage(messageParam: MessageParam) {
    _messageParam = messageParam;
    redirectSameOrigin(MESSAGE_URI);
}

export function getMessageParam() {
    const messageParam = _messageParam;
    _messageParam = null;
    return messageParam;
}
