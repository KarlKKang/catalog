import {
    sendServerRequest,
} from '../module/main';
import {
    addEventListener,
    removeClass,
    getParent,
    getDescendantsByClassAt,
    getByClass
} from '../module/DOM';
import { completeCallback, getTable } from './helper';

function seriesCompleteCallback (response: string) {
    completeCallback(response, updateEventHandlers);
}

export function getSeriesTable() {
    getTable('series', updateEventHandlers);
}

function modifySeries(button: Element) {
    var record = getParent(getParent(button));
    var id = getDescendantsByClassAt(record, 'id', 0).innerHTML;
    var title = (getDescendantsByClassAt(record, 'title', 0) as HTMLTextAreaElement).value;
    var thumbnail = (getDescendantsByClassAt(record, 'thumbnail', 0) as HTMLTextAreaElement).value;
    var isPublic = (getDescendantsByClassAt(record, 'public', 0) as HTMLInputElement).checked;
    var series_id = (getDescendantsByClassAt(record, 'series-id', 0) as HTMLTextAreaElement).value;
    var season_name = (getDescendantsByClassAt(record, 'season-name', 0) as HTMLTextAreaElement).value;
    var season_order = (getDescendantsByClassAt(record, 'season-order', 0) as HTMLTextAreaElement).value;
    var keywords = (getDescendantsByClassAt(record, 'keywords', 0) as HTMLTextAreaElement).value;

    var parsedRecord = parseSeriesRecord(id, title, thumbnail, isPublic, series_id, season_name, season_order, keywords);
    if (!parsedRecord) {
        return;
    }

    var param = {
        command: 'modify',
        type: 'series',
        ...parsedRecord
    };

    var confirm;
    do {
        confirm = prompt('Type "modify" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm != "modify");

    sendServerRequest('console.php', {
        callback: seriesCompleteCallback,
        content: "p=" + encodeURIComponent(JSON.stringify(param))
    });
}

function deleteSeries(id: string) {

    var confirm;
    do {
        confirm = prompt('Type "delete" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm != "delete");

    var param = {
        command: 'delete',
        type: 'series',
        id: id
    };

    sendServerRequest('console.php', {
        callback: seriesCompleteCallback,
        content: "p=" + encodeURIComponent(JSON.stringify(param))
    });
}

function addSeries(button: Element) {
    var record = getParent(getParent(button));
    var id = (getDescendantsByClassAt(record, 'id', 0) as HTMLTextAreaElement).value;
    var title = (getDescendantsByClassAt(record, 'title', 0) as HTMLTextAreaElement).value;
    var thumbnail = (getDescendantsByClassAt(record, 'thumbnail', 0) as HTMLTextAreaElement).value;
    var series_id = (getDescendantsByClassAt(record, 'series-id', 0) as HTMLTextAreaElement).value;
    var season_name = (getDescendantsByClassAt(record, 'season-name', 0) as HTMLTextAreaElement).value;
    var season_order = (getDescendantsByClassAt(record, 'season-order', 0) as HTMLTextAreaElement).value;
    var keywords = (getDescendantsByClassAt(record, 'keywords', 0) as HTMLTextAreaElement).value;

    var parsedRecord = parseSeriesRecord(id, title, thumbnail, false, series_id, season_name, season_order, keywords);
    if (!parsedRecord) {
        return;
    }
    var param = {
        command: 'insert',
        type: 'series',
        ...parsedRecord
    }

    var confirm;
    do {
        confirm = prompt('Type "insert" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm != "insert");

    sendServerRequest('console.php', {
        callback: seriesCompleteCallback,
        content: "p=" + encodeURIComponent(JSON.stringify(param))
    });
}

function parseSeriesRecord(id: string, title: string, thumbnail: string, isPublic: boolean, series_id: string, season_name: string, season_order: string, keywords: string) {
    if (id == '') {
        alert("ERROR: 'id' is required");
        return false;
    }

    if (!/^[a-zA-Z0-9~_-]+$/.test(id)) {
        alert("ERROR: Invalid value for 'id'");
        return false;
    }

    if (title == '') {
        alert("ERROR: 'title' is required");
        return false;
    }

    if (thumbnail == '') {
        alert("ERROR: 'thumbnail' is required");
        return false;
    }

    let series_id_parsed: string | null;
    if (series_id == '') {
        series_id_parsed = null;
    } else if (!/^[a-zA-Z0-9~_-]+$/.test(id)) {
        alert("ERROR: Invalid value for 'series_id'");
        return false;
    } else {
        series_id_parsed = series_id;
    }

    let season_name_parsed: string | null;
    if (season_name == '') {
        if (series_id_parsed !== null) {
            alert("ERROR: 'season_name' must be specified when 'series_id' is specified");
            return false;
        }
        season_name_parsed = null;
    } else {
        season_name_parsed = season_name;
    }

    let season_order_parsed: number | null;
    if (season_order == '') {
        if (series_id_parsed !== null) {
            alert("ERROR: 'season_order' must be specified when 'series_id' is specified");
            return false;
        }
        season_order_parsed = null;
    } else {
        season_order_parsed = parseInt(season_order);
        if (isNaN(season_order_parsed)) {
            alert("ERROR: Invalid value for 'season_order'");
            return false;
        } else if (season_order_parsed > 255 || season_order_parsed < 0) {
            alert("ERROR: 'season_order' should be in range 0-255");
            return false;
        }
    }

    if (keywords == '') {
        alert("ERROR: 'keywords' is required");
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
        keywords: keywords
    };
}

function updateSeriesTime(id: string) {
    var param = {
        command: 'updatetime',
        type: 'series',
        id: id
    };

    sendServerRequest('console.php', {
        callback: seriesCompleteCallback,
        content: "p=" + encodeURIComponent(JSON.stringify(param))
    });
}

function updateEventHandlers() {
    var buttons = getByClass('add-series');

    for (let button of buttons) {
        removeClass(button, 'add-series');
        addEventListener(button, 'click', function () {
            addSeries(button);
        });
    }

    buttons = getByClass('modify-series');
    for (let button of buttons) {
        removeClass(button, 'modify-series');
        addEventListener(button, 'click', function () {
            modifySeries(button);
        });
    }

    buttons = getByClass('update-series-time');
    for (let button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        removeClass(button, 'update-series-time');
        addEventListener(button, 'click', function () {
            if (button.dataset.id === undefined) {
                alert("ERROR: 'id' attribute on the element is undefined.");
                return;
            }
            updateSeriesTime(button.dataset.id);
        });
    }

    buttons = getByClass('delete-series');
    for (let button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        removeClass(button, 'delete-series');
        addEventListener(button, 'click', function () {
            if (button.dataset.id === undefined) {
                alert("ERROR: 'id' attribute on the element is undefined.");
                return;
            }
            deleteSeries(button.dataset.id);
        });
    }
}