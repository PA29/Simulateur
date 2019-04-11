/* Fichier gérant le changement de fenêtre et le chargement des fichiers */

// Temps de l'animation en fondu
var fadingTime = 200;

// Quand le main.html est chargé, on crée le réseau et on ajoute les panels
$(document).ready(function() {
	createGrid();
	appendContent();
});

// Quand la fenêtre est redimensionnée, on redessine le réseau
window.onresize = function() {
	grid.redraw();
}

// Ajoute tous les panels aux différentes zones (par défaut, ils sont invisibles)
function appendContent() {

	// Chargement du contenu du mode resultats
	var resultsLoaded = new Promise(function(resolve, reject) {
		$.get('/resultats', function(data) {
			$('#leftArea').append(data.leftPanel);
			$('#centerArea').append(data.centerPanel);
			$('#rightArea').append(data.rightPanel);

			resolve(); // Quand le html est chargé, on le signale
			resultatsJS(); // Chargement du javascript
		});
	});

	// Chargement du contenu du mode edition
	$.get('/edition', function(data) {
		$('#leftArea').append(data.leftPanel);
		$('#centerArea').append(data.centerPanel);
		$('#rightArea').append(data.rightPanel);

		// Après que le chargement du html du mode résultat ait été signalé
		resultsLoaded.then(function() {
			editionJS(); // Chargement du javascript
		});

		$('body').attr('id', 'edition'); // On change l'id du body (permet de changer le CSS qui est appliqué)
		$('.edition').fadeIn(fadingTime); // Quand tout a été chargé, on affiche le mode edition en fondu
	});
}

// Permet de changer de mode
function direct(mode) {
	$('body').attr('id', mode);
	$('.panel:not(.' + mode + ')').fadeOut(fadingTime);
	$('.' + mode).delay(fadingTime).fadeIn(fadingTime);
}