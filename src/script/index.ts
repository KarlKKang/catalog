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
    DOM,
    type
} from './module/main';
import type {default as LazyloadInitialize} from './module/lazyload';

var lazyloadInitialize: typeof LazyloadInitialize;

var searchBar: HTMLElement;
var searchBarInput: HTMLInputElement;

var containerElem: HTMLElement;
	
var offset: type.SeriesInfo.OffsetInfo = 0;
	
var keywords = '';
var pivot = '';



DOM.addEventListener(DOM.w, 'load', function(){
    cssVarWrapper();
	clearCookies();
	
	if (!DOM.getHref().startsWith('https://featherine.com') && !debug) {
        DOM.redirect(topURL, true);
		return;
	}
		
	if (getURLParam ('series') != null) {
        DOM.redirect(urlWithParam(debug?'bangumi.html':(topURL+'/bangumi/')), true);
        return;
    }
	
	searchBar = DOM.getById('search-bar');
    searchBarInput = DOM.getDescendantsByTag(searchBar, 'input')[0] as HTMLInputElement;

    containerElem = DOM.getById('container');
	
	getURLKeywords();
    getSeries(async function(showSeriesCallback) {
        try {
			let {default: defaultModule} = await import(
                /* webpackChunkName: "lazyload" */
                /* webpackExports: ["default"] */
                './module/lazyload'
            );
			lazyloadInitialize = defaultModule;
		} catch(e: unknown) {
			message.show (message.template.param.moduleImportError(e));
            return;
		}

        showSeriesCallback();
        DOM.addEventListener(DOM.d, 'scroll', infiniteScrolling);
        DOM.addEventListener(DOM.w, 'resize', infiniteScrolling);
        navListeners();
        DOM.addEventListener(DOM.getDescendantsByClassAt(searchBar, 'icon', 0), 'click', function () {
            if (!searchBarInput.disabled) {
                search();
            }
        });
        DOM.addEventListener(searchBarInput, 'keyup', function (event) {
            if ((event as KeyboardEvent).key === "Enter") {
                search();
            }
        });
        DOM.removeClass(DOM.getBody(), "hidden");
    });
});




function showSeries (seriesInfo: type.SeriesInfo.SeriesInfo) {
    var seriesEntries = seriesInfo.slice(0, -1) as type.SeriesInfo.SeriesEntries;
    for (let seriesEntry of seriesEntries) {
        let seriesNode = DOM.createElement('div');
        let thumbnailNode = DOM.createElement('div');
        let overlay = DOM.createElement('div');
        let titleNode = DOM.createElement('p');

        seriesNode.appendChild(thumbnailNode);
        seriesNode.appendChild(titleNode);

        DOM.addClass(overlay, 'overlay');
        thumbnailNode.appendChild(overlay);
        DOM.addClass(thumbnailNode, 'lazyload');
        thumbnailNode.dataset.src = cdnURL + '/thumbnails/' + seriesEntry.thumbnail;
        thumbnailNode.dataset.alt = 'thumbnail: ' + seriesEntry.thumbnail;
        titleNode.innerHTML = seriesEntry.title;

        DOM.addEventListener(seriesNode, 'click', function(){goToSeries (seriesEntry.id);});
        DOM.addClass(seriesNode, 'series')

        containerElem.appendChild(seriesNode);
    }
    
    offset = seriesInfo[seriesInfo.length-1] as type.SeriesInfo.OffsetInfo;
    
    if (offset != 'EOF' && keywords != '') {
        pivot = 'pivot=' + (seriesEntries[seriesEntries.length-1] as type.SeriesInfo.SeriesEntry).id + '&';
    } else {
        pivot = '';
    }

    lazyloadInitialize();

    DOM.removeClass(DOM.getById('position-detector'), 'loading');
    infiniteScrolling();
}

function goToSeries (id: string) {
    var url;
    if (debug) {
        url = 'bangumi.html'+'?series='+id;
    } else {
        url = topURL+'/bangumi/'+id;
    }
    DOM.redirect(url);
}

function search () {
    disableSearchBarInput(true);
    
    DOM.addClass(DOM.getById('position-detector'), 'loading');

    var searchBarInputValue = searchBarInput.value.substring(0, 50);
    
    if (searchBarInputValue == '') {
        keywords = "";
        DOM.changeURL(topURL);
    } else {
        keywords = "keywords="+encodeURIComponent(searchBarInputValue);
        DOM.changeURL(topURL + '?' + keywords);
        keywords += '&';
    }
    requestSearchResults();
}

DOM.addEventListener(DOM.w, 'popstate', function(){
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
    var detector = DOM.getById('position-detector');
    var boundingRect = detector.getBoundingClientRect();
    var viewportHeight = Math.max(DOM.d.documentElement.clientHeight || 0, DOM.w.innerHeight || 0);

    if (boundingRect.top-256-24<=viewportHeight*1.5 && offset != 'EOF' && !DOM.containsClass(detector, 'loading')) { 
        DOM.addClass(detector, 'loading');
        getSeries();
    }
}

function requestSearchResults () {
    offset = 0;
    pivot = '';

    getSeries(function (showSeriesCallback) {
        DOM.addClass(containerElem, 'transparent');
        setTimeout (function () {
            containerElem.innerHTML='';
            showSeriesCallback();
            DOM.removeClass(containerElem, 'transparent');
            disableSearchBarInput(false);
        }, 400);
    });
}

function disableSearchBarInput (disabled: boolean) {
    searchBarInput.disabled = disabled;
    if (disabled) {
        DOM.addClass(searchBar, 'disabled');
    } else {
        DOM.removeClass(searchBar, 'disabled');
    }
}