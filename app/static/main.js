/* Fichier gérant le changement de fenêtre et le chargement des fichiers */
var fadingTime = 200;

$(document).ready(function() {
	direct('edition');
});

function direct(page) {
	//console.log('direct :' + page);

	$.get(page, function(data) {
		console.log($('body > div > *'));
		if ($('body > div > *').length) $('body > div > *').addClass('fading');
		if ($('head .adaptable').length) $('head .adaptable').addClass('removable');

		$('body').attr('id', page);
		$('#leftPanel').append(data.leftPanel);
		$('#centerPanel').append(data.centerPanel);
		$('#rightPanel').append(data.rightPanel);
		loadFiles(page);

		$('.fading').fadeOut(fadingTime);
		$('body > div > :not(.fading)').delay(fadingTime).fadeIn(fadingTime);
		setTimeout(function() {
			$('.removable, .fading').remove();
		}, fadingTime);
	})
}

function loadFiles(page) {
	$('head').append('<link class="adaptable" href="/static/' + page + '.css" type="text/css" rel="stylesheet">');
	$('head').append('<script class="adaptable" src="/static/' + page + '.js"></script>');
}