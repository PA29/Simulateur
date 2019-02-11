/* Fichier gérant le changement de fenêtre et le chargement des fichiers */
var fadingTime = 200;

$(document).ready(function() {
	createReseau();
	appendContent();
});

window.onresize = function() {
	resizeCanvas();
}

function appendContent() {
	var resultatsLoaded = new Promise(function(resolve, reject) {
		$.get('resultats', function(data) {
			$('#leftArea').append(data.leftPanel);
			$('#centerArea').append(data.centerPanel);
			$('#rightArea').append(data.rightPanel);
			
			resolve();
			resultatsJS();
		});
	});

	$.get('edition', function(data) {
		$('#leftArea').append(data.leftPanel);
		$('#centerArea').append(data.centerPanel);
		$('#rightArea').append(data.rightPanel);

		resultatsLoaded.then(function() {
			editionJS();
		});

		$('body').attr('id', 'edition');
		$('.edition').fadeIn(fadingTime);
	});
}

function direct(page) {
	$('body').attr('id', page);
	$('.panel:not(.' + page + ')').fadeOut(fadingTime);
	$('.' + page).delay(fadingTime).fadeIn(fadingTime);
}