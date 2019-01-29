/* Fichier gérant le changement de fenêtre et le chargement des fichiers */
var fadingTime = 200;

$(document).ready(function() {
	createReseau();
	direct('edition');
});

window.onresize = function() {
	resizeCanvas();
}

function direct(page) {

	$.get(page, function(data) {
		if ($('.panel').length) $('.panel').addClass('fading');
		if ($('head .adaptable').length) $('head .adaptable').addClass('removable');

		$('body').attr('id', page);
		$('#leftArea').append(data.leftPanel);
		$('#centerArea').append(data.centerPanel);
		$('#rightArea').append(data.rightPanel);

		loadFiles(page);

		$('.fading').fadeOut(fadingTime);
		$('.panel:not(.fading)').delay(fadingTime).fadeIn(fadingTime);
		setTimeout(function() {
			$('.removable, .fading').remove();
		}, fadingTime);
	})
}

function loadFiles(page) {
	$('head').append('<link class="adaptable" href="/static/' + page + '.css" type="text/css" rel="stylesheet">');
	$('head').append('<script class="adaptable" src="/static/' + page + '.js"></script>');
}