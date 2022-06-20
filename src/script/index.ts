// JavaScript Document
import "core-js";
import {
	debug,
	navListeners,
	urlWithParam,
	topURL,
	sendServerRequest,
	message,
	getURLParam,
	cdnURL,
    clearCookies,
    cssVarWrapper,

    w,
    addEventListener,
    getHref,
    redirect,
    getById,
    getDescendantsByTag,
    getDescendantsByClassAt,
    removeClass,
    getBody,
    createElement,
    addClass,
    changeURL,
    containsClass,
    d,
    appendChild,

    type
} from './module/main';
import {default as importLazyload} from './module/lazyload';

var lazyloadInitialize: ()=>void;

var searchBar: HTMLElement;
var searchBarInput: HTMLInputElement;

var containerElem: HTMLElement;
	
var offset: type.SeriesInfo.OffsetInfo = 0;
	
var keywords = '';
var pivot = '';



addEventListener(w, 'load', function(){
    cssVarWrapper();
	clearCookies();
	
	if (!getHref().startsWith('https://featherine.com') && !debug) {
        redirect(topURL, true);
		return;
	}
		
	if (getURLParam ('series') != null) {
        redirect(urlWithParam(debug?'bangumi.html':(topURL+'/bangumi/')), true);
        return;
    }
	
	searchBar = getById('search-bar');
    searchBarInput = getDescendantsByTag(searchBar, 'input')[0] as HTMLInputElement;

    containerElem = getById('container');
	
	getURLKeywords();
    getSeries(async function(showSeriesCallback) {
	    lazyloadInitialize = await importLazyload();

        showSeriesCallback();
        addEventListener(d, 'scroll', infiniteScrolling);
        addEventListener(w, 'resize', infiniteScrolling);
        navListeners();
        addEventListener(getDescendantsByClassAt(searchBar, 'icon', 0), 'click', function () {
            if (!searchBarInput.disabled) {
                search();
            }
        });
        addEventListener(searchBarInput, 'keyup', function (event) {
            if ((event as KeyboardEvent).key === "Enter") {
                search();
            }
        });
        removeClass(getBody(), "hidden");
    });
});




function showSeries (seriesInfo: type.SeriesInfo.SeriesInfo) {
    var seriesEntries = seriesInfo.slice(0, -1) as type.SeriesInfo.SeriesEntries;
    for (let seriesEntry of seriesEntries) {
        let seriesNode = createElement('div');
        let thumbnailNode = createElement('div');
        let overlay = createElement('div');
        let titleNode = createElement('p');

        appendChild(seriesNode, thumbnailNode);
        appendChild(seriesNode, titleNode);

        addClass(overlay, 'overlay');
        appendChild(thumbnailNode, overlay);
        addClass(thumbnailNode, 'lazyload');
        thumbnailNode.dataset.src = cdnURL + '/thumbnails/' + seriesEntry.thumbnail;
        thumbnailNode.dataset.alt = 'thumbnail: ' + seriesEntry.thumbnail;
        titleNode.innerHTML = seriesEntry.title;

        addEventListener(seriesNode, 'click', function(){goToSeries (seriesEntry.id);});
        addClass(seriesNode, 'series')

        appendChild(containerElem, seriesNode);
    }
    
    offset = seriesInfo[seriesInfo.length-1] as type.SeriesInfo.OffsetInfo;
    
    if (offset != 'EOF' && keywords != '') {
        pivot = 'pivot=' + (seriesEntries[seriesEntries.length-1] as type.SeriesInfo.SeriesEntry).id + '&';
    } else {
        pivot = '';
    }

    lazyloadInitialize();

    removeClass(getById('position-detector'), 'loading');
    infiniteScrolling();
}

function goToSeries (id: string) {
    var url;
    if (debug) {
        url = 'bangumi.html'+'?series='+id;
    } else {
        url = topURL+'/bangumi/'+id;
    }
    redirect(url);
}

function search () {
    disableSearchBarInput(true);
    
    addClass(getById('position-detector'), 'loading');

    var searchBarInputValue = searchBarInput.value.substring(0, 50);
    
    if (searchBarInputValue == '') {
        keywords = "";
        changeURL(topURL);
    } else {
        keywords = "keywords="+encodeURIComponent(searchBarInputValue);
        changeURL(topURL + '?' + keywords);
        keywords += '&';
    }
    requestSearchResults();
}

addEventListener(w, 'popstate', function(){
    getURLKeywords();
    requestSearchResults();
});

function getURLKeywords () {
    var urlParam = getURLParam ('keywords');
    if (urlParam == null) {
        keywords = "";
        searchBarInput.value = '';
    } else {
        keywords = decodeURIComponent(urlParam).substring(0, 50);
        searchBarInput.value = keywords;
        keywords = "keywords=" + encodeURIComponent(keywords) + "&";
    }
}

function getSeries (callback?: (showSeriesCallback: ()=>void)=>(void | Promise<void>)) {
    sendServerRequest('get_series.php', {
        callback: function (response: string) {
            var parsedResponse: any;
            try {
                parsedResponse = JSON.parse(response);
                type.SeriesInfo.check(parsedResponse);
            } catch (e) {
                message.show(message.template.param.server.invalidResponse);
                return;
            }

            if (callback === undefined) {
                showSeries (parsedResponse as type.SeriesInfo.SeriesInfo);
            } else {
                callback(function () {
                    showSeries (parsedResponse as type.SeriesInfo.SeriesInfo);
                });
            }
        },
        content: keywords + pivot + "offset=" + offset
    });
}

function infiniteScrolling () {
    var detector = getById('position-detector');
    var boundingRect = detector.getBoundingClientRect();
    var viewportHeight = Math.max(d.documentElement.clientHeight || 0, w.innerHeight || 0);

    if (boundingRect.top-256-24<=viewportHeight*1.5 && offset != 'EOF' && !containsClass(detector, 'loading')) { 
        addClass(detector, 'loading');
        getSeries();
    }
}

function requestSearchResults () {
    offset = 0;
    pivot = '';

    getSeries(function (showSeriesCallback) {
        addClass(containerElem, 'transparent');
        setTimeout (function () {
            containerElem.innerHTML='';
            showSeriesCallback();
            removeClass(containerElem, 'transparent');
            disableSearchBarInput(false);
        }, 400);
    });
}

function disableSearchBarInput (disabled: boolean) {
    searchBarInput.disabled = disabled;
    if (disabled) {
        addClass(searchBar, 'disabled');
    } else {
        removeClass(searchBar, 'disabled');
    }
}