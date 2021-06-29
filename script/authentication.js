// JavaScript Document
var user;
var signature = getCookie('signature');
var expires = getCookie('expires');
var uri = getCookie('uri');

function start (currentPage) {
var email = getCookie('email');
var password = getCookie('password');
	
console.log (signature);

if (email == '' || password=='' || signature=='' || expires=='' || uri=='') {
	if (currentPage != 'login') 
		logout ();
	return 0;
}
	
if (parseInt(expires)*1000<Date.now() || password.match(/^[a-f0-9]{64}$/)===null) {
	if (currentPage != 'login')
		logout ();
	return 0;
}

user = {
	email: email,
	password: password
};

if (currentPage == 'login')
	window.location.href = redirect('index.html');
else
	initialize ();
}