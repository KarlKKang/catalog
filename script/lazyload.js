// JavaScript Document

function lazyloadInitialize () {
	var elem = document.getElementsByClassName('lazyload');
	const options = {
		root: null,
		rootMargin: '0px 0px 50% 0px',
		threshold: [0]
	};
	
	for (var i=0; i<elem.length; i++) {
		if (!elem[i].classList.contains('listening')) {
			let observer = new IntersectionObserver((entries, observer) => {
				if(entries[0]['isIntersecting'] === true) {
					let target = entries[0].target;
					observer.unobserve(target);
						
					let imageNode = document.createElement('img');
					imageNode.addEventListener('load', function () {
						target.classList.add('complete');
					});
					if ('crossorigin' in target.dataset) {
						imageNode.setAttribute('crossorigin', target.dataset.crossorigin);
					}
					if ('alt' in target.dataset) {
						imageNode.alt = target.dataset.alt;
					} else {
						imageNode.alt = 'image placeholder';
					}
					imageNode.src = target.dataset.src;
					target.appendChild(imageNode);
				}
			}, options);
			observer.observe(elem[i]);
			elem[i].classList.add('listening');
		}
	}
}