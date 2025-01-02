import { showMessage } from './module/message';
import { notFound } from './module/message/param/not_found';

export default function () {
    showMessage(notFound());
}
