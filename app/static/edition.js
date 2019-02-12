function editionJS() {
	console.log($('#simulate'));
	$('#simulate').on('click', function() {
		background_chart();
		direct('resultats');
	});

	$('#accueil').on('click', function() {
		document.location.href = "accueil";
	});
}