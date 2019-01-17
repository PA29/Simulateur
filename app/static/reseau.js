var ctx;
var images = {};
var reseau = 0;

var getReseau = new Promise(function(resolve, reject) {
	$.get('unScenario', function(data) {
		reseau = convertReseau(data.reseau);
		resolve();
	});
});

function convertReseau(data) {
	let reseau = {bus: [], lines: [], images: []};

	for (let bus of data.bus) {
		reseau.bus.push(new Bus(bus));
	}
	for (let line of data.lines) {
		reseau.lines.push(new Line(line));
	}
	for (let image of data.images) {
		reseau.images.push(new Picture(image));
	}

	return reseau
}

/*var reseau = {
	bus: [new Bus({x: 50, y: 20}), new Bus({x: 50, y: 50}), new Bus({x: 25, y: 75}), new Bus({x: 75, y: 75})],
	lines: [new Line({bus1: 0, bus2: 1, length: 10}), new Line({bus1: 1, bus2: 2, length: 10}), new Line({bus1: 1, bus2: 3, length: 10})],
	images: [new Picture({type: 'transfo', x: 50, y: 10, bus: 0}), new Picture({type: 'transfo', x: 50, y: 90, bus: 2})]
}*/

var pointSize = 3;
var selectionSize = 3;

/* Affichage et interactions avec le réseau */

function createReseau() {
	let canvas = document.getElementById('reseau');
	ctx = canvas.getContext('2d');

	getReseau.then(function() {
		resizeCanvas();
	}).catch(function() {
		console.log("Impossible d'afficher le réseau");
	});

	//initInteractions();
}

function resizeCanvas() {
	let centerArea = document.getElementById('centerArea');
	let canvas = document.getElementById('reseau');
	
	canvas.width = centerArea.offsetWidth;
	canvas.height = centerArea.offsetHeight;

	drawReseau(reseau);
}

function initInteractions() {
	$('#centerArea').on('mousemove', function(e) {
		if (reseau.bus[0].inside(e.offsetX, e.offsetY)) {
			reseau.bus[0].hover();
		}
	});
}

function drawReseau() {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	for (let bus of reseau.bus) {
		bus.draw();
	}

	for (let line of reseau.lines) {
		line.draw();
	}

	for (let image of reseau.images) {
		image.draw();
	}
}

function drawPoint(position, size) {
	ctx.beginPath();
	ctx.arc(absoluteX(position.x), absoluteY(position.y), size, 0, 2 * Math.PI);
	ctx.fill();
}

function drawStroke(position1, position2) {
	ctx.beginPath();
	ctx.moveTo(absoluteX(position1.x), absoluteY(position1.y));
	ctx.lineTo(absoluteX(position2.x), absoluteY(position2.y));
	ctx.stroke();
}

function drawImage(imageName, position) {
	let im = new Image();
	im.onload = function() {
		ctx.drawImage(im, absoluteX(position.x) - im.width / 2, absoluteY(position.y) - im.height / 2);
	}
	im.src = '/static/' + imageName + '.png';
	images[imageName] = im;
}

function absoluteX(x) {
	return x / 100 * ctx.canvas.width;
}

function absoluteY(y) {
	return y / 100 * ctx.canvas.height;
}

function Bus(data) {
	let bus = new Element(data);
	bus.draw = function() {
		drawPoint(data, pointSize);
	}
	bus.inside = function(x, y) {
		return Math.pow(x - absoluteX(data.x), 2) + Math.pow(y - absoluteY(data.y), 2) < Math.pow(pointSize + selectionSize, 2);
	}
	bus.hover = function() {
		drawPoint(data, pointSize + selectionSize);
	}

	return bus;
}

function Line(data) {
	let line = new Element(data);
	line.draw = function() {
		drawStroke(reseau.bus[data.bus1].data, reseau.bus[data.bus2].data);
	}

	return line;
}

function Picture(data) {
	let picture = new Element(data);
	picture.draw = function() {
		drawImage(data.type, data);
		drawStroke(data, reseau.bus[data.bus].data);
	}

	return picture;
}

function Element(data) {
	this.data = data;
}