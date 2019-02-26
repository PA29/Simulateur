function editionJS() {

	// Click sur le bouton de simulation
	$('#simulate').on('click', function() {

		// Requête pour récupérer le temps estimé du calcul de la simulation
		$.ajax({
			url: 'dureeSimulation',
			type: 'POST',
			data: JSON.stringify(grid),
			contentType: 'application/json',
			success: function(data) {

				animationSimulation(data.duree); // Lancement de l'animation

				let simulationParam = {grid : grid};
				simulationParam.season = false;
				if ($('#ilotage input')[0].checked) {
					if ($('#ilotagePermanent input')[0].checked) {
						simulationParam.ilotage = {ilotagePermanent: true};
					}
					else {
						simulationParam.ilotage = {
							beg: $('#ilotageDebut input').val(),
							end: $('#ilotageFin input').val()
						}
					}
				}

				// Requête pour récupérer les résultats de la simulation
				$.ajax({
					url: 'simulation',
					type: 'POST',
					data: JSON.stringify(simulationParam),
					contentType: 'application/json',
					success: function(data) {

						grid.simulation = data; // Ajout des résultats à la variable stockant le réseau
						direct('resultats'); // Redirection vers le mode resultats
						grid.startPowerFlow();
						console.log("après");
					}
				});
			}
		});
	});

	// Retour vers l'accueil
	$('#accueil').on('click', function() {
		document.location.href = "accueil";
	});

	$('#ilotage input').on('change', function() {
		if (this.checked) {
			$('#dureeIlotage').show();
		}
		else {
			$('#dureeIlotage').hide();
		}
	});

	$('#ilotagePermanent input').on('change', function() {
		if (this.checked) {
			$('#periodeIlotage').hide();
		}
		else {
			$('#periodeIlotage').show();
		}
	})
}

// Animation pendant le calcul de la simulation
function animationSimulation(duree) {
	console.log("Animation to be developped (duree : " + duree + ")");
}