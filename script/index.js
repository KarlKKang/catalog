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
	var eps = xml.querySelectorAll(permittedType);
	var resultEP = [];
	var result = [];
	if (permittedID.length == 0) {
		resultEP = eps;
	} else {
		for (var i = 0; i < eps.length; i++) {
			if (permittedID.includes(eps[i].childNodes[0].nodeValue))
				resultEP.push(eps[i]);
		}
	}
	
	if (resultEP.length == 0)
		alert('Error: no item is permitted for this account.');

	result.push(resultEP[0].parentNode);
	
	for (i = 0; i < eps.length; i++) {
		if (eps[i].parentNode!=result[result.length-1]) {
			result.push(eps[i].parentNode);
		}
	}
	return result;
}

function firstAvailableID (index) {
	var ids = series[index].querySelectorAll(permittedType);
	if (permittedID.length != 0){
		for (var i = 0; i < ids.length; i++) {
			if (permittedID.includes(ids[i].childNodes[0].nodeValue)) {
				return ids[i].childNodes[0].nodeValue;
			}
		}
	}
	return ids[0].childNodes[0].nodeValue;
}