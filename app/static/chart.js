var y_axis = [];
var abscisses = [];


function createChart (data) {
	//Création des abscisses
	for (var k=0; k<49; k++){
		abscisses.push(k/2)
	}

	/*// Récupération des données
	var raw_data = [];
	for (var property in data){
		raw_data.push([property])
	console.log(raw_data)
	}*/
	data = new Object(data)
	console.log(Object.keys(data));
	//Création des ordonnées
	var n = 4;
	for (var j=0; j<49; j++){
		y_axis.push(data["results"]["P"][j][0])
	}


	//Création du graphe
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
					textDisplayEvery: "2",
					textSize: "",
					textColor: ""
				}
			});
		// 2) Ajout des données
		donnees = [];
		for(var l=0; l<49; l++){
			donnees.push([abscisses[l], y_axis[l]]);
		};
		graph.DataAdd({
			data: donnees		
		});

		// 3) Affichage du résultat
		console.log('chart_'+i);
		graph.Draw('chart_'+i);
	}
}

/*//Conversion des résultats bruts en coordonnées en %
function y_axis(rawdata){
	var i;
	for (i=0; i<24; i++){
		y_axis[i] = rawdata[i]*100/Math.max(rawdata)
		console.log(y_axis)
	}
}*/

