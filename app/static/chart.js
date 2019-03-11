var imgName = "back_chart";
var pointSizeChart = 4;
var x_axis = [2,5,8,11,14,17,20,23,26,29,32,35,38,41,44,47,50,53,56,59,62,65,68,71];
var y_axis = [];


function createChart () {
	canvasChart = new Canvas('chart_0');
	canvasChart.drawImage(imgName, {x:100,y:150, corner:true}, 400);
	var i;
	for (i=0; i<24; i++) {
		Point({x:x_axis[i],y:y_axis[i]})
	}
}

//Conversion des résultats bruts en coordonnées en %
function y_axis(rawdata){
	var i;
	for (i=0; i<24; i++){
		y_axis[i] = rawdata[i]*100/Math.max(rawdata)
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