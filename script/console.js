// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/console.html') && !debug) {
		window.location.href = window.location.href = 'https://featherine.com/console.html';
	}
	
    start ('console');
});

/*------------------------------------------------------------------------------------Series Functions------------------------------------------------------------------------------------*/

function initialize () {
	
	var param = {
		'command': 'authenticate'
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (response)) {
				if (!this.responseText.includes ('APPROVED')) {
					logout(true);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&p="+encodeURIComponent(param));
	
}

function getSeriesTable () {
	var param = {
		'command': 'get',
		'table': 'series'
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				setOutput (this.responseText);
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&p="+encodeURIComponent(param));
}

function modifySeries (button) {
	var record = button.parentNode.parentNode;
	var id = record.getElementsByClassName('id')[0].innerHTML;
	var title = record.getElementsByClassName('title')[0].value;
	var thumbnail = record.getElementsByClassName('thumbnail')[0].value;
	var isPublic = record.getElementsByClassName('public')[0].checked;
	var series_id = record.getElementsByClassName('series-id')[0].value;
	var season_name = record.getElementsByClassName('season-name')[0].value;
	var season_order = record.getElementsByClassName('season-order')[0].value;
	var keywords = record.getElementsByClassName('keywords')[0].value;
	
	var param = parseSeriesRecord (id, title, thumbnail, isPublic, series_id, season_name, season_order, keywords);
	if (!param) {
		return 0;
	}
	
	param.command = 'modify';
	param.table = 'series';
	param = JSON.stringify (param);

	var confirm;
	do {
		confirm = prompt('Type "modify" to confirm');
		if (confirm == null) {
			return 0;
		}
	} while (confirm != "modify");

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&p="+encodeURIComponent(param));
}

function deleteSeries (id) {
	
	var confirm;
	do {
		confirm = prompt('Type "delete" to confirm. This operation will also delete the EP table for this series');
		if (confirm == null) {
			return 0;
		}
	} while (confirm != "delete");
	
	var param = {
		'command': 'delete',
		'table': 'series',
		'id': id
	};
	param = JSON.stringify (param);

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&p="+encodeURIComponent(param));
}

function addSeries (button) {
	var record = button.parentNode.parentNode;
	var id = record.getElementsByClassName('id')[0].value;
	var title = record.getElementsByClassName('title')[0].value;
	var thumbnail = record.getElementsByClassName('thumbnail')[0].value;
	var isPublic = record.getElementsByClassName('public')[0].checked;
	var series_id = record.getElementsByClassName('series-id')[0].value;
	var season_name = record.getElementsByClassName('season-name')[0].value;
	var season_order = record.getElementsByClassName('season-order')[0].value;
	var keywords = record.getElementsByClassName('keywords')[0].value;
	
	var param = parseSeriesRecord (id, title, thumbnail, isPublic, series_id, season_name, season_order, keywords);
	if (!param) {
		return 0;
	}
	
	param.command = 'insert';
	param.table = 'series';
	param = JSON.stringify (param);
	
	var confirm;
	do {
		confirm = prompt('Type "insert" to confirm. This operation will also create the EP table for this series');
		if (confirm == null) {
			return 0;
		}
	} while (confirm != "insert");

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&p="+encodeURIComponent(param));
}

function parseSeriesRecord (id, title, thumbnail, isPublic, series_id, season_name, season_order, keywords) {
	if (id=='') {
		alert ("ERROR: 'id' is required");
		return false;
	} 
	id = parseInt(id);
	if (isNaN(id)) {
		alert ("ERROR: Invalid value for 'id'");
		return false;
	} else if (id>4294967295 || id<0) {
		alert ("ERROR: 'id' should be in range 0-4294967295");
		return false;
	}
	
	if (title=='') {
		alert ("ERROR: 'title' is required");
		return false;
	}
	
	if (thumbnail=='') {
		alert ("ERROR: 'thumbnail' is required");
		return false;
	}
	
	if (series_id=='') {
		series_id=null;
	} else {
		series_id = parseInt(series_id);
		if (isNaN(series_id)) {
			alert ("ERROR: Invalid value for 'series_id'");
			return false;
		} else if (series_id>4294967295 || series_id<0) {
			alert ("ERROR: 'series_id' should be in range 0-4294967295");
			return false;
		}
	}
	
	if (season_name=='') {
		if (series_id!==null) {
			alert ("ERROR: 'season_name' must be specified when 'series_id' is specified");
			return false;
		}
		season_name=null;
	}
	
	if (season_order=='') {
		if (series_id!==null) {
			alert ("ERROR: 'season_order' must be specified when 'series_id' is specified");
			return false;
		}
		season_order=null;
	} else {
		season_order = parseInt(season_order);
		if (isNaN(season_order)) {
			alert ("ERROR: Invalid value for 'season_order'");
			return false;
		} else if (season_order>255 || season_order<0) {
            alert ("ERROR: 'season_order' should be in range 0-255");
			return false;
        }
	}
	
	if (keywords=='') {
		alert ("ERROR: 'keywords' is required");
		return false;
	}
	
	return {
		'id': id,
		'title': title,
		'thumbnail': thumbnail, 
		'public': isPublic,
		'series_id': series_id, 
		'season_name': season_name, 
		'season_order': season_order, 
		'keywords': keywords
	};
}

function generate (type) {
	var param = {
		'command': 'generate-'+type
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				setOutput (this.responseText, 'id-output');
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&p="+encodeURIComponent(param));
}


function updateTime (id) {
	var param = {
		'command': 'updatetime',
		'id': id
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&p="+encodeURIComponent(param));
}

/*------------------------------------------------------------------------------------Account Functions------------------------------------------------------------------------------------*/

function getAccountTable () {
	var param = {
		'command': 'get',
		'table': 'account'
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				setOutput (this.responseText);
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&p="+encodeURIComponent(param));
}

function addAccount (button) {
	var record = button.parentNode.parentNode;
	var email = record.getElementsByClassName('email')[0].value;
	var username = record.getElementsByClassName('username')[0].value;
	var password = record.getElementsByClassName('password')[0].value;
	
	var selections = record.getElementsByClassName('user-group')[0].getElementsByTagName('input');
	var user_group='';
	for (var i = 0; i< selections.length; i++) {
		if (selections[i].checked) {
			user_group = selections[i].value;
			break;
		}
	}
	
	
	selections = record.getElementsByClassName('status')[0].getElementsByTagName('input');
	var status='';
	for (i = 0; i< selections.length; i++) {
		if (selections[i].checked) {
			status = selections[i].value;
			break;
		}
	}
	
	var param = parseAccountRecord (email, username, password, user_group, status);
	if (!param) {
		return 0;
	}
	
	if (param.password === null) {
		alert ("ERROR: 'password' is required");
		return 0;
	}
	
	param.command = 'insert';
	param.table = 'account';
	param = JSON.stringify (param);
	
	var confirm;
	do {
		confirm = prompt('Type "insert" to confirm.');
		if (confirm == null) {
			return 0;
		}
	} while (confirm != "insert");

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&p="+encodeURIComponent(param));
}

function modifyAccount (button, originalEmail) {
	var record = button.parentNode.parentNode;
	var email = record.getElementsByClassName('email')[0].value;
	var username = record.getElementsByClassName('username')[0].value;
	var password = record.getElementsByClassName('password')[0].value;
	
	var selections = record.getElementsByClassName('user-group')[0].getElementsByTagName('input');
	var user_group='';
	for (var i = 0; i< selections.length; i++) {
		if (selections[i].checked) {
			user_group = selections[i].value;
			break;
		}
	}
	
	
	selections = record.getElementsByClassName('status')[0].getElementsByTagName('input');
	var status='';
	for (i = 0; i< selections.length; i++) {
		if (selections[i].checked) {
			status = selections[i].value;
			break;
		}
	}
	
	var param = parseAccountRecord (email, username, password, user_group, status);
	if (!param) {
		return 0;
	}
	
	param.command = 'modify';
	param.table = 'account';
	param.original_email = originalEmail;
	param = JSON.stringify (param);

	var confirm;
	do {
		confirm = prompt('Type "modify" to confirm');
		if (confirm == null) {
			return 0;
		}
	} while (confirm != "modify");

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&p="+encodeURIComponent(param));
}

function parseAccountRecord (email, username, password, user_group, status) {
	if (email=='') {
		alert ("ERROR: 'email' is required");
		return false;
	}
	
	if (username=='') {
		alert ("ERROR: 'username' is required");
		return false;
	}
	
	if (password=='') {
		password = null;
	} else if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
		alert ("ERROR: password requirements not met");
		return false;
	} else {
		var hash = forge.md.sha512.sha256.create();
		hash.update(password);
		password = hash.digest().toHex();
	}
	
	if (user_group=='admin') {
		user_group = 0;
	} else if (user_group=='user') {
		user_group = 1;
	} else {
		alert ("ERROR: Invalid value for 'user_group'");
		return false;
	}
	
	if (status=='active') {
		status = 0;
	} else if (status=='deactivated') {
		status = 1;
	} else if (status=='banned') {
		status = 2;
	} else {
		alert ("ERROR: Invalid value for 'status'");
		return false;
	}
	
	return {
		'email': email, 
		'username': username, 
		'password': password, 
		'user_group': user_group, 
		'status': status
	};
}

function deleteAccount (email) {
	var confirm;
	do {
		confirm = prompt('Type "delete" to confirm. Deleting an account is NOT recommended. Use "status" option instead.');
		if (confirm == null) {
			return 0;
		}
	} while (confirm != "delete");
	
	var param = {
		'command': 'delete',
		'table': 'account',
		'email': email
	};
	param = JSON.stringify (param);

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&p="+encodeURIComponent(param));
}

/*------------------------------------------------------------------------------------Invite Functions------------------------------------------------------------------------------------*/

function getInviteTable () {
	var param = {
		'command': 'get',
		'table': 'invite'
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				setOutput (this.responseText);
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&p="+encodeURIComponent(param));
}

/*------------------------------------------------------------------------------------Log Functions------------------------------------------------------------------------------------*/

function getLogTable () {
	var param = {
		'command': 'get',
		'table': 'log'
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				setOutput (this.responseText);
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&p="+encodeURIComponent(param));
}

/*------------------------------------------------------------------------------------Utility Functions------------------------------------------------------------------------------------*/

function setOutput (response, outputElementID) {
	if (outputElementID === undefined) {
		outputElementID = 'output';
	}
	var error = response.includes('ERROR:');
	if (error) {
		alert (response);
	} else {
		document.getElementById(outputElementID).innerHTML = response;
	}
	return !error;
}

function changed (textarea) {
	textarea.parentNode.style.backgroundColor = "yellow";
}
