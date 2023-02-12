// JavaScript Document
import 'core-js';
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

addEventListener(w, 'load', function () {
    showElement(getBody());

    addEventListener(getById('button'), 'click', function () {
        redirect(TOP_URL);
    });
});