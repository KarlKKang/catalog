import { authenticate } from '../module/server';
import {
    clearSessionStorage,
} from '../module/dom';
import type { ShowPageFunc } from '../module/type/ShowPageFunc';
import { addNavBar } from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import { scrollToHash } from '../module/common';
import { pgid } from '../module/global';
import { showMessage } from '../module/message';
import { moduleImportError } from '../module/message/param';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    authenticate({
        successful: function () {
            addNavBar(NavBarPage.INFO);
        }
    });
    showMainBody(showPage);
}

async function showMainBody(showPage: ShowPageFunc) {
    const mainBodyImport = import(
        './info'
    );
    const currentPgid = pgid;
    let mainBody: typeof import('./info').default;
    try {
        mainBody = (await mainBodyImport).default;
    } catch (e) {
        if (pgid === currentPgid) {
            showMessage(moduleImportError(e));
        }
        throw e;
    }
    if (pgid !== currentPgid) {
        return;
    }
    showPage();
    mainBody();
    scrollToHash();
}