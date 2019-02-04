function editionJS() {
	console.log($('#simulate'));
	$('#simulate').on('click', function() {
		direct('resultats');
	});

	$('#accueil').on('click', function() {
		document.location.href = "accueil";
	});
}