// JavaScript Document

function lazyloadInitialize () {
	var elem = document.getElementsByClassName('lazyload');
	var options = {
		rootMargin: '0px 0px 0px ' + window.innerHeight*0.05 + 'px',
		threshold: [0]
	};
	
	for (var i=0; i<elem.length; i++) {
		if (!elem[i].classList.contains('listening')) {
			let callback = function (entries) {
				if(entries[0]['isIntersecting'] === true) {
					let target = entries[0].target;
					if (!target.classList.contains('loaded')) {
						target.classList.add('loaded');
						let imageNode = document.createElement('img');
						imageNode.addEventListener('load', function () {
							target.classList.add('complete');
						});
						if ('crossorigin' in target.dataset) {
							imageNode.setAttribute('crossorigin', target.dataset.crossorigin);
						}
						imageNode.src = target.dataset.src;
						imageNode.alt = 'image placeholder';
						target.appendChild(imageNode);
					}
				}
			};
			let observer = new IntersectionObserver(callback, options);
			observer.observe(elem[i]);
			elem[i].classList.add('listening');
		}
	}
}