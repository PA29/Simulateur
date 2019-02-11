function editionJS() {
	$('#simulate').on('click', function() {
		$.ajax({
			url: 'dureeSimulation',
			type: 'POST',
			data: JSON.stringify(reseau),
			contentType: 'application/json',
			success: function(data) {

				animationSimulation(data.duree)
				$.ajax({
					url: 'simulation',
					type: 'POST',
					data: JSON.stringify(reseau),
					contentType: 'application/json',
					success: function(data) {

						reseau.simulation = data;
						direct('resultats')
					}
				});
			}
		});
	});

	$('#accueil').on('click', function() {
		document.location.href = "accueil";
	});
}

function animationSimulation(duree) {
	console.log("Animation to be developped (duree : " + duree + ")");
}