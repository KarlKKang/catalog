// JavaScript Document
import "core-js";
import {
	debug,
	navListeners,
	redirect,
	topURL,
	sendServerRequest,
	message,
	getURLParam,
	cdnURL,
    clearCookies,
    cssVarWrapper,
    getHref
} from './helper/main.js';
import cssVars from 'css-vars-ponyfill';

var lazyloadInitialize;

var searchBar;
var searchBarInput;
	
var offset=0;
	
var keywords = '';
var pivot = '';


window.addEventListener("load", function(){
    cssVarWrapper(cssVars);
	clearCookies();
	
	if (!getHref().startsWith('https://featherine.com') && !debug) {
		window.location.replace(topURL);
		return;
	}
		
	if (getURLParam ('series') != null) {
        window.location.replace(redirect(debug?'bangumi.html':(topURL+'/bangumi/')));
        return;
    }
	
	searchBar = document.getElementById('search-bar');
    searchBarInput = searchBar.getElementsByTagName('input')[0];
	
	updateKeywords ();

    sendServerRequest('get_series.php', {
        callback: function (response) {
            var series;
            try {
                series = JSON.parse(response);
            } catch (e) {
                message.show(message.template.param.server.invalidResponse);
                return;
            }
            import(
                /* webpackChunkName: "lazyload" */
                /* webpackExports: ["default"] */
                './helper/lazyload.js'
            ).then(({default: defaultModule}) => {
				lazyloadInitialize = defaultModule;
                document.addEventListener('scroll', infiniteScrolling);
                window.addEventListener("resize", infiniteScrolling);
                showSeries (series);
                navListeners();
                document.body.classList.remove("hidden");
			}).catch((e) => {
				message.show(message.template.param.moduleImportError(e));
			});
        }, 
        content: keywords+"offset=0"
    });

    searchBar.getElementsByClassName('icon')[0].addEventListener('click', function () {
		if (!searchBarInput.disabled) {
			search ();
		}
    });
    searchBarInput.addEventListener('keyup', function () {
        if (event.key === "Enter") {
            search ();
        }
    });
});




function showSeries (series) {
    for (var i=0; i<series.length-1; i++) {

        let seriesNode = document.createElement('div');
        let thumbnailNode = document.createElement('div');
        let overlay = document.createElement('div');
        let titleNode = document.createElement('p');

        seriesNode.appendChild(thumbnailNode);
        seriesNode.appendChild(titleNode);

        overlay.classList.add('overlay');
        thumbnailNode.appendChild(overlay);
        thumbnailNode.classList.add('lazyload');
        thumbnailNode.dataset.src = cdnURL + '/thumbnails/' + series[i].thumbnail;
        thumbnailNode.dataset.alt = 'thumbnail: ' + series[i].thumbnail;
        titleNode.innerHTML = series[i].title;

        let index = i;
        seriesNode.addEventListener("click", function(){goToSeries (series[index].id);});
        seriesNode.classList.add('series');

        document.getElementById('container').appendChild(seriesNode);
    }
    
    offset = series[series.length-1];
    
    if (offset != 'EOF' && keywords != '') {
        pivot = 'pivot=' + series[series.length-2].id + '&';
    } else {
        pivot = '';
    }

    lazyloadInitialize ();

    document.getElementById('position-detector').classList.remove('loading');
    infiniteScrolling ();
}

function goToSeries (id) {
    var url;
    if (debug) {
        url = 'bangumi.html'+'?series='+id;
    } else {
        url = topURL+'/bangumi/'+id;
    }
    window.location.href = url;
}

function search () {
    disableSearchBarInput(true);
    
    document.getElementById('position-detector').classList.add('loading');

    var searchBarInputValue = searchBarInput.value.substring(0, 50);
    
    if (searchBarInputValue == '') {
        keywords = "";
        history.pushState(null, '', topURL);
    } else {
        keywords = "keywords="+encodeURIComponent(searchBarInputValue);
        history.pushState(null, '', topURL + '?' + keywords);
        keywords += '&';
    }
    
    requestSearchResults ();
}

function requestSearchResults () {
    sendServerRequest('get_series.php', {
        callback: function (response) {
            var series;
            try {
                series = JSON.parse(response);
            } catch (e) {
                message.show(message.template.param.server.invalidResponse);
                return;
            }
            document.getElementById('container').classList.add('transparent');
            setTimeout (function () {
                document.getElementById('container').innerHTML='';
                offset = 0;
                showSeries (series);
                document.getElementById('container').classList.remove('transparent');
                disableSearchBarInput(false);
            }, 400);
        },
        content: keywords+"offset=0"
    });
}

window.addEventListener('popstate', function () {
    updateKeywords ();
    requestSearchResults ();
});

function updateKeywords () {
    keywords = getURLParam ('keywords');
    if (keywords == null) {
        keywords = "";
        searchBarInput.value = '';
    } else {
        keywords = decodeURIComponent(keywords).substring(0, 50);
        searchBarInput.value = keywords;
        keywords = "keywords=" + encodeURIComponent(keywords) + "&";
    }
}

function infiniteScrolling () {
    var detector = document.getElementById('position-detector');
    var boundingRect = detector.getBoundingClientRect();
    var viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    if (boundingRect.top-256-24<=viewportHeight*1.5 && offset != 'EOF' && !detector.classList.contains('loading')) {
        detector.classList.add('loading');

        sendServerRequest('get_series.php', {
            callback: function (response) {
                var series;
                try {
                    series = JSON.parse(response);
                } catch (e) {
                    message.show(message.template.param.server.invalidResponse);
                    return;
                }
                showSeries (series);
            },
            content: keywords + pivot + "offset=" + offset
        });
    }
}

function disableSearchBarInput (disabled) {
    searchBarInput.disabled = disabled;
    if (disabled) {
        searchBar.classList.add('disabled');
    } else {
        searchBar.classList.remove('disabled');
    }
}