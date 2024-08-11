import { createParagraphElement } from '../../dom/element/paragraph/create';
import { createDivElement } from '../../dom/element/div/create';
import { prependChild } from '../../dom/node/prepend_child';
import { appendChild } from '../../dom/node/append_child';
import { addClass } from '../../dom/class/add';
import { body } from '../../dom/body';
import { addEventListener } from '../../event_listener';
import { w } from '../../dom/window';
import { redirect } from '../../global';
import { scrollToTop } from '../../dom/scroll/to_top';
import { NavBarPage } from '../enum';
import * as icons from './icons';
import { infoPageTitle, myAccountPageTitle, newsPageTitle } from '../../text/page_title';
import * as styles from '../../../../css/nav_bar.module.scss';
import { INFO_URI, MY_ACCOUNT_URI, NEWS_ROOT_URI, TOP_URI } from '../../env/uri';

export default function (page?: NavBarPage, currentPageCallback?: () => void) {
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
    const navButton2 = getNavButton(newsPageTitle);
    const navButton3 = getNavButton(myAccountPageTitle);
    const navButton4 = getNavButton(infoPageTitle);

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
        redirect(TOP_URI);
    });

    addEventListener(navButton2[0], 'click', () => {
        if (page === NavBarPage.NEWS) {
            if (callback()) {
                return;
            }
        }
        redirect(NEWS_ROOT_URI);
    });

    addEventListener(navButton3[0], 'click', () => {
        if (page === NavBarPage.MY_ACCOUNT) {
            if (callback()) {
                return;
            }
        }
        redirect(MY_ACCOUNT_URI);
    });

    addEventListener(navButton4[0], 'click', () => {
        if (page === NavBarPage.INFO) {
            if (callback()) {
                return;
            }
        }
        redirect(INFO_URI);
    });

    addClass(body, styles.navBarPadding);

    appendChild(navButton1[1], page === NavBarPage.HOME ? icons.getHomeFillIcon() : icons.getHomeIcon());
    appendChild(navButton2[1], page === NavBarPage.NEWS ? icons.getNewsFillIcon() : icons.getNewsIcon());
    appendChild(navButton3[1], page === NavBarPage.MY_ACCOUNT ? icons.getMyAccountFillIcon() : icons.getMyAccountIcon());
    appendChild(navButton4[1], page === NavBarPage.INFO ? icons.getInfoFillIcon() : icons.getInfoIcon());
}
