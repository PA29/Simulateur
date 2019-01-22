$(document).ready(function() {
	$('#simulate').on('click', function() {
		console.log('test');
		direct('resultats');
	});

	$('#accueil').on('click', function() {
		document.location.href = "accueil";
	})
});