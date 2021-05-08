// JavaScript Document
var series;

function initialize () {
	if (getURLParam ('ep') != null) {
		window.location.href = generateURL('bangumi.html');
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
		
		thumbnailNode.style.backgroundImage = 'url(' + resourceURL + 'thumbnail/' + encodeURI(series[i].getAttribute("thumbnail")) + ')';
		titleNode.innerHTML = series[i].getAttribute("title");
		
		seriesNode.appendChild(thumbnailNode);
		seriesNode.appendChild(titleNode);
		
		seriesNode.addEventListener("click", function(){goToSeries (index);});
		
		document.getElementById('container').appendChild(seriesNode);
	}
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