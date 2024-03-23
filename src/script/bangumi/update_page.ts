import {
    TOP_URL,
    CDN_URL,
} from '../module/env/constant';
import { addNavBar } from '../module/nav_bar';
import {
    w,
    addEventListener,
    setTitle,
    addClass,
    remove,
    appendChild,
    insertBefore,
    getTitle,
    createDivElement,
    createButtonElement,
    createParagraphElement,
    appendText,
    createTextNode,
    createSpanElement,
    replaceChildren,
    body,
    createHRElement,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/param';
import { parseCharacters, getContentBoxHeight, createMessageElem } from './helper';
import type * as BangumiInfo from '../module/type/BangumiInfo';
import { encodeCFURIComponent } from '../module/common/pure';
import { addTimeout } from '../module/timer';
import type { MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { pgid, redirect } from '../module/global';
import { audioImportPromise, imageImportPromise, videoImportPromise } from './import_promise';
import { SharedElementVarsIdx, dereferenceSharedVars, getSharedElement, initializeSharedVars, setErrorMessageElement } from './shared_var';
import { hideElement, setMaxHeight, setMinHeight, setOpacity, setPaddingBottom, setVisibility, showElement } from '../module/style';
import { CSS_COLOR, CSS_UNIT } from '../module/style/value';
import '../../font/dist/Segoe/SegMDL2.css'; // Needed for the show more/less button.
import * as styles from '../../css/bangumi.module.scss';

let seriesID: string;
let epIndex: number;

let currentPage: Awaited<typeof videoImportPromise> | Awaited<typeof audioImportPromise> | Awaited<typeof imageImportPromise> | null = null;

export default async function (
    response: BangumiInfo.BangumiInfo,
    _seriesID: string,
    _epIndex: number,
    createMediaSessionPromise: Promise<MediaSessionInfo>,
) {
    seriesID = _seriesID;
    epIndex = _epIndex;

    const seasonSelector = createDivElement();
    addClass(seasonSelector, styles.seasonSelector);
    appendChild(body, seasonSelector);

    const epSelector = createDivElement();
    addClass(epSelector, styles.epSelector);
    appendChild(body, epSelector);

    const hr = createHRElement();
    addClass(hr, styles.hr);
    appendChild(body, hr);

    initializeSharedVars();
    addNavBar();

    const titleElem = getSharedElement(SharedElementVarsIdx.TITLE);
    const contentContainer = getSharedElement(SharedElementVarsIdx.CONTENT_CONTAINER);

    const epInfo = response.ep_info;

    const title = response.title;
    const titleOverride = response.title_override;
    if (titleOverride !== undefined) {
        appendText(titleElem, titleOverride);
        setTitle(parseCharacters(titleOverride) + ' | ' + getTitle());
    } else {
        appendText(titleElem, title);
        setTitle(parseCharacters(title) + '[' + response.series_ep[epIndex] + '] | ' + getTitle());
    }

    updateEPSelector(response.series_ep, epSelector);
    updateSeasonSelector(response.seasons, seasonSelector);

    const ageRestricted = epInfo.age_restricted;

    if (ageRestricted) {
        let warningTitle = '年齢認証';
        if (ageRestricted.toLowerCase() === 'r15+') {
            warningTitle = '「R15+指定」<br>年齢認証';
        } else if (ageRestricted.toLowerCase() === 'r18+') {
            warningTitle = '「R18+指定」<br>年齢認証';
        }

        const warningButtonGroup = createDivElement();
        addClass(warningButtonGroup, styles.warningButtonGroup);
        const warningButtonYes = createButtonElement('はい');
        const warningButtonNo = createButtonElement('いいえ');
        appendChild(warningButtonGroup, warningButtonYes);
        appendChild(warningButtonGroup, warningButtonNo);

        const warningElem = createMessageElem(warningTitle, [createTextNode('ここから先は年齢制限のかかっている作品を取り扱うページとなります。表示しますか？')], CSS_COLOR.RED, warningButtonGroup);
        addClass(warningElem, styles.warning);

        addEventListener(warningButtonYes, 'click', () => {
            hideElement(warningElem);
            showElement(contentContainer);
        });
        addEventListener(warningButtonNo, 'click', () => {
            redirect(TOP_URL);
        });

        hideElement(contentContainer);
        insertBefore(warningElem, contentContainer);
    }

    /////////////////////////////////////////////authenticate media session/////////////////////////////////////////////


    /////////////////////////////////////////////Add Media/////////////////////////////////////////////
    const type = epInfo.type;
    const seriesOverride = epInfo.series_override;
    const baseURL = CDN_URL + '/' + (seriesOverride === undefined ? seriesID : seriesOverride) + '/' + encodeCFURIComponent(epInfo.dir) + '/';

    const currentPgid = pgid;
    if (type === 'video') {
        try {
            currentPage = await videoImportPromise;
        } catch (e) {
            if (currentPgid === pgid) {
                showMessage(moduleImportError(e));
            }
            throw e;
        }
        if (currentPgid !== pgid) {
            return;
        }
        currentPage.default(seriesID, epIndex, epInfo as BangumiInfo.VideoEPInfo, baseURL, createMediaSessionPromise);
    } else {
        if (type === 'audio') {
            try {
                currentPage = await audioImportPromise;
            } catch (e) {
                if (currentPgid === pgid) {
                    showMessage(moduleImportError(e));
                }
                throw e;
            }
            if (currentPgid !== pgid) {
                return;
            }
            currentPage.default(seriesID, epIndex, epInfo as BangumiInfo.AudioEPInfo, baseURL, createMediaSessionPromise);
        } else {
            try {
                currentPage = await imageImportPromise;
            } catch (e) {
                if (currentPgid === pgid) {
                    showMessage(moduleImportError(e));
                }
                throw e;
            }
            if (currentPgid !== pgid) {
                return;
            }
            currentPage.default(epInfo as BangumiInfo.ImageEPInfo, baseURL, createMediaSessionPromise);
        }
    }
}

function updateEPSelector(seriesEP: BangumiInfo.SeriesEP, epSelector: HTMLElement) {
    const epButtonWrapper = createDivElement();
    appendChild(epSelector, epButtonWrapper);
    let minHeight = Number.POSITIVE_INFINITY;

    seriesEP.forEach((value, index) => {
        const epButton = createDivElement();
        const epText = createParagraphElement(value);

        if (epIndex === index) {
            addClass(epButton, styles.currentEp);
        }

        const targetEP = index + 1;
        appendChild(epButton, epText);
        addEventListener(epButton, 'click', () => { goToEP(seriesID, targetEP); });
        appendChild(epButtonWrapper, epButton);

        if (index === 0) {
            minHeight = getContentBoxHeight(epButtonWrapper);
        }
    });

    const showMoreButton = createParagraphElement();
    addClass(showMoreButton, styles.showMoreButton);
    setVisibility(showMoreButton, false);
    setOpacity(showMoreButton, 0);
    appendChild(epButtonWrapper, showMoreButton);

    const showMoreButtonFoldedText = [createTextNode('すべてを見る '), createSpanElement('')] as const;
    addClass(showMoreButtonFoldedText[1], styles.symbol);

    const showMoreButtonExpandedText = [createTextNode('非表示にする '), createSpanElement('')] as const;
    addClass(showMoreButtonExpandedText[1], styles.symbol);

    let currentToggleTimeout: NodeJS.Timeout | null = null;
    let currentToggleAnimationFrame: number | null = null;
    let isExpanded = false;

    const toggleEPSelector = () => {
        if (isExpanded) {
            currentToggleTimeout = null;
            let animationFrame = w.requestAnimationFrame(() => {
                if (currentToggleAnimationFrame === animationFrame) {
                    setMaxHeight(epButtonWrapper, getContentBoxHeight(epButtonWrapper), CSS_UNIT.PX);
                    animationFrame = w.requestAnimationFrame(() => {
                        if (currentToggleAnimationFrame === animationFrame) {
                            isExpanded = false;
                            replaceChildren(showMoreButton, ...showMoreButtonFoldedText);
                            setMaxHeight(epButtonWrapper, 30, CSS_UNIT.VH);
                            setPaddingBottom(epButtonWrapper, null);
                        }
                    });
                    currentToggleAnimationFrame = animationFrame;
                }
            });
            currentToggleAnimationFrame = animationFrame;
        } else {
            currentToggleAnimationFrame = null;
            isExpanded = true;
            replaceChildren(showMoreButton, ...showMoreButtonExpandedText);
            setMaxHeight(epButtonWrapper, getContentBoxHeight(epButtonWrapper), CSS_UNIT.PX);
            setPaddingBottom(epButtonWrapper, showMoreButton.scrollHeight, CSS_UNIT.PX);
            const timeout = addTimeout(() => {
                if (currentToggleTimeout === timeout) {
                    setMaxHeight(epButtonWrapper, null);
                }
            }, 400);
            currentToggleTimeout = timeout;
        }
    };
    addEventListener(showMoreButton, 'click', toggleEPSelector);

    let currentStylingTimeout: NodeJS.Timeout | null = null;
    let currentStylingAnimationFrame: number | null = null;
    let isOversized = false;
    const styleEPSelector = () => {
        setMinHeight(epButtonWrapper, null); // Need to remove min-height first to calculate the height accurately.
        const height = getContentBoxHeight(epButtonWrapper);
        const reachedThreshold = height > minHeight * 1.8;
        if (reachedThreshold) {
            setMinHeight(epButtonWrapper, minHeight * 1.8, CSS_UNIT.PX);
        }

        if (height / w.innerHeight > 0.40 && reachedThreshold) {
            if (isOversized) {
                if (isExpanded) {
                    setPaddingBottom(epButtonWrapper, showMoreButton.scrollHeight, CSS_UNIT.PX);
                }
                return;
            }
            currentStylingTimeout = null;
            currentToggleAnimationFrame = null;
            currentToggleTimeout = null;
            isOversized = true;
            isExpanded = false;
            let animationFrame = w.requestAnimationFrame(() => {
                if (currentStylingAnimationFrame === animationFrame) {
                    setMaxHeight(epButtonWrapper, getContentBoxHeight(epButtonWrapper), CSS_UNIT.PX); // Use `getContentBoxHeight` to get the most recent height.
                    animationFrame = w.requestAnimationFrame(() => {
                        if (currentStylingAnimationFrame === animationFrame) {
                            replaceChildren(showMoreButton, ...showMoreButtonFoldedText);
                            setMaxHeight(epButtonWrapper, 30, CSS_UNIT.VH);
                            setPaddingBottom(epButtonWrapper, null);
                            setVisibility(showMoreButton, true);
                            setOpacity(showMoreButton, 1);
                        }
                    });
                    currentStylingAnimationFrame = animationFrame;
                }
            });
            currentStylingAnimationFrame = animationFrame;
        } else {
            if (!isOversized) {
                return;
            }
            currentStylingAnimationFrame = null;
            currentToggleAnimationFrame = null;
            currentToggleTimeout = null;
            isOversized = false;
            setMaxHeight(epButtonWrapper, height, CSS_UNIT.PX);
            setOpacity(showMoreButton, 0);
            setPaddingBottom(epButtonWrapper, null);
            const timeout = addTimeout(() => {
                if (currentStylingTimeout === timeout) {
                    setMaxHeight(epButtonWrapper, null);
                    setVisibility(showMoreButton, false);
                }
            }, 400);
            currentStylingTimeout = timeout;
        }
    };

    styleEPSelector();
    addEventListener(w, 'resize', styleEPSelector);
}

function updateSeasonSelector(seasons: BangumiInfo.Seasons, seasonSelector: HTMLElement) {
    const seasonButtonWrapper = createDivElement();

    if (seasons.length !== 0) {
        for (const season of seasons) {
            const seasonButton = createDivElement();
            const seasonText = createParagraphElement(season.season_name);

            if (season.id !== seriesID) {
                const targetSeries = season.id;
                addEventListener(seasonButton, 'click', () => { goToEP(targetSeries, 1); });
            } else {
                addClass(seasonButton, styles.currentSeason);
            }
            appendChild(seasonButton, seasonText);
            appendChild(seasonButtonWrapper, seasonButton);
        }
        appendChild(seasonSelector, seasonButtonWrapper);
    } else {
        remove(seasonSelector);
    }
}

function goToEP(destSeries: string, destEp: number) {
    const url = TOP_URL + '/bangumi/' + destSeries + (destEp === 1 ? '' : ('?ep=' + destEp));
    redirect(url);
}

export function offload() {
    currentPage?.offload();
    dereferenceSharedVars();
    setErrorMessageElement(null);
}