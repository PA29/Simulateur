var abscisses = [];

function createEmptyChart (){
	console.log("entrée fonction ok")
	for (var k=1; k<49; k++){
		abscisses.push(k/2)
	}

	for (var i=0; i<4; i++){
		// 1) Création d'un objet jsGraphDisplay
			var graph = new jsGraphDisplay({
				axe: {
					arrow: "true",
					thickness: "1",
					color: "",
					},
					x: {
						title: "",
						list: "",
						min: "",
						max: "",
						step: "",
						textDisplayEvery: "",
						textSize: "",
						textColor: ""
					},
					y: {
						title: "",
						list: "",
						min: "",
						max: "",
						step: "",
						textDisplayEvery: "",
						textSize: "",
						textColor: ""
					}
				});
	
			// 2) Ajout des données
			donnees = new Array();
			for(var l=0; l<49; l++){
				donnees.push([abscisses[l], 0]);
			};
	
			graph.DataAdd({
				display: {
					linkType: "",
					linkWidth: "",
					linkColor: "",
					linkFromZero: "",
					linkDash: [],
					dataType: "",
					dataWidth: "4",
					dataColor: ""
				},
				data: donnees	
			});
	
			// 3) Affichage du résultat
			console.log('chart_'+i);
			graph.Draw('chart_'+i);
		}
}


function createChart (busID,variableID,number_chart) {
	var canevas = document.getElementById("chart_"+number_chart);
	var ctx = canevas.getContext("2d");
	ctx.clearRect(0, 0, 600, 300);
	
	//Création des abscisses
	for (var k=1; k<49; k++){
		abscisses.push(k/2)
	}

	/*// Récupération des données
	var raw_data = [];
	for (var property in data){
		raw_data.push([property])
	console.log(raw_data)
	}*/

	data = JSON.parse(grid.simulation);

	//Création des ordonnées
	var n = busID;
	var y_axis =  [];
	for (var j=0; j<47; j++){
		y_axis.push(data["results"][variableID][j][n]);
	}

	//Création du graphe
	/*for (var i=0; i<4; i++){*/
		// 1) Création d'un objet jsGraphDisplay
		var graph = new jsGraphDisplay({
			axe: {
				arrow: "true",
				thickness: "1",
				color: "",
				},
				x: {
					title: "",
					list: "",
					min: "",
					max: "",
					step: "",
					textDisplayEvery: "",
					textSize: "",
					textColor: ""
				},
				y: {
					title: "",
					list: "",
					min: "",
					max: "",
					step: "",
					textDisplayEvery: "",
					textSize: "",
					textColor: ""
				}
			});

		// 2) Ajout des données
		donnees = new Array();
		for(var l=0; l<47; l++){
			donnees.push([abscisses[l], y_axis[l]]);
		};

		graph.DataAdd({
			data: donnees	
		});

		// 3) Affichage du résultat

		graph.Draw('chart_'+number_chart);
	}
