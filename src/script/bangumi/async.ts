import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { appendText } from '../module/dom/element/text/append';
import { createTextNode } from '../module/dom/element/text/create';
import { createBRElement } from '../module/dom/element/br/create';
import { createHRElement } from '../module/dom/element/hr/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createSpanElement } from '../module/dom/element/span/create';
import { createDivElement } from '../module/dom/element/div/create';
import { insertBefore } from '../module/dom/node/insert_before';
import { remove } from '../module/dom/node/remove';
import { replaceChildren } from '../module/dom/node/replace_children';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { body } from '../module/dom/body';
import { getTitle } from '../module/dom/document/title/get';
import { setTitle } from '../module/dom/document/title/set';
import { w } from '../module/dom/window';
import { addEventListener } from '../module/event_listener/add';
import { parseCharacters, getContentBoxHeight, createMessageElem } from './helper';
import { buildURI } from '../module/string/uri/build';
import { encodeCloudfrontURIComponent } from '../module/string/uri/cloudfront/encode_component';
import { buildHttpForm } from '../module/string/http_form/build';
import { addTimeout } from '../module/timer/add/timeout';
import type { MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { redirect } from '../module/global/redirect';
import { pgid } from '../module/global/pgid';
import { audioImportPromise, imageImportPromise, videoImportPromise } from './page_import_promise';
import { SharedElement, getSharedElement, initializeSharedVars } from './shared_var';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { setVisibility } from '../module/style/visibility';
import { setOpacity } from '../module/style/opacity';
import { setPaddingBottom } from '../module/style/padding_bottom';
import { setMinHeight } from '../module/style/min_height';
import { setMaxHeight } from '../module/style/max_height';
import { CSS_COLOR } from '../module/style/color';
import { CSS_UNIT } from '../module/style/value/unit';
import * as styles from '../../css/bangumi.module.scss';
import { BangumiInfoKey, type BangumiInfo, EPInfoKey, type SeriesEP, type Seasons, SeasonKey, VideoEPInfo, AudioEPInfo, ImageEPInfo } from '../module/type/BangumiInfo';
import { BANGUMI_ROOT_URI, TOP_URI } from '../module/env/uri';
import { getCDNOrigin } from '../module/env/location/get/origin/cdn';
import { addAnimationFrame } from '../module/animation_frame/add';
import type { AnimationFrame } from '../module/animation_frame/type';
import type { Timeout } from '../module/timer/type';
import { removeAnimationFrame } from '../module/animation_frame/remove';
import { removeTimeout } from '../module/timer/remove/timeout';

let seriesID: string;
let epIndex: number;

export default async function (
    response: BangumiInfo,
    _seriesID: string,
    _epIndex: number,
    createMediaSessionPromise: Promise<MediaSessionInfo>,
) {
    seriesID = _seriesID;
    epIndex = _epIndex;

    const titleElem = createParagraphElement();
    addClass(titleElem, styles.title);
    appendChild(body, titleElem);

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
    const contentContainer = getSharedElement(SharedElement.CONTENT_CONTAINER);

    const epInfo = response[BangumiInfoKey.EP_INFO];
    const title = response[BangumiInfoKey.TITLE];
    const titleOverride = response[BangumiInfoKey.TITLE_OVERRIDE];
    if (titleOverride !== undefined) {
        appendText(titleElem, titleOverride);
        setTitle(parseCharacters(titleOverride) + ' | ' + getTitle());
    } else {
        appendText(titleElem, title);
        setTitle(parseCharacters(title) + '[' + response[BangumiInfoKey.SERIES_EP][epIndex] + '] | ' + getTitle());
    }

    updateEPSelector(response[BangumiInfoKey.SERIES_EP], epSelector);
    updateSeasonSelector(response[BangumiInfoKey.SEASONS], seasonSelector);

    let ageRestricted = epInfo[EPInfoKey.AGE_RESTRICTED];
    if (ageRestricted !== undefined) {
        ageRestricted = ageRestricted.toUpperCase();
        let warningTitle: Node[] | string = '年齢認証';
        if (ageRestricted === 'R15+' || ageRestricted === 'R18+') {
            warningTitle = [createTextNode('「' + ageRestricted + '指定」'), createBRElement(), createTextNode(warningTitle)];
        }

        const warningButtonGroup = createDivElement();
        addClass(warningButtonGroup, styles.warningButtonGroup);
        const warningButtonYes = createStyledButtonElement('はい');
        const warningButtonNo = createStyledButtonElement('いいえ');
        appendChild(warningButtonGroup, warningButtonYes);
        appendChild(warningButtonGroup, warningButtonNo);

        const warningElem = createMessageElem(warningTitle, [createTextNode('ここから先は年齢制限のかかっている作品を取り扱うページとなります。表示しますか？')], CSS_COLOR.RED, warningButtonGroup);
        addClass(warningElem, styles.warning);

        addEventListener(warningButtonYes, 'click', () => {
            hideElement(warningElem);
            showElement(contentContainer);
        });
        addEventListener(warningButtonNo, 'click', () => {
            redirect(TOP_URI);
        });

        hideElement(contentContainer);
        insertBefore(warningElem, contentContainer);
    }

    // Add Media
    const type = epInfo[EPInfoKey.TYPE];
    const seriesOverride = epInfo[EPInfoKey.SERIES_OVERRIDE];
    const baseURL = getCDNOrigin() + '/' + (seriesOverride === undefined ? seriesID : seriesOverride) + '/' + encodeCloudfrontURIComponent(epInfo[EPInfoKey.DIR]) + '/';

    const currentPgid = pgid;
    if (type === 'video') {
        const videoModule = await videoImportPromise;
        if (currentPgid !== pgid) {
            return;
        }
        videoModule.default(seriesID, epIndex, epInfo as VideoEPInfo, baseURL, createMediaSessionPromise);
    } else {
        if (type === 'audio') {
            const audioModule = await audioImportPromise;
            if (currentPgid !== pgid) {
                return;
            }
            audioModule.default(seriesID, epIndex, epInfo as AudioEPInfo, baseURL, createMediaSessionPromise, titleOverride ?? title);
        } else {
            const imageModule = await imageImportPromise;
            if (currentPgid !== pgid) {
                return;
            }
            imageModule.default(epInfo as ImageEPInfo, baseURL, createMediaSessionPromise);
        }
    }
}

function updateEPSelector(seriesEP: SeriesEP, epSelector: HTMLElement) {
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
        addEventListener(epButton, 'click', () => {
            goToEP(seriesID, targetEP);
        });
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

    let currentToggleTimeout: Timeout | null = null;
    let currentToggleAnimationFrame: AnimationFrame | null = null;
    const cleanupToggleTimeout = () => {
        if (currentToggleTimeout !== null) {
            removeTimeout(currentToggleTimeout);
            currentToggleTimeout = null;
        }
    };
    const cleanupToggleAnimationFrame = () => {
        if (currentToggleAnimationFrame !== null) {
            removeAnimationFrame(currentToggleAnimationFrame);
            currentToggleAnimationFrame = null;
        }
    };
    let isExpanded = false;
    let isOversized = false;
    const toggleEPSelector = () => {
        if (!isOversized) { // To prevent the button from being clicked when it is transitioning to transparent.
            return;
        }
        if (isExpanded) {
            cleanupToggleTimeout();
            currentToggleAnimationFrame = addAnimationFrame(() => {
                setMaxHeight(epButtonWrapper, getContentBoxHeight(epButtonWrapper), CSS_UNIT.PX);
                currentToggleAnimationFrame = addAnimationFrame(() => {
                    currentToggleAnimationFrame = null;
                    isExpanded = false;
                    replaceChildren(showMoreButton, ...showMoreButtonFoldedText);
                    setMaxHeight(epButtonWrapper, 30, CSS_UNIT.VH);
                    setPaddingBottom(epButtonWrapper, null);
                });
            });
        } else {
            cleanupToggleAnimationFrame();
            isExpanded = true;
            replaceChildren(showMoreButton, ...showMoreButtonExpandedText);
            setMaxHeight(epButtonWrapper, getContentBoxHeight(epButtonWrapper), CSS_UNIT.PX);
            setPaddingBottom(epButtonWrapper, showMoreButton.scrollHeight, CSS_UNIT.PX);
            currentToggleTimeout = addTimeout(() => {
                currentToggleTimeout = null;
                setMaxHeight(epButtonWrapper, null);
            }, 400);
        }
    };
    addEventListener(showMoreButton, 'click', toggleEPSelector);

    let currentStylingTimeout: Timeout | null = null;
    let currentStylingAnimationFrame: AnimationFrame | null = null;
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
            if (currentStylingTimeout !== null) {
                removeTimeout(currentStylingTimeout);
                currentStylingTimeout = null;
            }
            isOversized = true;
            isExpanded = false;
            currentStylingAnimationFrame = addAnimationFrame(() => {
                setMaxHeight(epButtonWrapper, getContentBoxHeight(epButtonWrapper), CSS_UNIT.PX); // Use `getContentBoxHeight` to get the most recent height.
                currentStylingAnimationFrame = addAnimationFrame(() => {
                    currentStylingAnimationFrame = null;
                    replaceChildren(showMoreButton, ...showMoreButtonFoldedText);
                    setMaxHeight(epButtonWrapper, 30, CSS_UNIT.VH);
                    setPaddingBottom(epButtonWrapper, null);
                    setVisibility(showMoreButton, true);
                    setOpacity(showMoreButton, 1);
                });
            });
        } else {
            if (!isOversized) {
                return;
            }
            if (currentStylingAnimationFrame !== null) {
                removeAnimationFrame(currentStylingAnimationFrame);
                currentStylingAnimationFrame = null;
            }
            cleanupToggleTimeout();
            cleanupToggleAnimationFrame();
            isOversized = false;
            setMaxHeight(epButtonWrapper, height, CSS_UNIT.PX);
            setOpacity(showMoreButton, 0);
            setPaddingBottom(epButtonWrapper, null);
            currentStylingTimeout = addTimeout(() => {
                currentStylingTimeout = null;
                setMaxHeight(epButtonWrapper, null);
                setVisibility(showMoreButton, false);
            }, 400);
        }
    };

    styleEPSelector();
    addEventListener(w, 'resize', styleEPSelector);
}

function updateSeasonSelector(seasons: Seasons, seasonSelector: HTMLElement) {
    const seasonButtonWrapper = createDivElement();

    if (seasons.length !== 0) {
        for (const season of seasons) {
            const seasonButton = createDivElement();
            const seasonText = createParagraphElement(season[SeasonKey.NAME]);

            const id = season[SeasonKey.ID];
            if (id !== seriesID) {
                const targetSeries = id;
                addEventListener(seasonButton, 'click', () => {
                    goToEP(targetSeries, 1);
                });
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
    redirect(
        buildURI(
            BANGUMI_ROOT_URI + destSeries,
            destEp === 1 ? '' : buildHttpForm({ ep: destEp }),
        ),
    );
}
