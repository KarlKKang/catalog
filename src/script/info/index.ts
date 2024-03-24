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

    const mainBodyImport = import(
        './info'
    );

    const showPageCallback = async (navBar: boolean) => {
        const currentPgid = pgid;
        try {
            const { default: mainBody } = await mainBodyImport;
            mainBody();
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
        if (navBar) {
            addNavBar(NavBarPage.INFO);
        }
        scrollToHash();
    };

    authenticate({
        successful:
            function () {
                showPageCallback(true);
            },
        failed:
            function () {
                showPageCallback(false);
            },
    });
}