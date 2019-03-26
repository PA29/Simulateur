function editionJS() {

	initDragDrop();

	// Click sur le bouton de simulation
	$('#simulate').on('click', function() {

		let simulationParam = {grid : grid.simulationParam()};
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
			url: '/simulation',
			type: 'POST',
			data: JSON.stringify(simulationParam),
			contentType: 'application/json',
			success: function(data) {
				grid.simulation = data; // Ajout des résultats à la variable stockant le réseau
				direct('resultats'); // Redirection vers le mode resultats
				grid.startPowerFlow();
				createChart(data);
			}
		});
	});

	// Retour vers l'accueil
	$('#accueil').on('click', function() {
		document.location.href = "/accueil";
	});

	$('#save').on('click', function() {
		console.log("Sauvegarde sous à implémenter : Edition.js ligne 49")
	})

	$('#saveAs').on('click', function() {
		console.log("Sauvegarde sous à implémenter : Edition.js ligne 53");
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
	
function initDragDrop(){
	 
	//écriture de la fonction de gestion du drag and drop

	// gestion de la zone de drop 
	var build_zone = document.querySelector("#build_zone"); //selectionne la zone de construction (à droite quadrillé)
	// parametre la hauteur et la largeur 
	setupBuildZone(build_zone);
	
	// gestion des éléments droppés
	var build_elements = document.querySelectorAll(".build_element"); // selectionne les éléménts de construction (liste de gauche)
	for (var i = 0; i < build_elements.length; i++) { 
		var build_element = build_elements[i];
		setupBuildElement(build_element);
	}
}


function setupBuildZone(build_zone){
	
	//méthode liée à l'événement dragover appelée constament lorsque l'objet est dans la zone de drop  
	build_zone.addEventListener('dragover', function(event) {
	    event.preventDefault(); // Annule l'interdiction de drop
		build_zone.setAttribute("dragover", "true"); // change attribut pour activer du style css si besoin  
	});

	
	//méthode liée à l'événement dragleave appelée lorsquel'objet est hors de la zone de dépôt
	build_zone.addEventListener('dragleave', function(event){
		build_zone.setAttribute("dragover", "false"); // change attribut pour activer du style css si besoin 
	});

	
	//méthode liée à l'événement drop appelée lorsque l'objet est libéré
	build_zone.addEventListener('drop', function(event) {
	    event.preventDefault(); // Cette méthode est toujours nécessaire pour éviter une éventuelle redirection inattendue
	    //alert('Vous avez bien déposé votre élément !');	
		
		drag_position = JSON.parse(event.dataTransfer.getData('text/plain')); //position de la souris par rapport à l'élément attrapé
		drop_position = {"x": event.layerX, "y": event.layerY}; //position de la souris au drop

		// ajouter les méthodes permettant de créer un nouvel élément 
		var canvas_width = canvasGrid.canvas.width;
		var canvas_height = canvasGrid.canvas.height;
	
		position = {
			"x": grid.globalX(canvasGrid.relativeX(drop_position.x - drag_position.x)), 
			"y": grid.globalY(canvasGrid.relativeY(drop_position.y - drag_position.y))
		}; 
		console.log(position);

	    if(position.x < 0) position.x = 0; // évite le drop hors zone
	    if(position.y < 0) position.y = 0; // évite le drop hors zone

		grid.draganddrop = true ;

		grid.newPicture = {type: drag_position.element.name, x: position.x , y: position.y};

		//canvasGrid.drawImage(drag_position.element.name, position, 5);

		//build_zone.addEventListener('mousemove',function(event){

			//mouse_position  = {x: event.layerX*100/canvas_width, y : event.layerY*100/canvas_height};

			//canvasGrid.drawStroke(position, mouse_position);

		//})

		//dessiner la 
		//for (var bus in grid.bus){
			//bus.selection();
		//};

		//for(var i= 0; i < grid.bus.length; i++){
     		//grid.bus[i].selection;
		//};
		
		//pictureBus = grid.selectedBus;

		//picture = new Picture({bus: pictureBus, type: drag_position.element.name, x: position.x , y: position.y})
		//canvasGrid.drawImage(drag_position.element.name, position, size = 5);
		
		//grid.images.push(picture);
		
		//grid.draganddrop = false;

	}); 


}



function setupBuildElement(build_element){
	
	//appliquer les méthodes dues aux événements dragstart drag dragend 
	
	//méthode de l'événement dragstart
	build_element.addEventListener('dragstart', function(event) {
	
		var build_element_position = build_element.getBoundingClientRect(); // on recupere la position de l'element 
		
		drag_position = JSON.stringify({
			"x": event.clientX - build_element_position.x - build_element_position.width/2, //on calcule la position de la souris par rapport au milieu l'élément attrapé
			"y": event.clientY - build_element_position.y - build_element_position.height/2, 
			"element": {
				"name": event.target.getAttribute("id"),
				"image": event.target.getAttribute("src"),
			} // on copie les propriétés
		});

		// event.datatransfer est un stockage lié à l'event
		event.dataTransfer.setData('text/plain', drag_position); // event.datatransfer est un stockage lié à l'event
	}, false);	
}
