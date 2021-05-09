// JavaScript Document
var series;

function initialize () {
	if (getURLParam ('ep') != null) {
		window.location.href = redirect('bangumi.html');
		return 0;
	}
	
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			showSeries(this.responseXML);
		}
	};
	xhttp.open("GET", "xml/series.xml", true);
	xhttp.send();
}

function showSeries (xml) {
	series = filterSeries (xml);
	
	for (var i=0; i<series.length; i++) {
		let index = i;
		
		var seriesNode = document.createElement('div');
		var thumbnailNode = document.createElement('div');
		var titleNode = document.createElement('p');
		var keywordNode = document.createElement('div');
		
		thumbnailNode.style.backgroundImage = 'url(' + resourceURL + 'thumbnail/' + encodeURI(series[i].getAttribute("thumbnail")) + ')';
		titleNode.innerHTML = series[i].getAttribute("title");
		keywordNode.classList.add('keyword');
		keywordNode.innerHTML = series[i].getElementsByTagName('keyword')[0].childNodes[0].nodeValue;
		
		seriesNode.appendChild(thumbnailNode);
		seriesNode.appendChild(titleNode);
		seriesNode.appendChild(keywordNode);
		
		seriesNode.addEventListener("click", function(){goToSeries (index);});
		seriesNode.classList.add('series');
		
		document.getElementById('container').appendChild(seriesNode);
	}
	
	document.getElementById('search-bar').getElementsByClassName('icon')[0].onclick = search;
	document.getElementById('search-bar').getElementsByTagName('input')[0].addEventListener('keyup', function () {
		if (event.key === "Enter") {
			search ();
		}
	});
}

function goToSeries (index) {
	var url = 'bangumi.html?ep=' + firstAvailableID (index);
	window.location.href = url;
}

function filterSeries (xml) {
	var EPs = xml.querySelectorAll('video, image, audio');
	var result = [];
	
	for (var i = 0; i < EPs.length; i++) {
		if (permittedEPs.includes(EPs[i].childNodes[0].nodeValue) && !result.includes(EPs[i].parentNode))
			result.push(EPs[i].parentNode);
	}
	return result;
}

function firstAvailableID (index) {
	var EPs = series[index].querySelectorAll('video, image, audio');
	for (var i = 0; i < EPs.length; i++) {
		if (permittedEPs.includes(EPs[i].childNodes[0].nodeValue)) {
			return EPs[i].childNodes[0].nodeValue;
		}
	}
}

function search () {
	var seriesNodes = document.getElementsByClassName('series');
	var keywords = '';
	var searchWords = document.getElementById('search-bar').getElementsByTagName('input')[0].value.toLowerCase().split(' ');
	
	document.getElementById('container').style.opacity = 0;
	setTimeout (function () {
		if (searchWords[0] == '') {
			for (var i = 0; i < seriesNodes.length; i++)
				seriesNodes[i].style.display = 'initial';
		} else {
			for (var i = 0; i < seriesNodes.length; i++) {
				keywords = seriesNodes[i].getElementsByClassName('keyword')[0].innerHTML.toLowerCase().split(' ');
				seriesNodes[i].style.display = 'initial';
				innerLoop:
				for (var j = 0; j < searchWords.length; j++) {
					if (!keywords.includes(searchWords[j]) && !keywords.join('').includes(searchWords[j])){
						seriesNodes[i].style.display = 'none';
						break innerLoop;
					}
				}
			}
		}
		document.getElementById('container').style.opacity = 1;
	}, 400);
}