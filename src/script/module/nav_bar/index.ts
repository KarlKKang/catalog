import { TOP_URL } from '../env/constant';
import { show as showMessage } from '../message';
import { moduleImportError } from '../message/param';
import {
    w, addClass,
    addEventListener,
    appendChild,
    createParagraphElement,
    createDivElement,
    prependChild, body
} from '../dom';
import { pgid, redirect } from '../global';
import { scrollToTop } from '../common';

import * as styles from '../../../css/nav_bar.module.scss';

const enum NavBarPage {
    HOME,
    NEWS,
    MY_ACCOUNT,
    INFO
}

export const NAV_BAR_HOME = NavBarPage.HOME;
export const NAV_BAR_NEWS = NavBarPage.NEWS;
export const NAV_BAR_MY_ACCOUNT = NavBarPage.MY_ACCOUNT;
export const NAV_BAR_INFO = NavBarPage.INFO;

export async function addNavBar(page?: NavBarPage, currentPageCallback?: () => void) {
    const getNavButton = (name: string): [HTMLDivElement, HTMLDivElement] => {
        const container = createDivElement();
        const containerInner = createDivElement();
        const iconContainer = createDivElement();
        addClass(iconContainer, styles.icon);
        const nameContainer = createParagraphElement(name);
        appendChild(containerInner, iconContainer);
        appendChild(containerInner, nameContainer);
        appendChild(container, containerInner);
        return [container, iconContainer];
    };

    const navButton1 = getNavButton('ホーム');
    const navButton2 = getNavButton('お知らせ');
    const navButton3 = getNavButton('マイページ');
    const navButton4 = getNavButton('ご利用ガイド');

    const navBar = createDivElement();
    addClass(navBar, styles.navBar);
    prependChild(body, navBar);
    appendChild(navBar, navButton1[0]);
    appendChild(navBar, navButton2[0]);
    appendChild(navBar, navButton3[0]);
    appendChild(navBar, navButton4[0]);

    const callback = () => {
        if (currentPageCallback !== undefined) {
            currentPageCallback();
            return true;
        }
        if (w.scrollY === 0) {
            return false;
        }
        scrollToTop();
        return true;
    };

    addEventListener(navButton1[0], 'click', () => {
        if (page === NavBarPage.HOME) {
            if (callback()) {
                return;
            }
        }
        redirect(TOP_URL);
    });

    addEventListener(navButton2[0], 'click', () => {
        if (page === NavBarPage.NEWS) {
            if (callback()) {
                return;
            }
        }
        redirect(TOP_URL + '/news/');
    });

    addEventListener(navButton3[0], 'click', () => {
        if (page === NavBarPage.MY_ACCOUNT) {
            if (callback()) {
                return;
            }
        }
        redirect(TOP_URL + '/my_account');
    });

    addEventListener(navButton4[0], 'click', () => {
        if (page === NavBarPage.INFO) {
            if (callback()) {
                return;
            }
        }
        redirect(TOP_URL + '/info');
    });

    const navBarPadding = createDivElement();
    addClass(navBarPadding, styles.navBarPadding);
    appendChild(body, navBarPadding);

    let icons: typeof import('./icons');
    const currentPgid = pgid;
    try {
        icons = await import(
            './icons'
        );
    } catch (e) {
        if (currentPgid === pgid) {
            showMessage(moduleImportError(e));
        }
        throw e;
    }
    appendChild(navButton1[1], page === NavBarPage.HOME ? icons.getHomeFillIcon() : icons.getHomeIcon());
    appendChild(navButton2[1], page === NavBarPage.NEWS ? icons.getNewsFillIcon() : icons.getNewsIcon());
    appendChild(navButton3[1], page === NavBarPage.MY_ACCOUNT ? icons.getMyAccountFillIcon() : icons.getMyAccountIcon());
    appendChild(navButton4[1], page === NavBarPage.INFO ? icons.getInfoFillIcon() : icons.getInfoIcon());
}
