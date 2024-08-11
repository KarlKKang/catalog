import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { getDescendantsByClass, getDescendantsByClassAt, getParentElement } from '../module/dom/get_element';
import { getDataAttribute } from '../module/dom/attr/data/get';
import { addClass } from '../module/dom/class/add';
import { containsClass } from '../module/dom/class/contains';
import { addEventListener } from '../module/event_listener';
import { completeCallback, getTable, initializedClass } from './helper';
import { buildURLForm } from '../module/http_form';

function seriesCompleteCallback(response: string) {
    completeCallback(response, updateEventHandlers);
}

export function getSeriesTable() {
    getTable('series', updateEventHandlers);
}

function modifySeries(button: Element) {
    const record = getParentElement(getParentElement(button));
    const id = getDescendantsByClassAt(record, 'id', 0).innerHTML;
    const title = (getDescendantsByClassAt(record, 'title', 0) as HTMLTextAreaElement).value;
    const thumbnail = (getDescendantsByClassAt(record, 'thumbnail', 0) as HTMLTextAreaElement).value;
    const isPublic = (getDescendantsByClassAt(record, 'public', 0) as HTMLInputElement).checked;
    const series_id = (getDescendantsByClassAt(record, 'series-id', 0) as HTMLTextAreaElement).value;
    const season_name = (getDescendantsByClassAt(record, 'season-name', 0) as HTMLTextAreaElement).value;
    const season_order = (getDescendantsByClassAt(record, 'season-order', 0) as HTMLTextAreaElement).value;
    const keywords = (getDescendantsByClassAt(record, 'keywords', 0) as HTMLTextAreaElement).value;

    const parsedRecord = parseSeriesRecord(id, title, thumbnail, isPublic, series_id, season_name, season_order, keywords);
    if (!parsedRecord) {
        return;
    }

    const param = {
        command: 'modify',
        type: 'series',
        ...parsedRecord,
    };

    let confirm;
    do {
        confirm = prompt('Type "modify" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm !== 'modify');

    sendServerRequest('console', {
        [ServerRequestOptionKey.CALLBACK]: seriesCompleteCallback,
        [ServerRequestOptionKey.CONTENT]: buildURLForm({ p: JSON.stringify(param) }),
    });
}

function deleteSeries(id: string) {
    let confirm;
    do {
        confirm = prompt('Type "delete" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm !== 'delete');

    const param = {
        command: 'delete',
        type: 'series',
        id: id,
    };

    sendServerRequest('console', {
        [ServerRequestOptionKey.CALLBACK]: seriesCompleteCallback,
        [ServerRequestOptionKey.CONTENT]: buildURLForm({ p: JSON.stringify(param) }),
    });
}

function addSeries(button: Element) {
    const record = getParentElement(getParentElement(button));
    const id = (getDescendantsByClassAt(record, 'id', 0) as HTMLTextAreaElement).value;
    const title = (getDescendantsByClassAt(record, 'title', 0) as HTMLTextAreaElement).value;
    const thumbnail = (getDescendantsByClassAt(record, 'thumbnail', 0) as HTMLTextAreaElement).value;
    const series_id = (getDescendantsByClassAt(record, 'series-id', 0) as HTMLTextAreaElement).value;
    const season_name = (getDescendantsByClassAt(record, 'season-name', 0) as HTMLTextAreaElement).value;
    const season_order = (getDescendantsByClassAt(record, 'season-order', 0) as HTMLTextAreaElement).value;
    const keywords = (getDescendantsByClassAt(record, 'keywords', 0) as HTMLTextAreaElement).value;

    const parsedRecord = parseSeriesRecord(id, title, thumbnail, false, series_id, season_name, season_order, keywords);
    if (!parsedRecord) {
        return;
    }
    const param = {
        command: 'insert',
        type: 'series',
        ...parsedRecord,
    };

    let confirm;
    do {
        confirm = prompt('Type "insert" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm !== 'insert');

    sendServerRequest('console', {
        [ServerRequestOptionKey.CALLBACK]: seriesCompleteCallback,
        [ServerRequestOptionKey.CONTENT]: buildURLForm({ p: JSON.stringify(param) }),
    });
}

function parseSeriesRecord(id: string, title: string, thumbnail: string, isPublic: boolean, series_id: string, season_name: string, season_order: string, keywords: string) {
    if (id === '') {
        alert('ERROR: "id" is required');
        return false;
    }

    if (!/^[a-zA-Z0-9~_-]+$/.test(id)) {
        alert('ERROR: Invalid value for "id"');
        return false;
    }

    if (title === '') {
        alert('ERROR: "title" is required');
        return false;
    }

    if (thumbnail === '') {
        alert('ERROR: "thumbnail" is required');
        return false;
    }

    let series_id_parsed: string | null;
    if (series_id === '') {
        series_id_parsed = null;
    } else if (!/^[a-zA-Z0-9~_-]+$/.test(id)) {
        alert('ERROR: Invalid value for "series_id"');
        return false;
    } else {
        series_id_parsed = series_id;
    }

    let season_name_parsed: string | null;
    if (season_name === '') {
        if (series_id_parsed !== null) {
            alert('ERROR: "season_name" must be specified when "series_id" is specified');
            return false;
        }
        season_name_parsed = null;
    } else {
        season_name_parsed = season_name;
    }

    let season_order_parsed: number | null;
    if (season_order === '') {
        if (series_id_parsed !== null) {
            alert('ERROR: "season_order" must be specified when "series_id" is specified');
            return false;
        }
        season_order_parsed = null;
    } else {
        season_order_parsed = parseInt(season_order);
        if (isNaN(season_order_parsed)) {
            alert('ERROR: Invalid value for "season_order"');
            return false;
        } else if (season_order_parsed > 255 || season_order_parsed < 0) {
            alert('ERROR: "season_order" should be in range 0-255');
            return false;
        }
    }

    if (keywords === '') {
        alert('ERROR: "keywords" is required');
        return false;
    }

    return {
        id: id,
        title: title,
        thumbnail: thumbnail,
        public: isPublic,
        series_id: series_id_parsed,
        season_name: season_name_parsed,
        season_order: season_order_parsed,
        keywords: keywords,
    };
}

function updateSeriesTime(id: string) {
    const param = {
        command: 'updatetime',
        type: 'series',
        id: id,
    };

    sendServerRequest('console', {
        [ServerRequestOptionKey.CALLBACK]: seriesCompleteCallback,
        [ServerRequestOptionKey.CONTENT]: buildURLForm({ p: JSON.stringify(param) }),
    });
}

function updateEventHandlers(outputElem: HTMLElement) {
    let buttons = getDescendantsByClass(outputElem, 'add-series');
    for (const button of buttons) {
        if (!containsClass(button, initializedClass)) {
            addClass(button, initializedClass);
            addEventListener(button, 'click', () => {
                addSeries(button);
            });
        }
    }

    buttons = getDescendantsByClass(outputElem, 'modify-series');
    for (const button of buttons) {
        if (!containsClass(button, initializedClass)) {
            addClass(button, initializedClass);
            addEventListener(button, 'click', () => {
                modifySeries(button);
            });
        }
    }

    buttons = getDescendantsByClass(outputElem, 'update-series-time');
    for (const button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, initializedClass)) {
            addClass(button, initializedClass);
            addEventListener(button, 'click', () => {
                const id = getDataAttribute(button, 'id');
                if (id === null) {
                    alert('ERROR: "id" attribute on the element is undefined.');
                    return;
                }
                updateSeriesTime(id);
            });
        }
    }

    buttons = getDescendantsByClass(outputElem, 'delete-series');
    for (const button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, initializedClass)) {
            addClass(button, initializedClass);
            addEventListener(button, 'click', () => {
                const id = getDataAttribute(button, 'id');
                if (id === null) {
                    alert('ERROR: "id" attribute on the element is undefined.');
                    return;
                }
                deleteSeries(id);
            });
        }
    }
}
