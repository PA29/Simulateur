function editionJS() {
	$('#simulate').on('click', function() {
		console.log("Test");
		direct('resultats');
	});

	$('#accueil').on('click', function() {
		document.location.href = "accueil";
	});
}