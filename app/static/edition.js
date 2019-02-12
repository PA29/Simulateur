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

				// Requête pour récupérer les résultats de la simulation
				$.ajax({
					url: 'simulation',
					type: 'POST',
					data: JSON.stringify(grid),
					contentType: 'application/json',
					success: function(data) {

						grid.simulation = data; // Ajout des résultats à la variable stockant le réseau
						direct('resultats'); // Redirection vers le mode resultats
					}
				});
			}
		});
	});

	// Retour vers l'accueil
	$('#accueil').on('click', function() {
		document.location.href = "accueil";
	});
}

// Animation pendant le calcul de la simulation
function animationSimulation(duree) {
	console.log("Animation to be developped (duree : " + duree + ")");
}