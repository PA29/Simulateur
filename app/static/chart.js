var y_axis = [];
var abscisses = [];


function createChart (data) {
	//Création des abscisses
	for (var k=1; k<48; k++){
		abscisses.push(k/2)
	}

	/*// Récupération des données
	var raw_data = [];
	for (var property in data){
		raw_data.push([property])
	console.log(raw_data)
	}*/

	data = JSON.parse(data);
	console.log(data["results"]["P"])

	//Création des ordonnées
	var n = 4;
	for (var j=0; j<47; j++){
		y_axis.push(data["results"]["P"][j][n]);
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

