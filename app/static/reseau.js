var ctx;
var images = {};

var reseau = {
	transfo: {x: 50, y: 10},
	connections: [{x: 50, y: 50}, {x: 25, y: 75}, {x: 75, y: 75}],
	lines: [[null, 0], [0, 1], [0, 2]],
	bus: [{type: "transfo", x: 50, y: 90, line: 1, position: 0.9}]
};

var pointSize = 3;


/* Affichage et interactions avec le réseau */

$(document).ready(function() {

	ctx = initContext();
	drawReseau(reseau);
});

function initContext() {
	let centerArea = document.getElementById('centerArea');
	let canvas = document.getElementById('reseau');

	canvas.width = centerArea.offsetWidth;
	canvas.height = centerArea.offsetHeight;

	return canvas.getContext('2d');
	drawReseau(reseau);
}

function drawReseau(reseau) {
	drawImage('transfo', reseau.transfo);

	for (let conn of reseau.connections) {
		drawConnection(conn);
	}

	for (let line of reseau.lines) {
		drawLine(line);
	}

	for (let bus of reseau.bus) {
		drawBus(bus);
	}
}

function drawConnection(position) {
	ctx.beginPath();
	ctx.arc(absoluteX(position.x), absoluteY(position.y), pointSize, 0, 2 * Math.PI);
	ctx.fill();
}

function drawLine(line) {
	let bus1 = (line[0] == null) ? reseau.transfo : reseau.connections[line[0]], bus2 = reseau.connections[line[1]];
	drawStroke(bus1, bus2);
}

function drawBus(bus) {
	drawImage(bus.type, bus);

	if (Object.keys(bus).includes('connection')) {
		drawStroke(bus, reseau.connections[bus.connection]);
	}
	else if (Object.keys(bus).includes('line')) {
		let line = reseau.lines[bus.line];
		let bus1 = reseau.connections[line[0]], bus2 = reseau.connections[line[1]];
		let busLine = {x: bus.position * bus2.x + (1 - bus.position) * bus1.x, y: bus.position * bus2.y + (1 - bus.position) * bus1.y};
		drawConnection(busLine);
		drawStroke(bus, busLine);
	}
}

function drawStroke(position1, position2) {
	ctx.beginPath();
	ctx.moveTo(absoluteX(position1.x), absoluteY(position1.y));
	ctx.lineTo(absoluteX(position2.x), absoluteY(position2.y));
	ctx.stroke();
}

function drawImage(name, position) {
	let im = new Image();
	im.onload = function() {
		ctx.drawImage(im, absoluteX(position.x) - im.width / 2, absoluteY(position.y) - im.height / 2);
	}
	im.src = '/static/' + name + '.png';
	images[name] = im;
}

function absoluteX(x) {
	return x / 100 * ctx.canvas.width;
}

function absoluteY(y) {
	return y / 100 * ctx.canvas.height;
}