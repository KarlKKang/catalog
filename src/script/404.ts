// JavaScript Document
import {
    TOP_URL,
} from './module/env/constant';
import {
    w,
    addEventListener,
    getById,
    getBody,
    redirect,
    showElement,
} from './module/dom';

export default function () {
    addEventListener(w, 'load', function () {
        addEventListener(getById('button'), 'click', function () {
            redirect(TOP_URL);
        });
        showElement(getBody());
    });
}