
var ctx;
var background;
var canvas = document.querySelector('#chart')
var imgName = "back_chart";
var pointSizeChart = 4;
var x_axis = [2,5,8,11,14,17,20,23,26,29,32,35,38,41,44,47,50,53,56,59,62,65,68,71];
var y_axis = [];
var rawdata = [5.2,3,7,5,9,2.6,7,8,5,4,2,8,6,5]

var pointSizeBis = 2;
var selectionSizeBis = 1;
var images = {};


function createChart () {
	// 1) Création d'un objet jsGraphDisplay
	var graph = new jsGraphDisplay(/*{
		axe: {
			arrow: "",
			thickness: "",
			color: "",
			x: {
				title: "Heure",
				list: "",
				min: "0",
				max: "32",
				step: "2",
				textDisplayEvery: "",
				textSize: "",
				textColor: ""
			},
			y: {
				title: "",
				list: "",
				min: "0",
				max: "35",
				step: "2",
				textDisplayEvery: "",
				textSize: "",
				textColor: ""
			}
		}*/);
	// 2) Ajout des données
	graph.DataAdd({
		data: [
			[4, 21],
			[8, 23],
			[12, 26],
			[16, 25],
			[20, 20],
			[24, 22],
			[28, 27],
			[32, 35]
		]
	});
	// 3) Affichage du résultat
	graph.Draw('chart_0');
}

//Conversion des résultats bruts en coordonnées en %
function y_axis(rawdata){
	var i;
	for (i=0; i<24; i++){
		y_axis[i] = rawdata[i]*100/Math.max(rawdata)
		console.log(y_axis)
	}
}

//Classe définissant un point
function Point(data) {
	let point = new Element(data);

	point.default = function(){
		canvasChart.drawPoint(data, pointSizeChart);
	}
	point.draw = point.default
}

//Classe définissant une ligne
function LineChart(data) {
	let lineChart = new Element(data);

	lineChart.default = function(){
		canvasChart.drawStroke(data[i-1], data[i])
	}
}

// Classe générique pour Point, Line
function Elementbis(data) {
	let instance = this;
	instance.data = data;
	instance.isHovered = false;
	instance.isDragged = false;

	instance.onMouseDown = function(e) {
		if (instance.inside(e.offsetX, e.offsetY)) {
			instance.mousedown = {
				x: e.offsetX - canvasGrid.absoluteX(instance.data.x),
				y: e.offsetY - canvasGrid.absoluteY(instance.data.y)
			};
		}
	}
	instance.onMouseMove = function(e) {
		if (instance.inside(e.offsetX, e.offsetY) && !instance.hasOwnProperty('mousedown') && !instance.isHovered) {
			instance.isHovered = true;
			
			if (instance.hasOwnProperty('hover')) {
				instance.draw = instance.hover;
				grid.draw();
			}
		}
		else if (instance.hasOwnProperty('mousedown') && instance.hasOwnProperty('dragEdit')) {
			instance.dragEdit(e.offsetX, e.offsetY);
			instance.isDragged = true;
		}
		else if (!instance.inside(e.offsetX, e.offsetY) && instance.isHovered) {
			instance.isHovered = false;

			if (instance.draw != instance.default) {
				instance.draw = instance.default;
				grid.draw();
			}
		}
	}
	instance.onMouseUp = function(e) {
		if (instance.hasOwnProperty('mousedown') && !instance.isDragged && instance.hasOwnProperty('onClick')) {
			instance.onClick(instance.mousedown.x, instance.mousedown.y);
		}
		delete instance.mousedown;
		instance.isDragged = false;
	}
}

function background_chart() {
	let picture = new Element();
	console.log("hello");
	console.log(imgName)
  picture.draw = function() {
		canvas.drawImageChart(imgName);
		console.log("draw");
    }
}